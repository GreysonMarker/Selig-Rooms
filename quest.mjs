import {waddle} from './selig-motion.mjs';
import * as T from './three.module.js';
import {Objective,GRADES as STANDARD_GRADES,ReturnRoute} from './objective.mjs';
import {bindAction} from './controls.mjs';
export function createQuest({impact,world,scene,camera,pos,doors,free,register,beginScene,endScene,getAudio,isMuted,restart}){
 const GRADES=world.ap?[...STANDARD_GRADES,'A','P']:STANDARD_GRADES;
 const gradeName=g=>typeof g==='number'?g+'th grade':g;
 function drawRooms(){
  const pool=world.doors.filter(e=>{
   if(!e.room)return false;
   const [dx,dz]=[[0,1],[-1,0],[0,-1],[1,0]][e.side];
   const clear=d=>free(e.x+dx*d,e.z+dz*d,true);
   const stage=[4.2,3.5,2.8].find(clear);
   return clear(1.7)&&stage&&clear(stage-1.55);
  }).map(e=>e.room);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,GRADES.length);
 }
 let QUEST_ROOMS=drawRooms();
 const state=new Objective(GRADES),root=new T.Group();scene.add(root);const $=id=>document.getElementById(id);
 const QuestMaterial=world.ap?T.MeshLambertMaterial:T.MeshBasicMaterial;
 const material=c=>new QuestMaterial({color:c});const blue=material(0x164cd4),gold=material(0xeac663),skin=material(0xc99576),white=material(0xf2f0dd);
 function cube(w,h,d,mat,x=0,y=0,z=0){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return m;}
 function label(text,w,h,color='#ffffff',bg='#164cd4'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,1024,256);g.fillStyle=color;g.font='bold 78px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,128,980);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new QuestMaterial({map:tex,side:T.DoubleSide}));
 }
 function lanyard(grade){const g=new T.Group();for(const sign of [-1,1]){const band=label('Houston academy',.83,.10);band.position.set(sign*.15,.15,0);band.rotation.z=sign*1.38;g.add(band);}g.add(cube(.075,.13,.025,gold,0,-.31,0));const badge=label(gradeName(grade),.44,.17);badge.position.y=-.46;g.add(badge);return g;}
 function key(){const g=new T.Group(),ring=new T.Mesh(new T.TorusGeometry(.10,.025,8,20),gold);g.add(ring);g.add(cube(.035,.3,.04,gold,0,-.20));g.add(cube(.12,.045,.04,gold,.04,-.30));return g;}
 const hatch=new T.Group();hatch.position.set(world.spawn.x,.04,world.spawn.z);hatch.add(cube(1.65,.06,1.65,material(0x394342)));for(const x of [-.7,.7])hatch.add(cube(.04,.015,1.4,gold,x,.04));const plaque=label('HATCH / EXIT',1.15,.3,'#eac663','#283331');plaque.rotation.x=-Math.PI/2;plaque.position.set(0,.045,.4);hatch.add(plaque);root.add(hatch);
 const hatchItem={netType:'escape',netIndex:0,label:'Hatch locked',interact(){if(state.phase==='return'){state.escape();elapsed=0;beginScene();$('routePanel').hidden=true;}else notice('The exit lock needs Selig’s key.');}};register(hatch,hatchItem);
 const pickups=QUEST_ROOMS.map((id,i)=>{
  const e=world.doors.find(d=>d.room===id),inward=e.side===0?[0,1]:e.side===1?[-1,0]:e.side===2?[0,-1]:[1,0];
  const g=lanyard(GRADES[i]);g.position.set(e.x+inward[0]*1.7,1.2,e.z+inward[1]*1.7);g.rotation.y=Math.atan2(-inward[0],-inward[1]);root.add(g);const glass=cube(.65,1.35,.22,new QuestMaterial({color:0xa5c4e3,transparent:true,opacity:.12}),0,0,-.07);g.add(glass);
  const stand=cube(.65,.6,.4,material(0x343b37),g.position.x,.3,g.position.z);root.add(stand);
  const item={netType:'collect',netIndex:GRADES[i],label:'Take '+gradeName(GRADES[i])+' lanyard',interact(){if(!state.collect(GRADES[i]))return;g.visible=false;g.traverse(o=>o.raycast=()=>{});notice(gradeName(GRADES[i])+' collected');refresh();if(state.phase==='scene')startScene(QUEST_ROOMS[i]);}};register(g,item);return {g,stand,item};
 });
 const arm=new T.Group();camera.add(arm);scene.add(camera);arm.visible=false;arm.add(cube(.16,.18,.85,white,.32,-.4,-.65));arm.add(cube(.18,.13,.27,skin,.32,-.33,-1.04));const held=GRADES.map((grade,i)=>{const g=lanyard(grade);g.scale.setScalar(.48);g.position.set(.15+i*.09,-.35,-1.2);arm.add(g);return g;});
 let elapsed=0,lastStage=-1,sceneRoom=null,lookYaw=0,entry=new T.Vector3(),finish=new T.Vector3(),route=null,mapClock=0,toastTime=0,sources=[],speech=null,explosionAt=10;
 const actor=new T.Mesh(new T.PlaneGeometry(2.7,2.25),new QuestMaterial({map:new T.TextureLoader().load('./assets/selig.png'),transparent:true,alphaTest:.12,side:T.DoubleSide}));actor.material.map.colorSpace=T.SRGBColorSpace;actor.visible=false;root.add(actor);
 const chorus=world.ap?[actor.clone(),actor.clone()]:[];
 chorus.forEach(m=>root.add(m));
 const freedomLine=world.ap?'The lanyards! The lanyards! We’re finally free!':'The lanyards! The lanyards! I’m finally free!';
 const trophy=new T.Group();GRADES.forEach((grade,i)=>{const g=lanyard(grade);g.scale.setScalar(.48);g.position.set((i-2)*.12,-.2,.1);trophy.add(g);});trophy.visible=false;root.add(trophy);
 const drop=new T.Group(),exitKey=key(),paper=label('MAP → HATCH',.65,.3,'#14221b','#e5dbc0');drop.add(exitKey);paper.position.set(.5,0,0);drop.add(paper);drop.visible=false;root.add(drop);const dropItem={netType:'key',netIndex:0,label:'Take exit key + map',interact(){if(state.phase!=='drop')return;state.takeKey();drop.visible=false;drop.traverse(o=>o.raycast=()=>{});hatchItem.label='Unlock hatch / escape';route=new ReturnRoute((x,z)=>free(x,z,true),world.spawn);$('routePanel').hidden=false;refresh();}};register(drop,dropItem);
 const count=100,positions=new Float32Array(count*3),velocities=Array.from({length:count},(_,i)=>new T.Vector3(Math.sin(i*17)*3,1+Math.random()*3,Math.cos(i*13)*3));const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));const smoke=new T.Points(geo,new T.PointsMaterial({color:0xd4c9ab,size:.20,transparent:true,opacity:0}));smoke.visible=false;root.add(smoke);
 function notice(s){$('questToast').textContent=s;toastTime=4;}
 function refresh(){const n=state.grades.size;$('objective').textContent=state.phase==='search'?`Houston Academy lanyards · ${n}/${GRADES.length}`:state.phase==='drop'?'Take the fallen key and map':state.phase==='return'?'Follow the map · Return to the hatch':'';$('gradeList').textContent=GRADES.map(g=>(state.grades.has(g)?'✓ ':'○ ')+gradeName(g).replace(' grade','')).join('   ');}
 function sound(kind){const a=getAudio();if(!a||isMuted())return;const duration=kind==='gasp'?.65:kind==='boom'?1.4:1.8,b=a.createBuffer(1,a.sampleRate*duration,a.sampleRate),data=b.getChannelData(0);for(let i=0;i<data.length;i++){const t=i/a.sampleRate,envelope=kind==='gasp'?Math.sin(Math.PI*t/duration):Math.exp(-t*3);data[i]=(Math.random()*2-1)*envelope*.55;}const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=b;f.type=kind==='gasp'?'bandpass':'lowpass';f.frequency.value=kind==='gasp'?1300:kind==='boom'?500:220;g.gain.value=.7;src.connect(f).connect(g).connect(a.destination);src.start();sources.push(src);}
 function say(){if(isMuted()||!window.speechSynthesis)return;window.speechSynthesis.cancel();speech=new SpeechSynthesisUtterance(freedomLine);speech.rate=1.12;speech.pitch=.65;speech.onboundary=e=>{if(e.charIndex>=speech.text.indexOf('free'))explosionAt=Math.min(explosionAt,elapsed+.7);};window.speechSynthesis.speak(speech);}
 function stopSound(){for(const s of sources)try{s.stop();}catch{}sources=[];window.speechSynthesis?.cancel();}
 function startScene(id){elapsed=0;explosionAt=10;lastStage=-1;sceneRoom=world.rooms[id];const e=world.doors.find(d=>d.room===id),v=e.side===0?[0,1]:e.side===1?[-1,0]:e.side===2?[0,-1]:[1,0];entry.set(e.x,1.125,e.z);let chosen=null;for(const distance of [4.2,3.5,2.8]){const p={x:e.x+v[0]*distance,z:e.z+v[1]*distance};if(free(p.x,p.z)){chosen=p;break;}}if(chosen){pos.x=chosen.x;pos.z=chosen.z;}lookYaw=Math.atan2(pos.x-entry.x,pos.z-entry.z);finish.set(pos.x-Math.sin(lookYaw)*1.55,1.125,pos.z-Math.cos(lookYaw)*1.55);beginScene();actor.visible=true;actor.position.copy(entry);const door=doors.find(d=>d.edge.room===id);door.target=door.angle=Math.PI/2;door.open=true;door.group.rotation.y=door.pose.base+door.angle;refresh();}
 function drawMap(){const canvas=$('returnMap'),g=canvas.getContext('2d'),size=240,scale=size/(world.N*world.S);g.fillStyle='#101712';g.fillRect(0,0,size,size);for(let z=0;z<world.N;z++)for(let x=0;x<world.N;x++)if(world.map[z][x]){g.fillStyle=world.map[z][x]===2?'#51554a':'#303f37';g.fillRect(x*world.S*scale,z*world.S*scale,world.S*scale,world.S*scale);}g.strokeStyle='#141913';g.lineWidth=1;for(const b of world.boundaries){if(b.door)continue;g.beginPath();g.moveTo((b.x-(b.vertical?0:world.S/2))*scale,(b.z-(b.vertical?world.S/2:0))*scale);g.lineTo((b.x+(b.vertical?0:world.S/2))*scale,(b.z+(b.vertical?world.S/2:0))*scale);g.stroke();}const path=route.path(pos);g.strokeStyle='#71f1bd';g.lineWidth=2.5;g.beginPath();path.forEach((p,i)=>i?g.lineTo(p.x*scale,p.z*scale):g.moveTo(p.x*scale,p.z*scale));g.stroke();g.fillStyle='#efca66';g.fillRect(world.spawn.x*scale-3,world.spawn.z*scale-3,6,6);g.fillStyle='#fff';g.beginPath();g.arc(pos.x*scale,pos.z*scale,3,0,Math.PI*2);g.fill();$('routeHint').textContent=path.length?'White: you · Gold: hatch · Open doors along the line':'Drawing route…';}
 function update(dt,active){if(!active)return;if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('questToast').textContent='';}if(route){route.build();mapClock-=dt;if(mapClock<=0){mapClock=.25;drawMap();}}if(state.phase==='drop'){drop.rotation.y+=dt;return;}if(state.phase==='escape'){elapsed+=dt;camera.position.y=1.68-elapsed*.7;$('questFade').style.opacity=Math.min(1,elapsed/2);if(elapsed>2.2){state.phase='won';$('victory').hidden=false;}return;}if(state.phase!=='scene')return;
  elapsed+=dt;const t=elapsed,stage=t<1.5?0:t<3?1:t<4.2?2:t<5?3:t<explosionAt?4:t<explosionAt+2?5:6;
  if(stage!==lastStage){lastStage=stage;if(stage===0){sound('crash');$('subtitle').textContent='';}if(stage===1){arm.visible=true;sound('gasp');}if(stage===3){trophy.visible=true;arm.visible=false;held.forEach(g=>g.visible=false);}if(stage===4){$('subtitle').textContent=freedomLine.toUpperCase();say();}if(stage===5){window.speechSynthesis?.cancel();sound('boom');actor.visible=false;trophy.visible=false;smoke.visible=true;smoke.position.copy(finish);drop.visible=true;drop.position.copy(finish);drop.position.y=1.6;$('subtitle').textContent=freedomLine.toUpperCase().replace('FREE!','FREE—');}if(stage===6){state.drop();smoke.visible=false;arm.visible=false;$('subtitle').textContent='';endScene(lookYaw);refresh();}}
  camera.rotation.set(0,lookYaw,0);camera.position.set(pos.x,1.68,pos.z);actor.rotation.y=Math.atan2(pos.x-actor.position.x,pos.z-actor.position.z);
  if(stage===0){actor.position.copy(entry).lerp(finish,Math.min(.3,t*.2));camera.position.x+=Math.sin(t*91)*.06;camera.rotation.z=Math.sin(t*71)*.025;actor.rotation.z=Math.sin(t*90)*.07;}
  if(stage===2||stage===3){actor.position.copy(entry).lerp(finish,Math.min(1,(t-3)/1.2));actor.rotation.z=Math.sin(t*20)*.12;}
  if(stage===4){actor.position.copy(finish);actor.position.y+=Math.abs(Math.sin(t*10))*.35;actor.position.x+=Math.sin(t*7)*.3;actor.rotation.z=Math.sin(t*9)*.2;actor.scale.x=1+Math.sin(t*12)*.12;}
  if(world.ap){
   const forward=new T.Vector3(Math.sin(lookYaw),0,Math.cos(lookYaw));
   const side=new T.Vector3(forward.z,0,-forward.x);
   [actor,...chorus].forEach((m,i)=>{
    const sign=[0,-1,1][i],u=Math.max(0,Math.min(1,(t-i*.62)/3.2));
    m.visible=stage<5&&t>=i*.62;
    if(!m.visible)return;
    // Viewed from the room, the leader forms the back of the arc.
    m.position.copy(entry).lerp(finish,u).addScaledVector(forward,-.75*u)
     .addScaledVector(side,sign*1.65*u*u).addScaledVector(forward,.70*Math.abs(sign)*u*u);
    m.position.y=1.125;m.scale.setScalar(.73);
    m.rotation.y=Math.atan2(pos.x-m.position.x,pos.z-m.position.z);
    waddle(m,dt,impact);
   });
   camera.fov=2*Math.atan(Math.tan(76*Math.PI/360)/Math.min(1,camera.aspect/1.45))*180/Math.PI;
   camera.updateProjectionMatrix();
   if(stage>=6){camera.fov=76;camera.updateProjectionMatrix();}
  }
  trophy.position.copy(actor.position);trophy.rotation.copy(actor.rotation);
  if(stage===5){const age=t-explosionAt;smoke.material.opacity=Math.max(0,1-age/2);for(let i=0;i<count;i++){positions[i*3]=velocities[i].x*age;positions[i*3+1]=velocities[i].y*age-age*age;positions[i*3+2]=velocities[i].z*age;}geo.attributes.position.needsUpdate=true;drop.position.y=Math.max(.45,1.6-age*age*2);camera.rotation.z=Math.sin(age*90)*.04*Math.exp(-age*4);}
 }
 function relocate(ids){
  QUEST_ROOMS=ids;
  pickups.forEach(({g,stand},i)=>{
   const e=world.doors[ids[i]],v=[[0,1],[-1,0],[0,-1],[1,0]][e.side];
   g.position.set(e.x+v[0]*1.7,1.2,e.z+v[1]*1.7);
   g.rotation.y=Math.atan2(-v[0],-v[1]);stand.position.set(g.position.x,.3,g.position.z);
  });
 }
 function reset(){chorus.forEach(m=>m.visible=false);camera.fov=76;camera.updateProjectionMatrix();relocate(drawRooms());stopSound();state.reset();elapsed=0;route=null;arm.visible=false;trophy.visible=false;held.forEach(g=>g.visible=true);actor.visible=false;actor.scale.set(1,1,1);drop.visible=false;smoke.visible=false;hatchItem.label='Hatch locked';pickups.forEach(({g,item})=>{g.visible=true;g.traverse(o=>{if(o.isMesh){o.raycast=T.Mesh.prototype.raycast;o.userData.interactable=item;}});});drop.traverse(o=>{if(o.isMesh)o.raycast=T.Mesh.prototype.raycast;});$('victory').hidden=true;$('routePanel').hidden=true;$('questFade').style.opacity=0;$('subtitle').textContent='';refresh();}
 bindAction($('playAgain'),restart);refresh();return {state,update,reset,stopSound,
 setShirt(color){white.color.setHex(color);},
 snapshot(){return {rooms:QUEST_ROOMS,phase:state.phase,grades:[...state.grades],room:sceneRoom?.id,elapsed,drop:{x:drop.position.x,z:drop.position.z}};},
 apply(s){if(!s)return;if(s.rooms?.some((id,i)=>QUEST_ROOMS[i]!==id))relocate(s.rooms);for(const grade of s.grades||[]){state.grades.add(grade);const p=pickups[GRADES.indexOf(grade)];if(p){p.g.visible=false;p.g.traverse(o=>o.raycast=()=>{});}}
 const order=['search','scene','drop','return','escape','won'],target=order.indexOf(s.phase);
 if(target>=1&&state.phase==='search'){state.phase='scene';startScene(s.room??QUEST_ROOMS[4]);}
 if(state.phase==='scene'&&s.phase==='scene')elapsed=Math.max(elapsed,s.elapsed||0);
 if(target>=2&&state.phase==='scene'){elapsed=explosionAt+2.1;update(.001,true);drop.position.set(s.drop?.x??finish.x,.45,s.drop?.z??finish.z);}
 if(target>=3&&state.phase==='drop')dropItem.interact();
 if(target>=4&&state.phase==='return')hatchItem.interact();
 if(target>=5&&state.phase==='escape'){elapsed=3;update(.001,true);}refresh();},get cinematic(){return ['scene','escape','won'].includes(state.phase);},get monsterGone(){return !['start','search'].includes(state.phase);}};
}
