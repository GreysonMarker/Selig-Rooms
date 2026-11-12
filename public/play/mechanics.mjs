export const WALK_SPEED=2.5,SPRINT_SPEED=6.58;
export const LOOK={mouseX:.0046,mouseY:.0023,touchX:.008,touchY:.004};
export class Stamina {
 constructor(){this.value=1;this.chased=false;this.exhausted=false;this.cooldown=0;}
 get duration(){return 4;}
 get canSprint(){return !this.exhausted&&this.value>0;}
 update(dt,running){if(running&&this.canSprint){this.value=Math.max(0,this.value-dt/this.duration);this.cooldown=1.1;if(this.value<1e-8){this.value=0;this.exhausted=true;}}else{this.cooldown=Math.max(0,this.cooldown-dt);if(!this.cooldown)this.value=Math.min(1,this.value+dt/6);if(this.value>=.2)this.exhausted=false;}}
}
export function doorPose(edge){return {x:edge.x-(edge.vertical?0:.71),z:edge.z-(edge.vertical?.71:0),base:edge.vertical?-Math.PI/2:0,width:1.42};}
export function doorCollision(door,x,z,angle=door.angle,radius=.25){const p=door.pose,a=p.base+angle,dx=x-p.x,dz=z-p.z;const lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=Math.sin(a)*dx+Math.cos(a)*dz;return lx> -radius&&lx<p.width+radius&&Math.abs(lz)<.035+radius;}
export function awayAngle(door,x,z){let p=door.pose,side=Math.sin(p.base)*(x-p.x)+Math.cos(p.base)*(z-p.z);return side>=0?Math.PI/2:-Math.PI/2;}
