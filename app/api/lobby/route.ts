import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
const json=(v:any,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const avatar=(a:any)=>({gender:a?.gender==='female'?'female':'male',shirt:['royal','columbia','white'].includes(a?.shirt)?a.shirt:'royal'});
const position=(p:any)=>({x:Number.isFinite(p?.x)?Math.max(0,Math.min(125,p.x)):10.24,z:Number.isFinite(p?.z)?Math.max(0,Math.min(125,p.z)):13.44,yaw:Number.isFinite(p?.yaw)?p.yaw:0,moving:!!p?.moving});
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')&&new URL(req.headers.get('origin')!).host!==new URL(req.url).host)return json({error:'Wrong origin'},403);
  const text=await req.text();if(text.length>60000)return json({error:'Request too large'},413);const b=JSON.parse(text),db=env.DB!;if(!db)return json({error:'Lobby service unavailable'},503);const now=Date.now();
  if(b.op==='create'||b.op==='join'){
   const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID(),name=String(b.name||'Student').trim().slice(0,20)||'Student';let code=String(b.code||'').toUpperCase().replace(/[^A-Z2-9]/g,'');
   if(b.op==='create'){
    code=Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join('');
    await db.prepare('INSERT INTO rooms(code,host,status,state,updated) VALUES(?,?,?,?,?)').bind(code,id,'lobby','{}',now).run();
   }
   const room:any=await db.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();if(!room||room.updated<now-90000)return json({error:'Room not found or expired'},404);if(room.status!=='lobby')return json({error:'This match already started'},409);
   await db.prepare('DELETE FROM players WHERE room=? AND updated<?').bind(code,now-30000).run();
   const result=await db.prepare('INSERT INTO players(id,room,token,name,avatar,position,updated) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM players WHERE room=?)<4 AND EXISTS(SELECT 1 FROM rooms WHERE code=? AND status=?)').bind(id,code,token,name,JSON.stringify(avatar(b.avatar)),JSON.stringify(position(null)),now,code,code,'lobby').run();
   if(!result.meta.changes)return json({error:'Lobby is full or has started'},409);return json({id,token,code,host:room.host===id});
  }
  const token=req.headers.get('authorization')?.replace(/^Bearer /,'');const player:any=await db.prepare('SELECT * FROM players WHERE id=? AND token=?').bind(String(b.id||''),token||'').first();if(!player)return json({error:'Session ended. Join again.'},401);
  const room:any=await db.prepare('SELECT * FROM rooms WHERE code=?').bind(player.room).first();if(!room||room.status==='closed')return json({error:'The host closed this lobby.'},410);
  const isHost=room.host===player.id;const host:any=await db.prepare('SELECT updated FROM players WHERE id=?').bind(room.host).first();if(!isHost&&(!host||host.updated<now-30000))return json({error:'Host disconnected. Create or join a new lobby.'},410);
  if(b.op==='leave'){if(isHost)await db.prepare('UPDATE rooms SET status=?,updated=? WHERE code=?').bind('closed',now,room.code).run();await db.prepare('DELETE FROM players WHERE id=?').bind(player.id).run();return json({ok:true});}
  if(b.op==='start'){if(!isHost)return json({error:'Only the host can start'},403);await db.prepare('UPDATE rooms SET status=?,updated=? WHERE code=? AND status=?').bind('playing',now,room.code,'lobby').run();}
  if(b.op==='sync'||b.op==='start'){
   await db.prepare('UPDATE players SET position=?,updated=? WHERE id=?').bind(JSON.stringify(position(b.position)),now,player.id).run();
   if(isHost){if(b.state&&room.status!=='lobby'){await db.prepare('UPDATE rooms SET state=?,updated=? WHERE code=?').bind(JSON.stringify(b.state),now,room.code).run();}else await db.prepare('UPDATE rooms SET updated=? WHERE code=?').bind(now,room.code).run();}
   if(b.event&&room.status==='playing'&&['door','collect','key','escape'].includes(b.event.type)){
    const payload={type:b.event.type,index:Number(b.event.index)||0};await db.prepare('INSERT OR IGNORE INTO events(room,player,nonce,payload) VALUES(?,?,?,?)').bind(room.code,player.id,String(b.event.nonce).slice(0,100),JSON.stringify(payload)).run();
   }
   const members=await db.prepare('SELECT id,name,avatar,position FROM players WHERE room=? AND updated>? ORDER BY id').bind(room.code,now-30000).all();
   const latest:any=await db.prepare('SELECT status,state FROM rooms WHERE code=?').bind(room.code).first();
   let events:any[]=[];if(isHost){const q=await db.prepare('SELECT id,player,payload FROM events WHERE room=? AND id>? ORDER BY id LIMIT 100').bind(room.code,Math.max(0,Number(b.ack)||0)).all();events=q.results;await db.prepare('DELETE FROM events WHERE room=? AND id<=?').bind(room.code,Math.max(0,Number(b.ack)||0)).run();}
   return json({status:latest.status,state:JSON.parse(latest.state),players:members.results.map((p:any)=>({...p,avatar:JSON.parse(p.avatar),position:JSON.parse(p.position)})),events:events.map((e:any)=>({...e,payload:JSON.parse(e.payload)}))});
  }return json({error:'Unknown operation'},400);
 }catch(e){console.error('Lobby request failed',e);return json({error:'Lobby request failed. Please retry.'},500);}
}
