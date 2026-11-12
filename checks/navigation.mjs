import assert from 'node:assert/strict';
import {createWorld} from '../public/play/world.mjs';
import {furnish} from '../public/play/rooms.mjs';
const w=createWorld(),obs=[],buckets=new Map();let geometry=0;
furnish(w,()=>geometry++,(x,z,width,depth)=>obs.push({x,z,w:width/2+.25,d:depth/2+.25}));
for(const o of obs)for(let x=Math.floor((o.x-o.w)/w.S);x<=Math.floor((o.x+o.w)/w.S);x++)for(let z=Math.floor((o.z-o.d)/w.S);z<=Math.floor((o.z+o.d)/w.S);z++){const k=x+','+z;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(o)}
const free=(x,z)=>{for(const a of [-.25,.25])for(const b of [-.25,.25])if(!w.map[Math.floor((z+b)/w.S)]?.[Math.floor((x+a)/w.S)])return false;for(const o of buckets.get(Math.floor(x/w.S)+','+Math.floor(z/w.S))??[])if(Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d)return false;return true};
assert.equal(w.rooms.length,36);assert.equal(w.doors.length,36);assert.equal(new Set(w.rooms.slice(1).map(r=>r.type)).size,30);assert(free(w.spawn.x,w.spawn.z),'Spawn collision');
const step=.4,M=w.N*8,seen=new Uint8Array(M*M),q=[],start=[Math.floor(w.spawn.x/step),Math.floor(w.spawn.z/step)];q.push(start[0]+start[1]*M);seen[q[0]]=1;
for(let i=0;i<q.length;i++){let k=q[i],x=k%M,z=Math.floor(k/M);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){let a=x+dx,b=z+dz,j=a+b*M;if(a>=0&&a<M&&b>=0&&b<M&&!seen[j]&&free((a+.5)*step,(b+.5)*step)){seen[j]=1;q.push(j)}}}
let failed=[];for(const d of w.doors){const r=w.rooms[d.room],inward=d.side===0||d.side===3?1:-1;const x=d.x+(d.vertical?inward:0),z=d.z+(d.vertical?0:inward);if(!seen[Math.floor(x/step)+Math.floor(z/step)*M])failed.push(r.name)}
assert.deepEqual(failed,[],'Unreachable room interiors');
assert(w.map[0].every(v=>!v)&&w.map.at(-1).every(v=>!v)&&w.map.every(row=>!row[0]&&!row.at(-1)),'Outer boundary');
console.log(JSON.stringify({rooms:w.rooms.length,newUniqueRooms:30,reachableDoorInteriors:w.doors.length,walkableSamples:q.length,furnitureAndArchitectureBoxes:geometry,widthMeters:w.N*w.S}));
