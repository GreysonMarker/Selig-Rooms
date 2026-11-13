export class Lobby {
 constructor(onState,onError){this.onState=onState;this.onError=onError;this.session=null;this.players=[];this.queue=[];this.ack=0;this.state={};this.running=false;this.failures=0;}
 async request(data){const r=await fetch('/api/lobby',{method:'POST',headers:{'Content-Type':'application/json',...(this.session?{Authorization:'Bearer '+this.session.token}:{})},body:JSON.stringify({...data,id:this.session?.id}),signal:AbortSignal.timeout(8000)});const b=await r.json();if(!r.ok)throw Error(b.error||'Connection failed');return b;}
 async connect(op,name,avatar,code){this.session=await this.request({op,name,avatar,code});this.running=true;this.ack=0;this.queue=[];this.poll();return this.session;}
 async poll(){if(!this.running)return;try{const event=this.queue[0];const result=await this.request({op:'sync',position:this.position,state:this.session.host?this.state:undefined,ack:this.ack,event});if(!this.running)return;if(event)this.queue.shift();this.failures=0;this.players=result.players;this.onState(result);}catch(e){if(!this.running)return;if(++this.failures>=3){this.running=false;this.onError(e.message);}}if(this.running)this.timer=setTimeout(()=>this.poll(),this.status==='lobby'?500:200);}
 event(type,index){if(!this.session)return;this.queue.push({type,index,nonce:crypto.randomUUID()});}
 async start(){await this.request({op:'start'});}
 async leave(){this.running=false;clearTimeout(this.timer);try{if(this.session)await this.request({op:'leave'});}catch{}this.session=null;this.players=[];this.state={};}
}
