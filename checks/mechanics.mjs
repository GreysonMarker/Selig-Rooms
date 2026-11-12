import assert from 'node:assert/strict';
import {Stamina,doorPose,doorCollision,awayAngle,LOOK,SPRINT_SPEED,WALK_SPEED} from '../public/play/mechanics.mjs';
import {createWorld} from '../public/play/world.mjs';
assert.equal(LOOK.mouseX,.0023*2);assert.equal(LOOK.touchX,.004*2);assert.equal(LOOK.mouseY,.0023);assert.equal(LOOK.touchY,.004);
for(const [chased,seconds] of [[false,4],[true,4]]){let s=new Stamina();s.chased=chased;for(let i=0;i<seconds*100;i++)s.update(.01,true);assert(s.exhausted);assert.equal(s.value,0);assert(!s.canSprint);for(let i=0;i<250;i++)s.update(.01,false);assert(s.canSprint);for(let i=0;i<600;i++)s.update(.01,false);assert.equal(s.value,1);}
let s=new Stamina();s.update(2,true);assert.equal(s.value,.5);s.chased=true;assert.equal(s.duration,4);assert.equal(s.value,.5);s.update(1,true);assert.equal(s.value,.25);s.chased=false;assert.equal(s.value,.25);
for(const e of createWorld().doors){const d={pose:doorPose(e),angle:0};assert(doorCollision(d,e.x,e.z),'Closed door must block opening');for(const sign of [-1,1]){let px=e.x+(e.vertical?sign:0),pz=e.z+(e.vertical?0:sign),angle=awayAngle(d,px,pz);assert(!doorCollision(d,px,pz,angle),'Door must swing away from player');assert(!doorCollision(d,e.x,e.z,angle),'Open door must clear opening');assert(doorCollision(d,e.x,e.z,0),'Reclosed door must block opening');}}
console.log('Passed: 2× horizontal sensitivity; constant 4-second stamina, recovery and chase transitions; all doors closed collision and two-sided opening.');

assert.equal(SPRINT_SPEED,6.58);assert(Math.abs(SPRINT_SPEED/4.7-1.4)<1e-12);assert.equal(WALK_SPEED,2.5);
