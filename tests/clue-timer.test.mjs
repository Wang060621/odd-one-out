import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apply,createRoom,join,player,view} from '../lib/game.mjs';
import {advanceRoomClock,clueDeadline} from '../lib/clue-timer.mjs';

function setup(t,discussion=0){
  let now=100000;t.mock.method(Date,'now',()=>now);
  const ps=['Pearl','Sage','Mint'].map(player),room=createRoom('ABC234',ps[0],'everyday',discussion);
  ps.slice(1).forEach(p=>join(room,p));apply(room,ps[0].token,{type:'start'},()=>0);
  return {room,ps,time:n=>{now=n;}};
}
function ready(room,ps){ps.forEach(p=>apply(room,p.token,{type:'ready'}));}

test('60s starts only after everyone is ready; refresh keeps deadline',t=>{
  const {room,ps,time}=setup(t);assert.equal(clueDeadline(room),null);
  ready(room,ps);assert.equal(clueDeadline(room),160000);
  time(120000);assert.equal(view(room,ps[1].token).clueDeadline,160000);
  apply(room,ps[0].token,{type:'clue',text:'Something familiar'});
  assert.equal(clueDeadline(room),180000);assert.equal(room.clues.length,1);
  time(125000);apply(room,ps[1].token,{type:'clue',text:'A familiar object'});assert.equal(clueDeadline(room),185000);
});
test('exact expiry records one timeout, rejects late submission',t=>{
  const {room,ps,time}=setup(t);ready(room,ps);
  time(159999);assert.equal(advanceRoomClock(room),false);
  time(160000);
  assert.throws(()=>apply(room,'forged',{type:'clue',text:'late'}),/expired/);assert.equal(room.clues.length,0);
  assert.equal(advanceRoomClock(room),true);assert.equal(room.clues.length,1);assert.equal(room.clues[0].timedOut,true);
  assert.equal(advanceRoomClock(room),false);
  assert.throws(()=>apply(room,ps[0].token,{type:'clue',text:'late',expectedRound:1,expectedTurn:0}),/turn has ended/);
  assert.equal(room.clues.length,1);
});
test('offline catch-up finishes all turns and starts discussion at original deadline',t=>{
  const {room,ps,time}=setup(t,15);ready(room,ps);time(285000);
  assert.equal(advanceRoomClock(room),true);assert.equal(room.clues.length,3);
  assert.equal(room.discussionStarted,280000);assert.equal(room.phase,'discussion');
  time(295000);advanceRoomClock(room);assert.equal(room.phase,'vote');assert.equal(clueDeadline(room),null);
});
test('last timeout starts unlimited discussion; old rooms get a full minute; reset clears timer',t=>{
  const {room,ps,time}=setup(t);ready(room,ps);delete room.clueStarted;
  time(500000);assert.equal(advanceRoomClock(room),true);assert.equal(clueDeadline(room),560000);assert.equal(room.clues.length,0);
  time(680000);advanceRoomClock(room);assert.equal(room.phase,'discussion');assert.equal(room.discussionStarted,680000);
  apply(room,ps[0].token,{type:'reset'});assert.equal(clueDeadline(room),null);
  apply(room,ps[0].token,{type:'start'},()=>0);ready(room,ps);assert.equal(clueDeadline(room),740000);
  assert.throws(()=>apply(room,ps[0].token,{type:'clue',text:'stale',expectedRound:1,expectedTurn:0}),/turn has ended/);
});
