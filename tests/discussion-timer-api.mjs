import assert from 'node:assert/strict';
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:5176';
async function api(body,session) {
  const response=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:JSON.stringify({...body,...(session?{code:session.code}:{})})});
  return {...await response.json(),status:response.status};
}
assert.equal((await api({type:'create',name:'Invalid timer',discussionSeconds:45})).status,400);
const made=await api({type:'create',name:'Timer host',discussionSeconds:15});
assert.equal(made.status,200,JSON.stringify(made));assert.equal(made.room.discussionSeconds,15);
const host={code:made.room.code,token:made.token};
const guests=[];
for(const name of ['Timer Sam','Timer Jamie']) {
  const joined=await api({type:'join',code:host.code,name});assert.equal(joined.status,200);
  assert.equal(joined.room.discussionSeconds,15);guests.push({code:host.code,token:joined.token});
}
const sessions=[host,...guests];
assert.equal((await api({type:'settings',discussionSeconds:30},guests[0])).status,403);
await api({type:'start'},host);
for(const session of sessions)await api({type:'ready'},session);
for(const session of sessions)assert.equal((await api({type:'clue',text:'A familiar thing'},session)).status,200);
const first=await api({type:'state'},guests[0]);assert.equal(first.room.phase,'discussion');
const deadline=first.room.discussionDeadline;assert.equal(deadline-first.room.discussionStarted,15000);
assert.equal((await api({type:'discuss',text:'Let us think.'},guests[0])).status,200);
assert.equal((await api({type:'state'},guests[1])).room.discussionDeadline,deadline);
// No host action or browser timer is required: a guest's state poll advances D1.
await new Promise(resolve=>setTimeout(resolve,Math.max(0,deadline-Date.now()+150)));
const polls=await Promise.all(guests.map(session=>api({type:'state'},session)));
polls.forEach(result=>{assert.equal(result.status,200);assert.equal(result.room.phase,'vote');});
assert.equal((await api({type:'discuss',text:'Too late'},guests[1])).status,400);
const late=await api({type:'vote',target:made.room.me},guests[0]);assert.equal(late.status,200);
assert.equal((await api({type:'state'},guests[0])).room.myVote,made.room.me);
await api({type:'reset'},host);
await api({type:'settings',discussionSeconds:0},host);
assert.equal((await api({type:'state'},guests[1])).room.discussionSeconds,0);
for(const session of [...guests,host])await api({type:'leave'},session);
console.log('PASS: timer saved at creation, shared across players, guest polling persists expiry in D1, concurrent expiry, late-message rejection and voting.');
