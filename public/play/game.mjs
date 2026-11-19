import {footfall,waddle} from './selig-motion.mjs';
import {createIntro} from './ap-intro.mjs';
import {multiplayer} from './multiplayer.mjs';
import {toggleGameFullscreen} from './game-browser.mjs';
import * as T from './three.module.js';
import {createQuest} from './quest.mjs';
import {createWorld} from './world.mjs';
import {furnish} from './rooms.mjs';
import {MonsterMusic} from './monster-music.mjs';
import {JumpScare} from './jumpscare.mjs';
import {Hunter,clearLine,DETECTION_RADIUS} from './hunter.mjs';
import {createDetectionClear} from './detection.mjs';
import {bindAction} from './controls.mjs';
import {WALK_SPEED,SPRINT_SPEED,LOOK,Stamina,doorPose,doorCollision,awayAngle} from './mechanics.mjs';
let intro,coop,dead={},targetPlayer=null,spectateIndex=0,teamLost=false;
const $=id=>document.getElementById(id);const ap=sessionStorage.getItem('seligLaunch')==='ap';
sessionStorage.removeItem('seligLaunch');
document.body.classList.toggle('ap',ap);
const world=createWorld(ap),{N,S,map,rooms,fixtures,rand}=world;
let renderer;try{renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance'});}catch(e){$('error').style.display='block';$('error').textContent='This device could not start WebGL. Try opening the game in Safari or Chrome.';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x101310);document.body.prepend(renderer.domElement);
const scene=new T.Scene();scene.fog=new T.FogExp2(0x111612,.037);const camera=new T.PerspectiveCamera(76,innerWidth/innerHeight,.07,65);camera.rotation.order='YXZ';
scene.add(new T.HemisphereLight(0xc7d0b5,0x625c50,1.0));
function texture(kind){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');let d=ctx.createImageData(128,128);for(let i=0;i<d.data.length;i+=4){let v=kind==='carpet'?85:183;v+=(rand()-.5)*(kind==='carpet'?36:13);d.data[i]=v;d.data[i+1]=v+(kind==='carpet'?0:1);d.data[i+2]=v-(kind==='carpet'?5:10);d.data[i+3]=255}ctx.putImageData(d,0,0);if(kind==='carpet'){ctx.strokeStyle='#22222220';ctx.strokeRect(0,0,127,127);for(let n=0;n<80;n++){ctx.fillStyle='#c0bba80b';ctx.fillRect(rand()*128,rand()*128,2,rand()*20)}}const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;return t;}
const mats={wall:new T.MeshLambertMaterial({map:texture('wall'),color:0xb6b5a5}),floor:new T.MeshLambertMaterial({map:texture('carpet'),color:0xa2a39b}),ceiling:new T.MeshLambertMaterial({color:0xb5b7a8}),black:new T.MeshLambertMaterial({color:0x171c1a}),trim:new T.MeshLambertMaterial({color:0x454942}),wood:new T.MeshLambertMaterial({color:0xb5a37b}),metal:new T.MeshLambertMaterial({color:0x858f8d}),seat:new T.MeshLambertMaterial({color:0x57616b}),light:new T.MeshBasicMaterial({color:0xd0d7b8}),dead:new T.MeshLambertMaterial({color:0x6a6f61})};
const darkRoom=rooms.at(-1);
const inDark=(x,z)=>ap&&x>=(darkRoom.x-1)*S&&z>=(darkRoom.z-1)*S;
if(ap){for(let i=fixtures.length-1;i>=0;i--)if(inDark(fixtures[i].x,fixtures[i].z))fixtures.splice(i,1);}
const boxes={};const obstacles=[];function box(mat,x,y,z,w,h,d,color){(boxes[mat]??=[]).push({x,y,z,w,h,d,color});}function block(x,z,w,d){obstacles.push({x,z,w:w/2+.25,d:d/2+.25})}
// Deterministic baked light falloff plus a small pool of nearby actual lights.
function glow(x,z){let best=0;for(let i=0;i<fixtures.length;i++){const f=fixtures[i],d=(f.x-x)**2+(f.z-z)**2;if(d<80)best=Math.max(best,f.power/(1+d*.2));}return .23+best*.62;}
for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++)if(map[z][x]){const X=(x+.5)*S,Z=(z+.5)*S,b=glow(X,Z);box('floor',X,-.045,Z,S,.09,S,b);box('black',X,3.18,Z,S,.1,S,.6);box('ceiling',X,3.08,Z,S-.10,.11,S-.22,b*.82);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])if(!map[z+dz][x+dx]){let wx=X+dx*S/2,wz=Z+dz*S/2;box('wall',wx,1.53,wz,dx?.14:S,3.06,dz?.14:S,b);box('trim',wx-dx*.085,.085,wz-dz*.085,dx?.045:S,.17,dz?.045:S,b*.8);}}
for(const f of fixtures){box('black',f.x,f.y+.046,f.z,1.86,.07,.22,.7);box('light',f.x,f.y,f.z,1.72,.016,.115,.7+f.power*.2)}
furnish(world,box,block);
// Shared muted materials preserve the dark institutional palette.
for(const [key,color] of Object.entries({paper:0xc7c6b5,chalk:0x263d37,teal:0x486b70,rust:0x784b47,ochre:0x9b8951}))mats[key]=new T.MeshLambertMaterial({color});
for(const r of rooms){if(!r.id)continue;const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#bbb9a5';ctx.fillRect(0,0,768,128);ctx.fillStyle='#303c39';ctx.font='bold 30px sans-serif';ctx.fillText(String(r.id).padStart(2,'0')+' / '+r.name.toUpperCase(),22,72,720);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(2.9,.48),new T.MeshLambertMaterial({map:tex}));sign.position.set((r.x+r.w/2)*S-3.75,2.62,r.z*S+.22);scene.add(sign)}
const unit=new T.BoxGeometry(1,1,1),dummy=new T.Object3D();for(const [key,items] of Object.entries(boxes)){const chunks=new Map();for(const b of items){const key=Math.floor(b.x/20)+','+Math.floor(b.z/20);if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(b)}for(const batch of chunks.values()){const mesh=new T.InstancedMesh(unit,mats[key],batch.length);batch.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.scale.set(b.w,b.h,b.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color().setScalar(b.color??1))});mesh.castShadow=mesh.receiveShadow=ap;mesh.computeBoundingSphere();scene.add(mesh)}}
const obstacleCells=new Map();for(const o of obstacles){for(let x=Math.floor((o.x-o.w)/S);x<=Math.floor((o.x+o.w)/S);x++)for(let z=Math.floor((o.z-o.d)/S);z<=Math.floor((o.z+o.d)/S);z++){const key=x+','+z;if(!obstacleCells.has(key))obstacleCells.set(key,[]);obstacleCells.get(key).push(o)}}
const doorObjects=world.doors.map(edge=>{
 const d={edge,pose:doorPose(edge),angle:0,target:0,open:false};const group=new T.Group();group.position.set(d.pose.x,0,d.pose.z);group.rotation.y=d.pose.base;
 const leaf=new T.Mesh(new T.BoxGeometry(1.42,2.3,.07),mats.wood);leaf.position.set(.71,1.15,0);group.add(leaf);
 for(const side of [-1,1]){const handle=new T.Mesh(new T.BoxGeometry(.15,.045,.09),mats.metal);handle.position.set(1.23,1,side*.07);group.add(handle)}
 group.traverse(o=>{if(o.isMesh){o.userData.interactable=d;o.castShadow=o.receiveShadow=ap;}});d.group=group;scene.add(group);return d;
});
// Door poses change, but every possible swing stays inside these fixed buckets.
const doorCells=new Map();for(const d of doorObjects){for(let x=Math.floor((d.pose.x-1.8)/S);x<=Math.floor((d.pose.x+1.8)/S);x++)for(let z=Math.floor((d.pose.z-1.8)/S);z<=Math.floor((d.pose.z+1.8)/S);z++){const key=x+','+z;if(!doorCells.has(key))doorCells.set(key,[]);doorCells.get(key).push(d)}}
const stamina=new Stamina(ap?6:4);let sprintToggle=false,targetInteraction=null,interactionTick=0;const raycaster=new T.Raycaster();raycaster.far=2.7;const interactions=new Set(doorObjects);
function updateTarget(){raycaster.setFromCamera(new T.Vector2(0,0),camera);const hit=raycaster.intersectObjects(scene.children,true).find(hit=>{let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});const candidate=hit?.object.userData.interactable;targetInteraction=candidate&&interactions.has(candidate)?candidate:null;$('interact').classList.toggle('unavailable',!targetInteraction);$('interact').setAttribute('aria-disabled',String(!targetInteraction));$('interact').textContent=targetInteraction?(doorObjects.includes(targetInteraction)?(targetInteraction.open?'Close door':'Open door'):(targetInteraction.label||'Interact')):'Interact';}
function interact(){if(intro?.active||!playing||quest.cinematic||(coop?.active&&dead[coop.id]))return;scene.updateMatrixWorld(true);updateTarget();const d=targetInteraction;if(!d)return;if(coop?.active&&!coop.host){if(doorObjects.includes(d))coop.command('door',doorObjects.indexOf(d));else if(d.netType)coop.command(d.netType,d.netIndex);return;}if(doorObjects.includes(d)){if(Math.abs(d.angle-d.target)>.01)return;d.open=!d.open;d.target=d.open?awayAngle(d,pos.x,pos.z):0;}else{d.interact?.();if(d.pickup){d.object?.removeFromParent();interactions.delete(d);window.dispatchEvent(new CustomEvent('afterhours:pickup',{detail:{id:d.id}}));}}interactionTick=0;}
// Future entities and pickup objects use the same controller as doors.
window.afterHours={setChased(value){stamina.chased=Boolean(value)},registerInteractable(object,options){const item={...options,object};object.traverse(o=>{if(o.isMesh)o.userData.interactable=item});interactions.add(item);return ()=>interactions.delete(item);}};
window.addEventListener('afterhours:chase',e=>window.afterHours.setChased(e.detail?.active??false));
bindAction($('interact'),interact);bindAction($('sprint'),()=>{if(playing)sprintToggle=!sprintToggle});
const lights=Array.from({length:4},()=>{let l=new T.PointLight(0xd3ddbf,3,10,2);scene.add(l);return l});
const pos=new T.Vector3(world.spawn.x,1.68,world.spawn.z);let yaw=.16,pitch=0,playing=false,muted=false,audio,master,stepTime=0,time=0,lightTick=0;const keys={};let mx=0,mz=0;
function free(x,z,ignoreDoors=false){const r=.25;for(const dx of [-r,r])for(const dz of [-r,r]){const ix=Math.floor((x+dx)/S),iz=Math.floor((z+dz)/S);if(!map[iz]?.[ix])return false}for(const o of obstacleCells.get(Math.floor(x/S)+','+Math.floor(z/S))??[])if(Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d)return false;for(const d of ignoreDoors?[]:doorCells.get(Math.floor(x/S)+','+Math.floor(z/S))??[])if(doorCollision(d,x,z))return false;return true}
const MonsterMaterial=ap?T.MeshLambertMaterial:T.MeshBasicMaterial;
const seligMaterial=new MonsterMaterial({transparent:true,alphaTest:.12,side:T.DoubleSide,color:0xb8b8ac});
const selig=new T.Mesh(new T.PlaneGeometry(2.7,2.25),seligMaterial);selig.visible=false;selig.raycast=()=>{};scene.add(selig);let assetReady=false,caught=false,musicClock=0;
// A soft body-sized halo, not a room light; depth testing is intentionally disabled.
const auraCanvas=document.createElement('canvas');auraCanvas.width=auraCanvas.height=128;
const auraContext=auraCanvas.getContext('2d'),auraGradient=auraContext.createRadialGradient(64,64,9,64,64,64);
auraGradient.addColorStop(0,'rgba(170,12,18,0.65)');auraGradient.addColorStop(.45,'rgba(155,6,12,0.4)');auraGradient.addColorStop(1,'rgba(130,0,5,0)');auraContext.fillStyle=auraGradient;auraContext.fillRect(0,0,128,128);
const aura=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(auraCanvas),transparent:true,opacity:0,depthTest:false,depthWrite:false,fog:false}));aura.scale.set(3.6,3.1,1);aura.renderOrder=1;aura.raycast=()=>{};scene.add(aura);selig.renderOrder=2;
new T.TextureLoader().load('./assets/selig.png',texture=>{texture.colorSpace=T.SRGBColorSpace;seligMaterial.map=texture;seligMaterial.needsUpdate=true;assetReady=true;},undefined,()=>{console.error('Selig texture failed to load');$('error').textContent='Selig could not load. Refresh to try again.';$('error').style.display='block';});
function scareSound(){if(!audio||muted)return;const now=audio.currentTime;
 for(const [freq,type] of [[87,'sawtooth'],[93,'sawtooth'],[410,'square']]){let o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(freq*.43,now+1.1);f.type='lowpass';f.frequency.value=1400;g.gain.setValueAtTime(.001,now);g.gain.exponentialRampToValueAtTime(.65,now+.04);g.gain.exponentialRampToValueAtTime(.001,now+1.3);o.connect(f).connect(g).connect(master);o.start();o.stop(now+1.4);}}
