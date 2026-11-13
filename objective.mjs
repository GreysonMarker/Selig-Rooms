import {Navigator,clearLine} from './hunter.mjs';
export const GRADES=[8,9,10,11,12];
export const QUEST_ROOMS=[5,12,20,28,35];
export class Objective {
 constructor(){this.reset();}
 reset(){this.phase='search';this.grades=new Set();}
 collect(grade){if(this.phase!=='search'||!GRADES.includes(grade)||this.grades.has(grade))return false;this.grades.add(grade);if(this.grades.size===5)this.phase='scene';return true;}
 drop(){if(this.phase==='scene')this.phase='drop';}
 takeKey(){if(this.phase==='drop')this.phase='return';}
 escape(){if(this.phase==='return')this.phase='escape';}
}
// Reverse navigation tree: furniture and walls count, doors are openable passages.
export class ReturnRoute {
 constructor(free,goal){this.nav=new Navigator(free);this.goal=goal;this.parents=new Map();this.queue=[];const n=this.nav.nearest(goal);if(n){const k=n.join(',');this.parents.set(k,null);this.queue.push(n);}this.cursor=0;}
 build(budget=350){for(let n=0;n<budget&&this.cursor<this.queue.length;n++,this.cursor++){
  const a=this.queue[this.cursor],p=this.nav.point(...a),key=a.join(',');
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const b=[a[0]+dx,a[1]+dz],k=b.join(','),q=this.nav.point(...b);if(this.parents.has(k)||!this.nav.free(q.x,q.z)||!clearLine(p,q,this.nav.free))continue;this.parents.set(k,key);this.queue.push(b);}
 }}
 path(player){const n=this.nav.nearest(player);if(!n||!this.parents.has(n.join(',')))return [];let k=n.join(','),out=[{x:player.x,z:player.z}];while(k){out.push(this.nav.point(...k.split(',').map(Number)));k=this.parents.get(k);}out.push(this.goal);return out;}
}
