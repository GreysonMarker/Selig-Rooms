import assert from 'node:assert/strict';
import {createDetectionClear} from '../public/play/detection.mjs';
import {Hunter,clearLine} from '../public/play/hunter.mjs';
import {doorPose} from '../public/play/mechanics.mjs';
const world={S:3.2,N:25,map:Array.from({length:25},()=>Array(25).fill(1))};
const wall={x:20,y:1.5,z:10,w:.16,h:3,d:8};
const door={pose:doorPose({x:20,z:20,vertical:true}),angle:0};
const clear=createDetectionClear(world,{wall:[wall],wood:[{...wall,x:10}]},[door]);
assert(clear(10,10),'Furniture does not block detection');
assert(!clearLine({x:18,z:10},{x:22,z:10},clear,.05),'Wall blocks detection');
assert(!clearLine({x:18,z:20},{x:22,z:20},clear,.05),'Closed door blocks detection');
door.angle=Math.PI/2;
assert(clearLine({x:18,z:20},{x:22,z:20},clear,.05),'Open doorway allows detection');
for(const [dx,dz] of [[10,0],[-10,0],[0,10],[0,-10],[90,0],[90.1,0]]){
 const h=new Hunter({world,free:()=>true,detectionClear:()=>true});
 Object.assign(h,{x:40,z:40,ready:true,cooldown:0});h.update(.01,{x:40+dx,z:40+dz});
 assert.equal(h.state,Math.hypot(dx,dz)<=90?'chase':'roam');
}
const h=new Hunter({world,free:()=>false,detectionClear:()=>true});
Object.assign(h,{x:10,z:10,ready:true,cooldown:0});h.update(.01,{x:12,z:10});
assert.equal(h.state,'chase','Movement obstacles must not prevent radius alert');
console.log('Passed: 360-degree radius, range edge, furniture ignored, walls and closed doors block, open door allows detection.');
