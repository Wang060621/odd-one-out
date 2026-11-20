import assert from 'node:assert/strict';
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:5173';
async function api(body,session){const res=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:JSON.stringify({...body,...(session?{code:session.code}:{})})});const data=await res.json();return {...data,status:res.status};}
const created=await api({type:'create',name:'接口测试房主',pack:'food'});assert.equal(created.status,200,JSON.stringify(created));
const session={code:created.room.code,token:created.token};
const joined=await Promise.all(['接口测试甲','接口测试乙'].map(name=>api({type:'join',name,code:session.code})));
joined.forEach(j=>assert.equal(j.status,200,JSON.stringify(j)));
const sessions=[session,...joined.map(j=>({code:session.code,token:j.token}))];
assert.equal((await api({type:'state'},session)).room.players.length,3);
assert.equal((await api({type:'start'},sessions[1])).status,403);
assert.equal((await api({type:'state'},{code:session.code,token:'forged'})).status,401);
await api({type:'start'},session);
let state=await api({type:'state'},session);assert.equal(state.room.phase,'reveal');assert.ok(state.room.word);assert.equal(state.room.words,undefined);
const readies=await Promise.all(sessions.map(s=>api({type:'ready'},s)));readies.forEach(r=>assert.equal(r.status,200));
state=await api({type:'state'},session);assert.equal(state.room.phase,'clue');
// Concurrent join order is not guaranteed: follow the server's player order.
for(const p of state.room.players){let s;for(const candidate of sessions){const x=await api({type:'state'},candidate);if(x.room.me===p.id)s=candidate;}assert.ok(s);const r=await api({type:'clue',text:'这让我想起轻松的一天'},s);assert.equal(r.status,200);}
state=await api({type:'state'},session);assert.equal(state.room.phase,'discussion');
assert.equal((await api({type:'start-vote'},sessions[1])).status,403);
assert.equal((await api({type:'discuss',text:'Let us compare the clues.'},sessions[1])).status,200);
assert.equal((await api({type:'start-vote'},session)).status,200);
state=await api({type:'state'},session);assert.equal(state.room.phase,'vote');
const ids=state.room.players.map(p=>p.id);
for(const s of sessions){const v=await api({type:'state'},s);await api({type:'vote',target:v.room.me===ids[0]?ids[1]:ids[0]},s);}
state=await api({type:'state'},session);assert.equal(state.room.phase,'result');assert.equal(state.room.history.length,1);assert.equal(state.room.result.words.length,2);
assert.equal((await api({type:'vote',target:ids[0]},sessions[1])).status,400);
await api({type:'reset'},session);
await Promise.all(sessions.map(s=>api({type:'leave'},s)));
console.log('PASS: real API + local D1, concurrent join/ready, authorization, private words, full round, history and reset.');
