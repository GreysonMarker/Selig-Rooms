import * as T from './three.module.js';
import {makeStudent,SHIRTS} from './avatar.mjs';
import {Lobby} from './network.mjs';
export function multiplayer({scene,pos,getYaw,onStart,onSnapshot,onCommand,onDisconnect,onAppearance,getSnapshot}){
 const $=id=>document.getElementById(id);let config={gender:'male',shirt:'royal'};try{config={...config,...JSON.parse(localStorage.getItem('afterHoursAvatar')||'{}')};$('playerName').value=localStorage.getItem('afterHoursName')||'Student';}catch{}
 $('avatarGender').value=config.gender;$('avatarShirt').value=config.shirt;
 let started=false,own=null,previewStudent=null;const others=new Map();const previewScene=new T.Scene();previewScene.add(new T.HemisphereLight(0xffffff,0x626451,2));const previewCamera=new T.PerspectiveCamera(36,220/260,.1,10);previewCamera.position.set(0,1,3.3);previewCamera.lookAt(0,.95,0);let previewRenderer;try{previewRenderer=new T.WebGLRenderer({canvas:$('avatarPreview'),alpha:true,antialias:true});previewRenderer.setSize(220,260,false);previewRenderer.setPixelRatio(1);}catch{}
 const lobby=new Lobby(receive,error=>{status(error);onDisconnect(error);$('enter').disabled=false;$('enter').textContent='Reload to reconnect';$('enter').onclick=()=>location.reload();});
 function appearance(){config={gender:$('avatarGender').value,shirt:$('avatarShirt').value};try{localStorage.setItem('afterHoursAvatar',JSON.stringify(config));}catch{}if(own)scene.remove(own.group);own=makeStudent(config,true);scene.add(own.group);if(previewStudent)previewScene.remove(previewStudent.group);previewStudent=makeStudent(config);previewScene.add(previewStudent.group);onAppearance(SHIRTS[config.shirt]);}
 $('avatarGender').onchange=appearance;$('avatarShirt').onchange=appearance;appearance();
 function status(t){$('lobbyStatus').textContent=t;}
 async function connect(op){$('createLobby').disabled=$('joinLobby').disabled=true;status('Connecting…');try{const name=$('playerName').value.trim()||'Student';try{localStorage.setItem('afterHoursName',name);}catch{}await lobby.connect(op,name,config,$('roomCode').value);$('lobbyControls').hidden=true;$('lobbyRoom').hidden=false;$('lobbyCode').textContent=lobby.session.code;$('startLobby').hidden=!lobby.session.host;$('avatarGender').disabled=$('avatarShirt').disabled=$('playerName').disabled=true;$('enter').disabled=true;status(lobby.session.host?'Share the code. Up to 4 players; keep this game open as host.':'Waiting for the host to start.');}catch(e){status(e.message);$('createLobby').disabled=$('joinLobby').disabled=false;}}
 $('createLobby').onclick=()=>connect('create');$('joinLobby').onclick=()=>connect('join');$('startLobby').onclick=async()=>{try{$('startLobby').disabled=true;await lobby.start();}catch(e){status(e.message);$('startLobby').disabled=false;}};
 $('copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(lobby.session.code);status('Room code copied.');}catch{status('Room code: '+lobby.session.code);}};
 $('leaveLobby').onclick=async()=>{await lobby.leave();location.reload();};
 function receive(r){lobby.status=r.status;$('lobbyMembers').replaceChildren(...r.players.map(p=>{const el=document.createElement('div');el.textContent=p.name+(p.id===lobby.session.id?' (you)':'');return el;}));
  if(r.status==='playing'&&!started){started=true;$('enter').disabled=false;$('coopHud').hidden=false;$('reset').textContent='Leave match';onStart();}
  if(started){if(lobby.session.host){for(const e of r.events){if(e.id>lobby.ack){onCommand(e.payload,e.player);lobby.ack=e.id;}}}else onSnapshot(r.state);}
 }
 function update(t,moving,hidden=false){const active=!!lobby.session&&started;own.group.position.set(pos.x,0,pos.z);own.group.rotation.y=getYaw()+Math.PI;own.group.visible=!hidden;own.update(t,moving);
  if(previewRenderer&&!document.body.classList.contains('playing')){previewStudent.group.rotation.y=Math.sin(t*.3)*.4;previewStudent.update(t,false);previewRenderer.render(previewScene,previewCamera);}
  const ids=new Set();for(const p of lobby.players){if(p.id===lobby.session?.id)continue;ids.add(p.id);let a=others.get(p.id);if(!a){a=makeStudent(p.avatar);scene.add(a.group);a.group.position.set(p.position.x,0,p.position.z);others.set(p.id,a);}a.group.visible=active&&!getSnapshot().dead?.[p.id];a.group.position.lerp(new T.Vector3(p.position.x,0,p.position.z),.22);const target=p.position.yaw+Math.PI;a.group.rotation.y+=Math.atan2(Math.sin(target-a.group.rotation.y),Math.cos(target-a.group.rotation.y))*.22;a.update(t,p.position.moving);}
  for(const [id,a] of others)if(!ids.has(id)){scene.remove(a.group);others.delete(id);}
  lobby.position={x:pos.x,z:pos.z,yaw:getYaw(),moving};if(active&&lobby.session.host)lobby.state=getSnapshot();
 }
 return {lobby,update,get active(){return !!lobby.session&&started;},get host(){return !!lobby.session?.host;},get id(){return lobby.session?.id;},get members(){return lobby.players;},command(type,index){lobby.event(type,index);}};
}
