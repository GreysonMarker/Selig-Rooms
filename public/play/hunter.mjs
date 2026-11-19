export const SELIG_SPEED=5.922;
export const DETECTION_RADIUS=90;
export function clearLine(a,b,free,step=.2){const d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.max(1,Math.ceil(d/step));for(let i=1;i<=n;i++)if(!free(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true;}
// Local navigation samples the same wall, furniture and door collision as the player.
export class Navigator {
 constructor(free){this.free=free;this.cell=.8;}
 point(x,z){return {x:(x+.5)*this.cell,z:(z+.5)*this.cell};}
 nearest(p){const x=Math.floor(p.x/this.cell),z=Math.floor(p.z/this.cell);for(let r=0;r<=2;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const a=this.point(x+dx,z+dz);if(this.free(a.x,a.z)&&clearLine(p,a,this.free))return [x+dx,z+dz];}return null;}
 path(from,to,limit=5500){const start=this.nearest(from),end=this.nearest(to);if(!start||!end)return [];const key=(x,z)=>x+','+z,goal=key(...end),first=key(...start),nodes=new Map([[first,{x:start[0],z:start[1],g:0,parent:null}]]),heap=[];
 const push=o=>{heap.push(o);let i=heap.length-1;while(i){let p=(i-1)>>1;if(heap[p].f<=o.f)break;heap[i]=heap[p];i=p;}heap[i]=o;};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;};
 push({k:first,f:0});let iterations=0;
 while(heap.length&&iterations++<limit){const {k}=pop(),node=nodes.get(k);if(node.closed)continue;node.closed=true;if(k===goal){let out=[],n=node;while(n){out.push(this.point(n.x,n.z));n=n.parent?nodes.get(n.parent):null}return out.reverse();}
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=node.x+dx,z=node.z+dz,k2=key(x,z),p=this.point(x,z);if(!this.free(p.x,p.z)||!clearLine(this.point(node.x,node.z),p,this.free))continue;const g=node.g+1,old=nodes.get(k2);if(old&&old.g<=g)continue;nodes.set(k2,{x,z,g,parent:k});push({k:k2,f:g+Math.abs(x-end[0])+Math.abs(z-end[1])});}}
 return [];}
 reachable(from,min,max,allowed=()=>true,limit=5000){const s=this.nearest(from);if(!s)return [];const queue=[{x:s[0],z:s[1],d:0}],seen=new Set([s.toString()]),out=[];for(let i=0;i<queue.length&&i<limit;i++){const n=queue[i],p=this.point(n.x,n.z);if(n.d*.8>=min&&allowed(p))out.push(p);if(n.d*.8>=max)continue;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n.x+dx,z=n.z+dz,k=x+','+z,a=this.point(x,z);if(seen.has(k)||!this.free(a.x,a.z)||!clearLine(p,a,this.free))continue;seen.add(k);queue.push({x,z,d:n.d+1});}}return out;}
}
export class Hunter {
 constructor({world,free,detectionClear=free,onAlert=()=>{},onEscape=()=>{},onCatch=()=>{},random=Math.random}){Object.assign(this,{world,free,detectionClear,onAlert,onEscape,onCatch,random});this.nav=new Navigator(free);this.state='roam';this.cooldown=0;this.x=0;this.z=0;this.path=[];this.repath=0;this.lost=0;this.reaction=0;this.roamClock=0;this.lastKnown=null;this.ready=false;}
 isHall=p=>this.world.map[Math.floor(p.z/this.world.S)]?.[Math.floor(p.x/this.world.S)]===1;
 place(player){ // Spawn once, outside the starting room, on an existing distant corridor.
 const candidates=[];for(let z=1;z<this.world.N-1;z++)for(let x=1;x<this.world.N-1;x++){const p={x:(x+.5)*this.world.S,z:(z+.5)*this.world.S},d=Math.hypot(p.x-player.x,p.z-player.z);if(d>35&&d<50&&this.isHall(p)&&this.free(p.x,p.z))candidates.push(p);}
 const p=candidates[Math.floor(this.random()*candidates.length)];if(!p)return false;this.x=p.x;this.z=p.z;this.ready=true;this.chooseRoam(player);return true;}
 chooseRoam(player,retreat=false){
 let choices=this.nav.reachable(this,7,23,this.isHall,2200);
 if(!choices.length)choices=this.nav.reachable(this,1,8,this.isHall,800);
 if(retreat){choices.sort((a,b)=>Math.hypot(b.x-player.x,b.z-player.z)-Math.hypot(a.x-player.x,a.z-player.z));choices=choices.slice(0,30);}
 // Patrol independently of the player's hidden position; avoid revisiting the last destination.
 const fresh=choices.filter(p=>!this.previousGoal||Math.hypot(p.x-this.previousGoal.x,p.z-this.previousGoal.z)>6);
 if(fresh.length)choices=fresh;
 this.path=[];
 for(let tries=0;tries<4&&choices.length;tries++){
  const goal=choices.splice(Math.floor(this.random()*choices.length),1)[0],path=this.nav.path(this,goal,2500);
  if(path.length>1){this.previousGoal={x:this.x,z:this.z};this.path=path;break;}
 }
 this.roamClock=this.path.length?Infinity:.25;
 }
 escape(player){this.state='roam';this.cooldown=20;this.lost=0;this.lastKnown=null;this.onEscape();this.chooseRoam(player,true);}
 update(dt,player,sealed=false,enraged=false){if(!this.ready||this.state==='caught')return;this.cooldown=Math.max(0,this.cooldown-dt);this.repath-=dt;this.roamClock-=dt;const distance=Math.hypot(this.x-player.x,this.z-player.z),detected=enraged||distance<=DETECTION_RADIUS&&clearLine(this,player,this.detectionClear,.05),direct=detected&&clearLine(this,player,this.free);
 if(this.state==='roam'&&(enraged||this.cooldown===0)&&detected){this.state='chase';this.lastKnown={x:player.x,z:player.z};this.reaction=0;this.repath=0;this.lost=0;this.path=[];this.onAlert();}
 if(this.state==='chase'){
  if(detected){this.lastKnown={x:player.x,z:player.z};this.lost=0}else this.lost+=dt;
  if(sealed){this.escape(player);return;}
  if(this.reaction>0){this.reaction-=dt;return;}
  if(distance<.85&&direct){this.state='caught';this.onCatch();return;}
  if(this.repath<=0){this.repath=.65;if(direct)this.path=[{x:player.x,z:player.z}];else this.path=this.nav.path(this,player,enraged?40000:5500);}
 }else if(this.roamClock<=0){this.chooseRoam(player,this.cooldown>0);}
 let remaining=(this.state==='chase'?SELIG_SPEED*(enraged?1.75:1):2.05)*dt,planned=false;
 while(remaining>1e-6){
  if(!this.path.length){
   if(this.state!=='roam'||planned)break;
   this.chooseRoam(player,this.cooldown>0);planned=true;if(!this.path.length)break;
  }
  const goal=this.path[0],dx=goal.x-this.x,dz=goal.z-this.z,d=Math.hypot(dx,dz);
  if(d<1e-6){this.path.shift();continue;}
  const step=Math.min(d,remaining),nx=this.x+dx/d*step,nz=this.z+dz/d*step;
  if(this.free(nx,nz)&&clearLine(this,{x:nx,z:nz},this.free)){
   this.x=nx;this.z=nz;remaining-=step;if(step===d)this.path.shift();
  }else{this.path=[];this.repath=0;this.roamClock=0;break;}
 }

 }
}
