import * as T from './three.module.js';
import {makeStudent} from './avatar.mjs';
export function createIntro({scene,camera,door,monster,coarse,muted,impact}){
 const group=new T.Group(),student=makeStudent(),snatcher=monster.clone();
 const bag=new T.Mesh(new T.BoxGeometry(.44,.31,.13),new T.MeshLambertMaterial({color:0x29303a}));
 const handle=new T.Mesh(new T.TorusGeometry(.075,.013,6,16,Math.PI),bag.material);handle.position.y=.15;bag.add(handle);
 const lamp=new T.PointLight(0xffe6c6,20,10);group.add(student.group,snatcher,bag,lamp);scene.add(group);
 const {x,z}=door.edge;lamp.position.set(x,2.5,z-2);bag.position.set(x-.85,.18,z-2.3);
 const subtitle=document.getElementById('subtitle'),skip=document.getElementById('skipIntro');
 const lines=[
 [0,'Seven lanyards. Five grades, plus A and P. They move them every time.'],
 [4.5,'Three Seligs patrol these halls. Sometimes they turn up together.'],
 [9,coarse?'Keep Hold bag pressed in the hall. Let go and all three know where you are.':'Hold Z for your MacBook bag in the hall. Let go and all three know where you are.'],
 [15,'They get nearly twice as fast. Six seconds of sprint. Make them count.'],
 [20,coarse?'Tap Flashlight in the dark wing. You won’t hear their music or see that red glow.':'F for your flashlight. In the dark wing, their music and that red glow disappear.'],
 [26,'Stay here. I’ll check the hall.'],
 [30.1,'Wait. My bag—']
 ];
 let elapsed=0,line=-1,active=true,hit=false;
 function finish(){if(!active)return;active=false;scene.remove(group);subtitle.textContent='';skip.hidden=true;document.body.classList.remove('orientation');window.speechSynthesis?.cancel();door.target=door.angle=0;door.open=false;door.group.rotation.y=door.pose.base;}
 skip.hidden=false;skip.onclick=finish;document.body.classList.add('orientation');
 function update(dt){
  elapsed+=dt;const t=elapsed,who=student.group;
  const next=lines.findLastIndex(([at])=>t>=at);
  if(next!==line){line=next;subtitle.textContent=lines[line][1];if(!muted()&&window.speechSynthesis){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(subtitle.textContent);u.rate=1.08;speechSynthesis.speak(u);}}
  const walk=T.MathUtils.clamp((t-27)/3,0,1),grab=T.MathUtils.clamp((t-30.55)/.42,0,1);
  who.position.set(x+grab*grab*5,grab*.92,z-2.25+walk*3.4);who.rotation.y=Math.PI*(1-Math.min(1,walk*5));who.rotation.z=-grab*1.1;
  student.update(t,walk>0&&walk<1);
  door.angle=-Math.min(1,walk*5)*Math.PI/2;door.group.rotation.y=door.pose.base+door.angle;
  snatcher.visible=t>=30.23&&grab<1;snatcher.position.set(x-2.1+Math.min(1,(t-30.23)/.32)*2.1+grab*grab*5,1.125,z+1.3);snatcher.rotation.y=Math.PI;snatcher.rotation.z=-.24;
  if(grab>0&&!hit){hit=true;impact(x,z);}
  who.visible=grab<1;
  camera.position.set(x+.22,1.53,z-5.3);camera.lookAt(x+Math.min(grab,.24),1.1,z-1+walk*2);
  if(grab>0&&grab<1)camera.rotation.z=Math.sin(grab*24)*.045;
  if(t>32.3)finish();
 }
 return {update,finish,get active(){return active;}};
}