const monsterMusic=new MonsterMusic();
let catchBuffer=null,catchSource=null,catchGain=null;
const catchBytes=fetch('./assets/selig-caught.m4a').then(r=>{if(!r.ok)throw new Error('Catch audio missing');return r.arrayBuffer()}).catch(e=>{console.error(e);return null});
function prepareCatchAudio(){if(!audio)return;catchBytes.then(bytes=>bytes?audio.decodeAudioData(bytes.slice(0)):null).then(buffer=>{catchBuffer=buffer}).catch(console.error);}
const jumpScare=new JumpScare({onStart(){
 $('caught').hidden=true;$('jumpscare').hidden=false;
 if(audio&&catchBuffer&&!muted){catchSource=audio.createBufferSource();catchSource.buffer=catchBuffer;catchGain=audio.createGain();catchGain.gain.value=.95;catchSource.connect(catchGain).connect(audio.destination);catchSource.start();}
},onFinish(){$('jumpscare').hidden=true;if(coop?.active){$('caught').hidden=true;document.body.classList.add('spectating');}else $('caught').hidden=false;}});
function caughtBySelig(){if(coop?.active){if(coop.host)killPlayer(targetPlayer||coop.id);return;}caught=true;stamina.chased=false;document.body.classList.remove('chased');pause();$('menu').style.display='none';jumpScare.start(performance.now(),catchBuffer?.duration??2.543333);}
const detectionClear=createDetectionClear(world,boxes,doorObjects);
const hunter=new Hunter({world,free,detectionClear,onAlert(){stamina.chased=true;scareSound();document.body.classList.add('chased');},onEscape(){stamina.chased=false;document.body.classList.remove('chased');},onCatch:caughtBySelig});
hunter.place(pos);
const rivals=[hunter];
const sprites=[selig],auras=[aura];
while(ap&&rivals.length<3){
 const rival=new Hunter({world,free,detectionClear,onCatch:caughtBySelig,onAlert:scareSound});
 rival.place(pos);rivals.push(rival);
 const sprite=selig.clone(),halo=aura.clone();halo.material=aura.material.clone();
 scene.add(sprite,halo);sprites.push(sprite);auras.push(halo);
}
function sealedFromSelig(hunter){const id=world.roomIds[Math.floor(pos.z/S)]?.[Math.floor(pos.x/S)]??-1,other=world.roomIds[Math.floor(hunter.z/S)]?.[Math.floor(hunter.x/S)]??-1;return id>=0&&other!==id&&doorObjects.some(d=>d.edge.room===id&&Math.abs(d.angle)<.08&&d.target===0);}
function restartEncounter(fromNetwork=false){if(coop?.active&&fromNetwork!==true){coop.lobby.leave().finally(()=>location.reload());return;}intro?.finish();dead={};teamLost=false;document.body.classList.remove('spectating');quest.reset();document.body.classList.remove('cinematic');jumpScare.cancel();$('jumpscare').hidden=true;if(catchSource){try{catchSource.stop()}catch{}catchSource=null;}caught=false;$('caught').hidden=true;$('menu').style.display='';pos.set(world.spawn.x,1.68,world.spawn.z);yaw=.16;pitch=0;stamina.value=1;stamina.exhausted=false;stamina.chased=false;sprintToggle=false;document.body.classList.remove('chased');for(const d of doorObjects){d.angle=d.target=0;d.open=false;d.group.rotation.y=d.pose.base;}hunter.state='roam';hunter.cooldown=0;hunter.path=[];hunter.lastKnown=null;hunter.place(pos);for(const rival of rivals.slice(1)){rival.state='roam';rival.cooldown=0;rival.path=[];rival.place(pos);}start();}
bindAction($('retry'),restartEncounter);
const quest=createQuest({impact,world,scene,camera,pos,doors:doorObjects,free,
 register(object,item){item.object=object;object.traverse(o=>{if(o.isMesh)o.userData.interactable=item;});interactions.add(item);},
 beginScene(){sprintToggle=false;stamina.chased=false;document.body.classList.remove('chased');document.body.classList.add('cinematic');monsterMusic.silence();Object.keys(keys).forEach(k=>keys[k]=false);mx=mz=0;},
 endScene(angle){yaw=angle;pitch=0;document.body.classList.remove('cinematic');},
 getAudio:()=>audio,isMuted:()=>muted,restart:restartEncounter});
