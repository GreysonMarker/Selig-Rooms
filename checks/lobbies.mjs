import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import ts from 'typescript';
const sqlite=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
globalThis.__env={DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this;},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};}};}}};
const code=ts.transpileModule(readFileSync('app/api/lobby/route.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__env;'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {POST}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
async function call(b,session){const r=await POST(new Request('https://game.test/api/lobby',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://game.test',...(session?{Authorization:'Bearer '+session.token}:{})},body:JSON.stringify({...b,...(session?{id:session.id}:{})})}));return {status:r.status,...await r.json()};}
const host=await call({op:'create',name:'Host',avatar:{gender:'female',shirt:'columbia'}});assert.equal(host.status,200);assert.equal(host.code.length,6);
const guests=[];for(let i=0;i<3;i++)guests.push(await call({op:'join',code:host.code,name:'Guest'+i}));assert.equal(guests[2].status,200);assert.equal((await call({op:'join',code:host.code})).status,409);
assert.equal((await call({op:'start'},guests[0])).status,403);assert.equal((await call({op:'start'},host)).status,'playing');
assert.equal((await call({op:'sync'},{...host,token:'wrong'})).status,401);
await call({op:'sync',position:{x:18,z:20,yaw:1},event:{type:'collect',index:12,nonce:'unique'}},guests[0]);
const h=await call({op:'sync',state:{hunter:{x:11,z:12},quest:{grades:[12]}}},host);assert.equal(h.events.length,1);assert.equal(h.events[0].payload.index,12);assert.equal(h.players.length,4);assert(!('token' in h.players[0]));
const g=await call({op:'sync'},guests[1]);assert.equal(g.state.hunter.x,11);assert.deepEqual(g.state.quest.grades,[12]);
await call({op:'sync',ack:h.events[0].id},host);assert.equal((await call({op:'sync',ack:h.events[0].id},host)).events.length,0);
await call({op:'leave'},host);assert.equal((await call({op:'sync'},guests[0])).status,410);
console.log('Passed: four-player lobbies, room code join, capacity limit, token auth, host-only start, shared state/events, event acknowledgement, host disconnect.');
