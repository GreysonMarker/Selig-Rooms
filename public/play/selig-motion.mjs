// The short, damped resonances are the body of the cabinet and the wood underneath.
const attacks=new WeakMap();
export function footfall(audio,output,distance,pan=0){
 if(!audio||!output||distance>25||audio.state!=='running')return;
 const t=audio.currentTime,level=.85/(1+.11*distance*distance);
 const stereo=audio.createStereoPanner();stereo.pan.value=Math.max(-1,Math.min(1,pan));stereo.connect(output);
 let attack=attacks.get(audio);
 if(!attack){
  attack=audio.createBuffer(1,Math.ceil(audio.sampleRate*.075),audio.sampleRate);
  const samples=attack.getChannelData(0);let low=0;
  for(let i=0;i<samples.length;i++){
   low+=.085*((Math.random()*2-1)-low);
   samples[i]=low*Math.exp(-5*i/samples.length);
  }
  attacks.set(audio,attack);
 }
 const slap=audio.createBufferSource(),slapGain=audio.createGain();
 slap.buffer=attack;slapGain.gain.value=level*2;slap.connect(slapGain).connect(stereo);
 slap.onended=()=>{slap.disconnect();slapGain.disconnect();};slap.start(t);
 const tones=[[90,48,.32,.95],[155,113,.17,.42],[254,210,.10,.19],[410,330,.045,.09]];
 tones.forEach(([from,to,length,volume],i)=>{
  const osc=audio.createOscillator(),env=audio.createGain();
  osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+length);
  env.gain.setValueAtTime(.0001,t);env.gain.exponentialRampToValueAtTime(Math.max(.0002,level*volume),t+.007);
  env.gain.exponentialRampToValueAtTime(.0001,t+length);
  osc.connect(env).connect(stereo);osc.onended=()=>{osc.disconnect();env.disconnect();if(!i)stereo.disconnect();};
  osc.start(t);osc.stop(t+length);
 });
}
export function waddle(mesh,dt,impact){
 const {x,z}=mesh.position;
 const gait=mesh.userData.gait??={x,z,phase:0,weight:0};
 const travel=Math.hypot(x-gait.x,z-gait.z);gait.x=x;gait.z=z;
 if(travel>0&&travel<1){
  const old=Math.floor(gait.phase/Math.PI);
  gait.phase+=travel*Math.PI/1.55;
  if(Math.floor(gait.phase/Math.PI)>old)impact(x,z);
 }
 gait.weight+=(Number(travel>.001&&travel<1)-gait.weight)*Math.min(1,dt*12);
 const sway=Math.sin(gait.phase)*gait.weight;
 mesh.rotation.z=.12*sway;mesh.position.y+=.12*Math.abs(sway);
}
