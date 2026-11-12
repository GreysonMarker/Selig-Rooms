import assert from 'node:assert/strict';import {createWorld} from '../public/play/world.mjs';import {furnish} from '../public/play/rooms.mjs';import {Hunter} from '../public/play/hunter.mjs';import {doorPose,doorCollision} from '../public/play/mechanics.mjs';
const world=createWorld(),buckets=new Map(),S=world.S;
furnish(world,()=>{},(x,z,w,d)=>{const o={x,z,w:w/2+.25,d:d/2+.25};for(let a=Math.floor((x-o.w)/S);a<=Math.floor((x+o.w)/S);a++)for(let b=Math.floor((z-o.d)/S);b<=Math.floor((z+o.d)/S);b++){const k=a+','+b;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(o)}});
const doors=world.doors.map(edge=>({edge,pose:doorPose(edge),angle:0}));const free=(x,z,ignoreDoors=false)=>{for(const a of [-.25,.25])for(const b of [-.25,.25])if(!world.map[Math.floor((z+b)/S)]?.[Math.floor((x+a)/S)])return false;for(const o of buckets.get(Math.floor(x/S)+','+Math.floor(z/S))??[])if(Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d)return false;return ignoreDoors||!doors.some(d=>doorCollision(d,x,z));};

const {Objective,GRADES,QUEST_ROOMS,ReturnRoute}=await import('../public/play/objective.mjs');
const o=new Objective();assert.equal(o.phase,'search');for(const grade of GRADES){assert(o.collect(grade));assert(!o.collect(grade));}assert.equal(o.phase,'scene');o.drop();o.takeKey();o.escape();assert.equal(o.phase,'escape');o.reset();assert.equal(o.grades.size,0);
const route=new ReturnRoute((x,z)=>free(x,z,true),world.spawn);while(route.cursor<route.queue.length)route.build(1000);
for(const id of QUEST_ROOMS){const e=world.doors.find(d=>d.room===id),v=e.side===0?[0,1]:e.side===1?[-1,0]:e.side===2?[0,-1]:[1,0],p={x:e.x+v[0]*1.7,z:e.z+v[1]*1.7};assert(free(p.x,p.z,true),'Lanyard is blocked in room '+id);const path=route.path(p);assert(path.length>0,'No route from room '+id);for(let i=1;i<path.length;i++)assert((await import('../public/play/hunter.mjs')).clearLine(path[i-1],path[i],(x,z)=>free(x,z,true)),'Route crosses wall');assert([4.2,3.5,2.8].some(d=>free(e.x+v[0]*d,e.z+v[1]*d,true)),'No cinematic position');}
console.log('Passed: five distinct collectible rooms reachable, complete objective flow/reset, return routes avoid walls and furniture. Navigation nodes: '+route.parents.size);

for(const id of QUEST_ROOMS){const e=world.doors.find(d=>d.room===id),v=e.side===0?[0,1]:e.side===1?[-1,0]:e.side===2?[0,-1]:[1,0],d=[4.2,3.5,2.8].find(d=>free(e.x+v[0]*d,e.z+v[1]*d,true));assert(free(e.x+v[0]*(d-1.55),e.z+v[1]*(d-1.55),true),'Key drop blocked '+id);}

function permutations(a){return a.length?a.flatMap((v,i)=>permutations(a.filter((_,j)=>j!==i)).map(p=>[v,...p])):[[]];}
for(const order of permutations(GRADES)){const q=new Objective();q.escape();assert.equal(q.phase,'search');for(const g of order)assert(q.collect(g));assert.equal(q.phase,'scene');q.drop();q.escape();assert.equal(q.phase,'drop');q.takeKey();q.escape();assert.equal(q.phase,'escape');}
console.log('Passed all 120 lanyard orders without a starting key; hatch requires dropped key.');
