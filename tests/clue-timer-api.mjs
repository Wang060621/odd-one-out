import assert from 'node:assert/strict';
const base=process.env.GAME_TEST_URL||'http://127.0.0.1:5176';
const sessions=[];
async function api(body,s){const r=await fetch(base+'/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(s?{Authorization:`Bearer ${s.token}`}:{})},body:JSON.stringify({...body,...(s?{code:s.code}:{})})});return {status:r.status,...await r.json()};}
try{
  const first=await api({type:'create',name:'Timer host'});assert.equal(first.status,200);
  sessions.push({code:first.room.code,token:first.token});
  for(const name of ['Timer guest A','Timer guest B']){const p=await api({type:'join',name,code:first.room.code});assert.equal(p.status,200);sessions.push({code:p.room.code,token:p.token});}
  await api({type:'start'},sessions[0]);for(const s of sessions)await api({type:'ready'},s);
  const started=(await api({type:'state'},sessions[0])).room;
  assert.equal(started.clueSeconds,60);assert.ok(started.clueDeadline-started.serverNow>58000);
  assert.equal((await api({type:'state'},sessions[1])).room.clueDeadline,started.clueDeadline);
  assert.equal((await api({type:'state'},{code:first.room.code,token:'forged'})).status,401);
  console.log('Timer running. Waiting for a real 60-second deadline…');
  await new Promise(r=>setTimeout(r,Math.max(0,started.clueDeadline-Date.now())+200));
  const states=await Promise.all(Array.from({length:5},()=>api({type:'state'},sessions[1])));
  for(const s of states){assert.equal(s.status,200);assert.equal(s.room.clues.length,1);assert.equal(s.room.clues[0].timedOut,true);assert.equal(s.room.phase,'clue');}
  assert.equal((await api({type:'clue',text:'Late clue',expectedRound:started.round,expectedTurn:0},sessions[0])).status,400);
  for(const [i,s] of sessions.entries()){if(i)assert.equal((await api({type:'clue',text:'An everyday object',expectedRound:started.round,expectedTurn:i},s)).status,200);}
  const final=(await api({type:'state'},sessions[0])).room;assert.equal(final.phase,'discussion');assert.equal(final.clues.length,3);assert.equal(final.clueDeadline,null);
  console.log('PASS: real deadline, refresh consistency, concurrent expiry, late rejection, manual turns and discussion transition.');
}finally{if(sessions.length){await api({type:'reset'},sessions[0]);for(const s of sessions.slice().reverse())await api({type:'leave'},s);}}
