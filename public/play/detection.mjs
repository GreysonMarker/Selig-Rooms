import {doorCollision} from './mechanics.mjs';
// Radius detection ignores furniture and facing, but never passes architecture.
export function createDetectionClear(world,boxes,doors){
 const {S,map}=world,cells=new Map();
 for(const b of [...(boxes.wall??[]),...(boxes.trim??[])]){
  if(b.y-b.h/2>1.5||b.y+b.h/2<1.5)continue;
  for(let x=Math.floor((b.x-b.w/2)/S);x<=Math.floor((b.x+b.w/2)/S);x++)for(let z=Math.floor((b.z-b.d/2)/S);z<=Math.floor((b.z+b.d/2)/S);z++){
   const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(b);
  }
 }
 return (x,z)=>{
  const ix=Math.floor(x/S),iz=Math.floor(z/S);
  if(!map[iz]?.[ix])return false;
  for(const b of cells.get(ix+','+iz)??[])if(Math.abs(x-b.x)<=b.w/2&&Math.abs(z-b.z)<=b.d/2)return false;
  for(const d of doors)if(doorCollision(d,x,z,d.angle,0))return false;
  return true;
 };
}
