import assert from 'node:assert/strict';
import {bindAction} from '../public/play/controls.mjs';
const sprint=new EventTarget(),interact=new EventTarget();let run=false,actions=0;
bindAction(sprint,()=>run=!run);bindAction(interact,()=>actions++);
function send(target,type,props){const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);return e;}
// A joystick already owns the primary finger; secondary touches still fire.
const move={pointerId:1,x:.4,z:1};
assert(send(sprint,'pointerdown',{pointerId:2,pointerType:'touch',isPrimary:false,button:0}).defaultPrevented);assert(run);
send(sprint,'click',{detail:1});assert(run,'A synthetic click must not undo sprint');
send(interact,'pointerdown',{pointerId:3,pointerType:'touch',isPrimary:false,button:0});assert.equal(actions,1);
send(interact,'click',{detail:1});assert.equal(actions,1);
send(interact,'click',{detail:0});assert.equal(actions,2,'Keyboard activation remains available');
assert.deepEqual(move,{pointerId:1,x:.4,z:1});
console.log('Passed: secondary-finger actions trigger immediately; no duplicate click; keyboard activation retained.');
