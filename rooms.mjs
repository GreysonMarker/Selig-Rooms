import {themeFurniture} from './themes.mjs';
// Room architecture and furniture share the same geometry/collision definitions.
export function furnish(world,box,block){
 const {S,rooms,boundaries}=world;
 function solid(m,x,y,z,w,h,d,b=.55){box(m,x,y,z,w,h,d,b);if(y-h/2<1.9&&y+h/2>.15)block(x,z,w,d)}
 for(const e of boundaries){let {x,z,vertical:v}=e;const piece=(offset,length,height=3.06,y=1.53,mat='wall')=>solid(mat,x+(v?0:offset),y,z+(v?offset:0),v?.16:length,height,v?length:.16,.55);
  if(!e.door){piece(0,S);box('trim',x,.09,z,v?.20:S,.18,v?S:.20,.4);continue}
  const gap=1.5,side=(S-gap)/2;piece(-(gap+side)/2,side);piece((gap+side)/2,side);piece(0,gap,.68,2.72);
  for(const sign of [-1,1])piece(sign*(gap/2+.025),.09,2.4,1.2,'trim');piece(0,1.65,.08,2.4,'trim');

 }
 for(const r of rooms)themeFurniture(r,box,solid,S);
}
