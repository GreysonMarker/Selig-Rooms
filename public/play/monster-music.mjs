export const MUSIC_RADIUS=20;
export function musicLevels(monster,player,yaw,enabled=true){
 const dx=monster.x-player.x,dz=monster.z-player.z,distance=Math.hypot(dx,dz);
 return {gain:enabled&&distance<MUSIC_RADIUS?1.6*Math.pow(1-distance/MUSIC_RADIUS,.55):0,pan:distance?Math.max(-1,Math.min(1,(Math.cos(yaw)*dx-Math.sin(yaw)*dz)/distance)):0};
}
export class MonsterMusic {
 constructor(){this.bytes=fetch('./assets/selig-music.m4a').then(r=>{if(!r.ok)throw Error('Music unavailable');return r.arrayBuffer()});this.bytes.catch(()=>{});}
 async init(context){
  if(this.started)return;this.started=true;
  try{
   const buffer=await context.decodeAudioData((await this.bytes).slice(0));
   this.gain=context.createGain();this.gain.gain.value=0;this.pan=context.createStereoPanner();
   this.source=context.createBufferSource();this.source.buffer=buffer;this.source.loop=true;
   this.source.connect(this.pan).connect(this.gain).connect(context.destination);this.source.start();this.context=context;
  }catch(error){this.started=false;console.error('Selig music failed to load',error);}
 }
 update(monster,player,yaw,enabled){if(!this.context)return;const v=musicLevels(monster,player,yaw,enabled),t=this.context.currentTime;if(v.gain===0)this.silence();else this.gain.gain.setTargetAtTime(v.gain,t,.06);this.pan.pan.setTargetAtTime(v.pan,t,.06);}
 silence(){if(this.gain){this.gain.gain.cancelScheduledValues(this.context.currentTime);this.gain.gain.setValueAtTime(0,this.context.currentTime);}}
}
