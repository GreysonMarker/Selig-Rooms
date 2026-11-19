import {THEMES} from './themes.mjs';
export function createWorld(ap=false){
 let seed=982451653;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const N=ap?91:39,S=3.2,map=Array.from({length:N},()=>Array(N).fill(0));
 const stack=ap?[]:[[3,3]];map[3][3]=1;
 while(stack.length){const [x,z]=stack[stack.length-1];const opts=[[2,0],[-2,0],[0,2],[0,-2]].filter(([dx,dz])=>x+dx>0&&z+dz>0&&x+dx<N-1&&z+dz<N-1&&!map[z+dz][x+dx]);if(!opts.length){stack.pop();continue}const [dx,dz]=opts[Math.floor(rand()*opts.length)];map[z+dz/2][x+dx/2]=1;map[z+dz][x+dx]=1;stack.push([x+dx,z+dz]);}
 for(let k=0;!ap&&k<22;k++){let x=3+2*Math.floor(rand()*((N-6)/2)),z=3+2*Math.floor(rand()*((N-6)/2));if(rand()<.5)for(let i=0;i<10&&x+i<N-1;i++)map[z][x+i]=1;else for(let i=0;i<10&&z+i<N-1;i++)map[z+i][x]=1;}
 const rooms=[];
 // Each AP wing has a different length and offset. Narrow passages connect
 // adjacent wings at selected crossings, leaving the outer bays blind.
 const wings=ap?[[0,6],[0,9],[0,11],[1,7],[0,10],[2,8],[0,11],[1,9],[2,8],[4,5]]:Array.from({length:6},()=>[0,6]);
 const spacing=ap?8:6;
 wings.forEach(([offset,count],row)=>{
  for(let index=0;index<count;index++){
   const col=offset+index,x=2+col*spacing,z=2+row*spacing,id=rooms.length;
   const [theme,name]=THEMES[id===0?0:1+(id-1)%(THEMES.length-1)];
   rooms.push({x,z,w:id===0?3:4,h:id===0?3:4,type:id===0?0:4+(id-1)%30,name,theme});
   if(!ap)continue;
   if(index>0)for(let cx=x-spacing+3;cx<x;cx++)map[z+1][cx]=1;
   if(row){
    const [prev,n]=wings[row-1],lo=Math.max(prev,offset),hi=Math.min(prev+n,offset+count)-1;
    if(col===lo+((row%2)?0:1)||col===hi-1){
     for(let cz=z-spacing+3;cz<z;cz++)map[cz][x+1]=1;
    }
   }
   // Blind service passages jut beyond the eastern end of each wing.
   if(index===count-1)for(let dx=4;dx<=7;dx++)map[z+2][x+dx]=1;
  }
 });
 const roomIds=Array.from({length:N},()=>Array(N).fill(-1)),boundaries=[],doors=[];
 rooms.forEach((r,id)=>{
  r.id=id;r.name??=['Off-center table','Chairless classroom','Desks at the wall','Second classroom','Lone table','Single chair','Far desks'][id];
  // A narrow circulation loop preserves routes around newly enclosed rooms.
  for(let z=r.z-1;z<=r.z+r.h;z++)for(let x=r.x-1;x<=r.x+r.w;x++)map[z][x]=1;
  for(let z=r.z;z<r.z+r.h;z++)for(let x=r.x;x<r.x+r.w;x++){map[z][x]=2;roomIds[z][x]=id;}
  r.side=id===0?2:r.type===13||r.type===21?2:r.type===16?2:r.type>=4?(r.type+3)%4:id%4;
  for(let side=0;side<4;side++){let count=side%2?r.h:r.w,opening=Math.floor(count/2);for(let j=0;j<count;j++){
   let x=side===1?r.x+r.w:side===3?r.x:r.x+j+.5,z=side===0?r.z:side===2?r.z+r.h:r.z+j+.5;
   const edge={x:x*S,z:z*S,vertical:side%2===1,door:side===r.side&&j===opening,side,room:id};boundaries.push(edge);if(edge.door)doors.push(edge);
  }}
 });
 // Repair any isolated maze fragments by joining them to the circulation network.
 let visited=new Set(),queue=[[3,3]];visited.add('3,3');
 const fill=()=>{for(let i=0;i<queue.length;i++){let [x,z]=queue[i];for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){let a=x+dx,b=z+dz,k=a+','+b;if(map[b]?.[a]&&!visited.has(k)){visited.add(k);queue.push([a,b]);}}}};fill();
 for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++)if(map[z][x]&&!visited.has(x+','+z)){let tx=x;while(tx>1&&!visited.has(tx+','+z)){map[z][tx]=1;tx--;}queue.push([tx,z]);visited.add(tx+','+z);fill();}
 const fixtures=[];for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++)if(map[z][x]&&((x+z*3)%5===0)&&rand()>.22)fixtures.push({x:(x+.5)*S,z:(z+.5)*S,power:.65+rand()*.5});
 fixtures.push({x:3.5*S,z:3.5*S,power:1});
 for(const r of rooms){fixtures.push({x:(r.x+r.w/2)*S+.4,z:(r.z+r.h/2)*S-.6,power:.85});}
 for(const f of fixtures){f.y=2.95;}
 return {ap,N,S,map,rooms,roomIds,boundaries,doors,fixtures,rand,spawn:{x:3.2*S,z:4.2*S}};
}