function killPlayer(id){if(dead[id])return;dead[id]=true;if(id===coop.id){jumpScare.start(performance.now(),catchBuffer?.duration??2.543333);document.body.classList.add('spectating');sprintToggle=false;}hunter.state='roam';hunter.cooldown=0;hunter.path=[];hunter.roamClock=0;stamina.chased=false;document.body.classList.remove('chased');}
function alivePlayers(){return coop.members.filter(p=>!dead[p.id]).map(p=>({id:p.id,...(p.id===coop.id?{x:pos.x,z:pos.z}:p.position)}));}
function sealedPlayer(p){const id=world.roomIds[Math.floor(p.z/S)]?.[Math.floor(p.x/S)]??-1,other=world.roomIds[Math.floor(hunter.z/S)]?.[Math.floor(hunter.x/S)]??-1;return id>=0&&other!==id&&doorObjects.some(d=>d.edge.room===id&&Math.abs(d.angle)<.08&&d.target===0);}
function sharedSnapshot(){return {hunter:{x:hunter.x,z:hunter.z,state:hunter.state},doors:doorObjects.map(d=>[d.angle,d.target,d.open]),quest:quest.snapshot(),dead,teamLost};}
function receiveSnapshot(s){if(!s?.hunter)return;const wasDead=dead[coop.id];dead=s.dead||{};teamLost=!!s.teamLost;if(dead[coop.id]&&!wasDead){jumpScare.start(performance.now(),catchBuffer?.duration??2.543333);document.body.classList.add('spectating');sprintToggle=false;}hunter.x=s.hunter.x;hunter.z=s.hunter.z;hunter.state=s.hunter.state;hunter.ready=true;s.doors?.forEach((v,i)=>{const d=doorObjects[i];if(d){[d.angle,d.target,d.open]=v;d.group.rotation.y=d.pose.base+d.angle;}});quest.apply(s.quest);}
function remoteCommand(e,id){const p=coop.members.find(p=>p.id===id)?.position;if(!p||dead[id]||quest.cinematic)return;if(e.type==='door'){const d=doorObjects[e.index];if(!d||Math.hypot(p.x-d.edge.x,p.z-d.edge.z)>3.5||Math.abs(d.angle-d.target)>.01)return;d.open=!d.open;d.target=d.open?awayAngle(d,p.x,p.z):0;}else{const item=[...interactions].find(i=>i.netType===e.type&&i.netIndex===e.index);if(!item||!item.object.visible||Math.hypot(p.x-item.object.position.x,p.z-item.object.position.z)>3.5)return;item.interact();}}
coop=multiplayer({scene,pos,getYaw:()=>yaw,onStart:()=>restartEncounter(true),onSnapshot:receiveSnapshot,onCommand:remoteCommand,onDisconnect(message){pause();$('lobbyStatus').textContent=message;},onAppearance:color=>quest.setShirt(color),getSnapshot:sharedSnapshot});
bindAction($('spectateNext'),()=>spectateIndex++);


