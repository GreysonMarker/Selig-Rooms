export class JumpScare {
 constructor({onStart,onFinish}){this.onStart=onStart;this.onFinish=onFinish;this.active=false;this.endsAt=0;}
 start(now,duration=2.543333){if(this.active)return;this.active=true;this.endsAt=now+duration*1000;this.onStart();}
 update(now){if(this.active&&now>=this.endsAt){this.active=false;this.onFinish();}}
 cancel(){this.active=false;}
}
