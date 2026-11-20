import assert from 'node:assert/strict';
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:5176';
const sessions=[];
async function api(body,session){const response=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},body:JSON.stringify({...body,...(session?{code:session.code}:{})})});return {status:response.status,...await response.json()};}
try{
  const created=await api({type:'create',name:'Character host',character:'pearl'});assert.equal(created.status,200);sessions.push({code:created.room.code,token:created.token});
  const joined=await api({type:'join',code:created.room.code,name:'Character guest',character:'rust'});assert.equal(joined.status,200);sessions.push({code:created.room.code,token:joined.token});
  assert.deepEqual(joined.room.players.map(p=>p.character),['pearl','rust']);
  const hostId=created.room.me;
  assert.equal((await api({type:'character',character:'coral',target:hostId},sessions[1])).status,200);
  const state=await api({type:'state'},sessions[0]);assert.deepEqual(state.room.players.map(p=>p.character),['pearl','coral']);
  assert.equal((await api({type:'character',character:'invalid'},sessions[1])).status,400);
  assert.equal((await api({type:'character',character:'amber'},{code:created.room.code,token:'forged'})).status,401);
  assert.equal((await api({type:'create',name:'Invalid character',character:'invalid'})).status,400);
  assert.equal((await api({type:'state'},sessions[1])).room.players[1].character,'coral');
  console.log('PASS: character choice on create/join, cross-player synchronization, own-player isolation, invalid-character rejection and persisted polling.');
}finally{for(const session of sessions)await api({type:'leave'},session);}