function soundInit(){if(audio){audio.resume();monsterMusic.init(audio);return}audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=muted?0:.13;master.connect(audio.destination);prepareCatchAudio();monsterMusic.init(audio);for(const freq of [60,120]){const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;g.gain.value=freq===60?.16:.035;o.connect(g).connect(master);o.start()}let b=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*.08;let src=audio.createBufferSource(),filter=audio.createBiquadFilter();src.buffer=b;src.loop=true;filter.type='lowpass';filter.frequency.value=320;src.connect(filter).connect(master);src.start()}
function impact(x,z){
 if(muted||!playing)return;
 const dx=x-pos.x,dz=z-pos.z,d=Math.hypot(dx,dz);
 footfall(audio,master,d,(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/Math.max(1,d));
}
function step(){if(!audio||muted)return;let o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(92,audio.currentTime);o.frequency.exponentialRampToValueAtTime(35,audio.currentTime+.12);g.gain.setValueAtTime(.2,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g).connect(master);o.start();o.stop(audio.currentTime+.17)}
let touchBag=false,lit=false;const coarse=matchMedia('(pointer:coarse)').matches;function start(){if(caught||quest.state.phase==='won')return;window.speechSynthesis?.resume();playing=true;document.body.classList.add('playing');$('enter').textContent='RESUME →';try{soundInit();if(master)master.gain.value=muted?0:.13;}catch{}if(!coarse&&!intro?.active)renderer.domElement.requestPointerLock?.()?.catch(()=>{})}
function pause(){touchBag=false;window.speechSynthesis?.pause();playing=false;monsterMusic.silence();sprintToggle=false;document.body.classList.remove('playing');Object.keys(keys).forEach(k=>keys[k]=false);mx=mz=0;$('knob').style.transform='';document.exitPointerLock?.();if(master)master.gain.value=0}
let selected=ap;
$('enter').onclick=()=>selected||coop.active?start():$('difficulty').showModal();
$('standardMode').onclick=()=>{selected=true;$('difficulty').close();start();};
$('apMode').onclick=()=>{sessionStorage.setItem('seligLaunch','ap');location.reload();};
if(ap){$('victory').firstElementChild.textContent='ALL SEVEN RETURNED';intro=createIntro({scene,camera,door:doorObjects[0],monster:selig,coarse,muted:()=>muted,impact});start();}
$('pause').onclick=pause;$('reset').onclick=restartEncounter;$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'Sound off':'Sound on';if(muted)monsterMusic.silence();if(master)master.gain.value=muted||!playing?0:.13};$('full').onclick=toggleGameFullscreen;
document.addEventListener('keydown',e=>{if(e.target.closest?.('input,select,textarea')||!playing)return;keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(intro?.active&&e.code==='Space')intro.finish();if(e.code==='Escape')pause();if(e.code==='KeyE'&&!e.repeat)interact()});document.addEventListener('keyup',e=>keys[e.code]=false);document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&playing&&!coarse)pause()});document.addEventListener('mousemove',e=>{if(playing&&!quest.cinematic&&document.pointerLockElement){yaw-=e.movementX*LOOK.mouseX;pitch=Math.max(-1.3,Math.min(1.3,pitch-e.movementY*LOOK.mouseY))}});renderer.domElement.addEventListener('click',()=>{if(playing&&!intro?.active&&!coarse)renderer.domElement.requestPointerLock?.()?.catch(()=>{})});
const gear=new T.Group();
camera.add(gear);
function part(parent,w,h,d,x,y,z,color){
 const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshLambertMaterial({color}));
 m.position.set(x,y,z);parent.add(m);return m;
}
const left=new T.Group();gear.add(left);
if(ap){
 part(left,.09,.09,.29,-.23,-.18,-.29,0xbd926f);
 part(left,.28,.22,.10,-.24,-.37,-.48,0x25292b);
 part(left,.17,.025,.032,-.24,-.215,-.48,0x484c4e);
 for(const x of [-.31,-.17])part(left,.026,.07,.032,x,-.245,-.48,0x484c4e);
 part(gear,.10,.09,.18,.23,-.20,-.32,0xbd926f);
 const barrel=new T.Mesh(new T.CylinderGeometry(.042,.053,.22,12),new T.MeshLambertMaterial({color:0x485053}));
 barrel.rotation.x=Math.PI/2;barrel.position.set(.23,-.18,-.45);gear.add(barrel);
 $('bag').hidden=$('beam').hidden=false;
 $('bag').onpointerdown=e=>{e.preventDefault();$('bag').setPointerCapture(e.pointerId);touchBag=true;};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])$('bag').addEventListener(type,()=>touchBag=false);
 $('beam').onclick=()=>lit=!lit;
 document.addEventListener('keydown',e=>{if(playing&&!e.repeat&&e.code==='KeyF')lit=!lit;});
}
const flash=new T.SpotLight(0xfff2d9,55,19.2,.43,.68,2);
if(ap){renderer.shadowMap.enabled=true;flash.castShadow=true;flash.shadow.mapSize.set(512,512);flash.shadow.bias=-.001;camera.add(flash,flash.target);flash.position.set(.23,-.17,-.58);flash.target.position.set(0,0,-12);}
document.addEventListener('pointerdown',()=>{if(playing&&audio?.state==='suspended')audio.resume();});
let moveId=null,lookId=null,lastX=0,lastY=0;const stick=$('stick');function moveStick(e){const r=stick.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;let len=Math.hypot(x,y);if(len>40){x*=40/len;y*=40/len}mx=x/40;mz=-y/40;$('knob').style.transform=`translate(${x}px,${y}px)`}stick.addEventListener('pointerdown',e=>{if(!playing||moveId!==null)return;e.preventDefault();moveId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);e.stopPropagation()});stick.addEventListener('pointermove',e=>{if(e.pointerId===moveId)moveStick(e)});function endMove(e){if(e.pointerId===moveId){moveId=null;mx=mz=0;$('knob').style.transform=''}}stick.addEventListener('pointerup',endMove);stick.addEventListener('pointercancel',endMove);stick.addEventListener('lostpointercapture',endMove);renderer.domElement.addEventListener('pointerdown',e=>{if(!playing||!coarse||lookId!==null)return;e.preventDefault();lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId!==lookId||quest.cinematic)return;yaw-=(e.clientX-lastX)*LOOK.touchX;pitch=Math.max(-1.3,Math.min(1.3,pitch-(e.clientY-lastY)*LOOK.touchY));lastX=e.clientX;lastY=e.clientY});function endLook(e){if(e.pointerId===lookId)lookId=null}renderer.domElement.addEventListener('pointerup',endLook);renderer.domElement.addEventListener('pointercancel',endLook);renderer.domElement.addEventListener('lostpointercapture',endLook);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
let previous=performance.now(),bob=0;function frame(now){requestAnimationFrame(frame);let dt=Math.min((now-previous)/1000,.04);previous=now;time+=dt;jumpScare.update(now);let moving=false,running=false;
 if(intro?.active){if(playing){intro.update(dt);gear.visible=false;flash.visible=false;renderer.render(scene,camera);}return;}
 if(playing&&!quest.cinematic){
  for(const d of doorObjects){const delta=d.target-d.angle;if(Math.abs(delta)>.001){const next=d.angle+Math.sign(delta)*Math.min(Math.abs(delta),dt*3.2);if(!doorCollision(d,pos.x,pos.z,next)&&!(coop.active&&coop.host&&alivePlayers().some(p=>doorCollision(d,p.x,p.z,next)))){d.angle=next;d.group.rotation.y=d.pose.base+d.angle;}else {d.target=d.angle;d.open=Math.abs(d.angle)>.1;}}}
  let sx=mx+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),sz=mz+(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);const l=Math.hypot(sx,sz);if(l>1){sx/=l;sz/=l}
  if(l>.05&&!(coop?.active&&dead[coop.id])){const wantsSprint=(sprintToggle||keys.ShiftLeft||keys.ShiftRight)&&stamina.canSprint,speed=(wantsSprint?SPRINT_SPEED:WALK_SPEED)*dt,oldX=pos.x,oldZ=pos.z;const dx=(Math.cos(yaw)*sx-Math.sin(yaw)*sz)*speed,dz=(-Math.sin(yaw)*sx-Math.cos(yaw)*sz)*speed;if(free(pos.x+dx,pos.z))pos.x+=dx;if(free(pos.x,pos.z+dz))pos.z+=dz;moving=Math.hypot(pos.x-oldX,pos.z-oldZ)>.0001;running=moving&&wantsSprint;if(moving){stepTime+=dt;if(stepTime>(running?.32:.52)){step();stepTime=0}}}
  if(assetReady&&!quest.monsterGone&&!coop.active){const violation=ap&&hunter.isHall(pos)&&!keys.KeyZ&&!touchBag;
   for(const rival of rivals){if(caught)break;rival.update(dt,pos,sealedFromSelig(rival),violation);}
   stamina.chased=rivals.some(r=>r.state==='chase');
   document.body.classList.toggle('chased',stamina.chased);
   $('policy').textContent=violation?'MACBOOK ENRAGEMENT':'';
   const nearest=rivals.reduce((a,b)=>Math.hypot(a.x-pos.x,a.z-pos.z)<Math.hypot(b.x-pos.x,b.z-pos.z)?a:b);
   monsterMusic.update(nearest,pos,yaw,playing&&!muted&&!caught&&!inDark(pos.x,pos.z));}
  stamina.update(dt,running);if(stamina.exhausted)sprintToggle=false;
 }
 if(coop.active&&!quest.monsterGone&&!teamLost){if(coop.host){const alive=alivePlayers();if(!alive.length){teamLost=true;}else{const candidates=alive.filter(p=>!sealedPlayer(p));const visible=candidates.filter(p=>Math.hypot(p.x-hunter.x,p.z-hunter.z)<=DETECTION_RADIUS&&clearLine(hunter,p,detectionClear,.05));const retained=hunter.state==='chase'?candidates.find(p=>p.id===targetPlayer):null;const target=retained||(visible.length?visible:candidates.length?candidates:alive).sort((a,b)=>Math.hypot(a.x-hunter.x,a.z-hunter.z)-Math.hypot(b.x-hunter.x,b.z-hunter.z))[0];targetPlayer=target.id;hunter.update(dt,target,sealedPlayer(target));}}monsterMusic.update(hunter,pos,yaw,playing&&!muted&&!dead[coop.id]);}
 $('staminaFill').style.transform='scaleX('+stamina.value+')';$('staminaBar').setAttribute('aria-valuenow',Math.round(stamina.value*100));$('staminaLabel').textContent=stamina.exhausted?'CATCH YOUR BREATH':'STAMINA';$('sprint').classList.toggle('active',Boolean(sprintToggle||running));$('sprint').setAttribute('aria-pressed',String(Boolean(sprintToggle||running)));$('sprint').textContent=stamina.exhausted?'Recovering':'Sprint';
 bob=T.MathUtils.lerp(bob,moving?Math.sin(time*(running?14:10))*(running?.026:.018):0,dt*10);camera.position.set(pos.x,1.68+bob,pos.z);camera.rotation.set(pitch,yaw,0);
 if(time>lightTick){lightTick=time+.3;const nearby=fixtures.map(f=>({f,d:(f.x-pos.x)**2+(f.z-pos.z)**2})).sort((a,b)=>a.d-b.d).slice(0,4);nearby.forEach(({f},i)=>{lights[i].position.set(f.x,f.y-.17,f.z);lights[i].intensity=2.7*f.power})}
 selig.visible=assetReady&&hunter.ready&&!quest.monsterGone;if(coop.active&&!coop.host)selig.position.lerp(new T.Vector3(hunter.x,1.125,hunter.z),.22);else selig.position.set(hunter.x,1.125,hunter.z);selig.rotation.y=Math.atan2(camera.position.x-hunter.x,camera.position.z-hunter.z);
 const auraDistance=Math.hypot(pos.x-hunter.x,pos.z-hunter.z);
 aura.visible=selig.visible&&auraDistance<12&&!caught;
 aura.position.copy(selig.position);aura.material.opacity=.26*Math.max(0,Math.min(1,(12-auraDistance)/6))*(.94+.06*Math.sin(time*2));
 const dark=inDark(pos.x,pos.z)&&!quest.cinematic;
 if(ap){
  gear.visible=playing&&!quest.cinematic;left.position.y=(keys.KeyZ||touchBag)?0:-.12;
  $('bag').classList.toggle('active',!!(keys.KeyZ||touchBag));flash.visible=lit&&gear.visible;
  lights.forEach(l=>l.visible=!dark);scene.fog.color.setHex(dark?0:0x0a0e0b);
  for(let i=0;i<rivals.length;i++){
   const r=rivals[i],s=sprites[i],a=auras[i];s.visible=assetReady&&r.ready&&!quest.monsterGone;
   s.position.set(r.x,1.125,r.z);s.rotation.y=Math.atan2(pos.x-r.x,pos.z-r.z);
   a.position.copy(s.position);const d=Math.hypot(pos.x-r.x,pos.z-r.z);
   a.visible=s.visible&&!dark&&d<12&&!caught;a.material.opacity=.26*Math.min(1,(12-d)/6);
  }
 }
 if(playing&&!quest.cinematic)sprites.forEach(s=>{if(s.visible)waddle(s,dt,impact);});
 coop.update(time,moving,quest.cinematic||!!dead[coop.id]);
 if(coop.active){const alive=coop.members.filter(p=>!dead[p.id]);$('coopInfo').textContent=teamLost?'Everyone was caught. Leave the lobby to play again.':dead[coop.id]?'You were caught · Spectating':`Room ${coop.lobby.session.code} · ${alive.length} students alive`;$('spectateNext').hidden=!dead[coop.id]||!alive.length;if(dead[coop.id]&&alive.length&&!quest.cinematic){const p=alive[spectateIndex%alive.length];camera.position.set(p.position.x,1.68,p.position.z);camera.rotation.set(0,p.position.yaw,0);}}
 quest.update(dt,playing);
 scene.children[0].intensity=Number($('brightness').value)*(dark?0:ap?.37:1);renderer.domElement.style.filter=dark&&!lit?'brightness(0)':'';renderer.render(scene,camera);if(playing&&!quest.cinematic&&time>interactionTick){interactionTick=time+.12;updateTarget();}
}requestAnimationFrame(frame);
window.__worldStats={openCells:map.flat().filter(Boolean).length,rooms:rooms.length,fixtures:fixtures.length,areaMeters:N*S,objects:Object.values(boxes).reduce((n,a)=>n+a.length,0)};
