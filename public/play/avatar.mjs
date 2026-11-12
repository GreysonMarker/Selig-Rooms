import * as T from './three.module.js';
export const SHIRTS={royal:0x164bb4,columbia:0x8ebedf,white:0xf1f0e9};
function texture(draw){const c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
const plaid=()=>texture(g=>{g.fillStyle='#12335b';g.fillRect(0,0,256,256);for(let x=0;x<256;x+=64){g.fillStyle='#71a1bd';g.fillRect(x,0,19,256);g.fillRect(0,x,256,19);g.fillStyle='#e7ece4';g.fillRect(x+24,0,5,256);g.fillRect(0,x+24,256,5);g.fillStyle='#070e22';g.fillRect(x+40,0,9,256);g.fillRect(0,x+40,256,9);}});
export function makeStudent(config={gender:'male',shirt:'royal'},firstPerson=false){
 const group=new T.Group(),shirt=new T.MeshLambertMaterial({color:SHIRTS[config.shirt]||SHIRTS.royal}),skin=new T.MeshLambertMaterial({color:0xc99b7a}),khaki=new T.MeshLambertMaterial({color:0xb5a17a}),shoe=new T.MeshLambertMaterial({color:0xeeeeeb}),hair=new T.MeshLambertMaterial({color:0x493125});
 const box=(w,h,d,mat,x,y,z,parent=group)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;};
 box(.44,.56,.25,shirt,0,1.13,0);box(.08,.08,.12,shirt,-.09,1.42,.11).rotation.z=-.4;box(.08,.08,.12,shirt,.09,1.42,.11).rotation.z=.4;
 const logo=texture(g=>{g.clearRect(0,0,256,256);g.fillStyle=config.shirt==='white'?'#123f8b':'#fff';g.font='bold 140px Georgia';g.textAlign='center';g.fillText('HA',128,175);});const mark=new T.Mesh(new T.PlaneGeometry(.105,.09),new T.MeshBasicMaterial({map:logo,transparent:true}));mark.position.set(.12,1.27,.128);group.add(mark);
 const head=new T.Group();head.position.y=1.63;group.add(head);box(.25,.28,.24,skin,0,0,0,head);box(.27,.09,.26,hair,0,.13,-.005,head);if(config.gender==='female'){box(.29,.38,.10,hair,0,-.03,-.13,head);box(.06,.3,.16,hair,-.14,-.05,-.04,head);box(.06,.3,.16,hair,.14,-.05,-.04,head);}for(const x of [-.065,.065])box(.022,.022,.008,hair,x,.025,.124,head);
 const arms=[];for(const side of [-1,1]){const a=new T.Group();a.position.set(side*.29,1.34,0);group.add(a);box(.15,.26,.18,shirt,0,-.09,0,a);box(.12,.29,.13,skin,0,-.35,0,a);arms.push(a);}
 const legs=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.115,.81,0);group.add(leg);if(config.gender!=='female')box(.205,.32,.24,khaki,0,-.10,0,leg);box(.13,.47,.14,skin,0,-.48,0,leg);box(.15,.12,.17,shoe,0,-.69,0,leg);box(.17,.10,.28,shoe,0,-.77,.05,leg);legs.push(leg);}
 if(config.gender==='female'){const skirt=new T.Mesh(new T.CylinderGeometry(.245,.34,.4,16,1,true),new T.MeshLambertMaterial({map:plaid(),side:T.DoubleSide,flatShading:true}));skirt.position.y=.74;group.add(skirt);}else{box(.46,.055,.265,new T.MeshLambertMaterial({color:0x493527}),0,.86,0);box(.075,.06,.018,new T.MeshLambertMaterial({color:0xb8b5a7}),0,.86,.144);}
 if(firstPerson)head.visible=false;
 group.traverse(o=>o.raycast=()=>{});
 return {group,update(t,moving){const swing=moving?Math.sin(t*9)*.42:Math.sin(t*1.8)*.025;arms[0].rotation.x=swing;arms[1].rotation.x=-swing;legs[0].rotation.x=-swing;legs[1].rotation.x=swing;}};
}
