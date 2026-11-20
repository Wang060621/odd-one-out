import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, player, join, apply, view } from '../lib/game.mjs';
import { advanceDiscussion, discussionDeadline } from '../lib/discussion.mjs';

function setup(seconds=0) {
  const ps=['Alex','Sam','Jamie'].map(player);
  const room=createRoom('ABC234',ps[0],'everyday',seconds);
  ps.slice(1).forEach(p=>join(room,p));
  return {room,ps};
}
function discuss(room,ps) {
  apply(room,ps[0].token,{type:'start'},()=>0);
  ps.forEach(p=>apply(room,p.token,{type:'ready'}));
  ps.forEach(p=>apply(room,p.token,{type:'clue',text:'Something familiar'}));
}

for(const seconds of [15,30,60]) test(`${seconds}s starts after the last clue and expires at its exact server deadline`,t=>{
  let now=100000;t.mock.method(Date,'now',()=>now);
  const {room,ps}=setup(seconds);
  apply(room,ps[0].token,{type:'start'},()=>0);
  ps.forEach(p=>apply(room,p.token,{type:'ready'}));
  ps.slice(0,2).forEach(p=>apply(room,p.token,{type:'clue',text:'Something familiar'}));
  assert.equal(discussionDeadline(room),null);
  now+=5000;apply(room,ps[2].token,{type:'clue',text:'A familiar object'});
  const deadline=now+seconds*1000;
  assert.equal(view(room,ps[1].token).discussionDeadline,deadline);
  assert.equal(view(room,ps[1].token).serverNow,now);
  now=deadline-1;assert.equal(advanceDiscussion(room),false);
  now=deadline;
  assert.equal(advanceDiscussion(room),true);assert.equal(room.phase,'vote');
  assert.equal(advanceDiscussion(room),false);
  assert.equal(view(room,ps[1].token).discussionDeadline,null);
  assert.throws(()=>apply(room,ps[1].token,{type:'discuss',text:'Too late'}),/not open/);
  apply(room,ps[1].token,{type:'vote',target:ps[0].id});
  assert.equal(view(room,ps[1].token).myVote,ps[0].id);
});

test('unlimited and existing rooms keep discussion open until the host starts voting',t=>{
  let now=100000;t.mock.method(Date,'now',()=>now);
  for(const legacy of [false,true]) {
    const {room,ps}=setup();if(legacy)delete room.discussionSeconds;
    discuss(room,ps);now+=86400000;
    assert.equal(advanceDiscussion(room),false);
    assert.equal(view(room,ps[1].token).discussionSeconds,0);
    assert.equal(view(room,ps[1].token).discussionDeadline,null);
    assert.throws(()=>apply(room,ps[1].token,{type:'start-vote'}),/host/);
    apply(room,ps[0].token,{type:'start-vote'});assert.equal(room.phase,'vote');
  }
});

test('settings allow only the four choices, only the host and only in the lobby',()=>{
  const {room,ps}=setup();
  for(const invalid of [-1,1,14,16,45,61,'15',null,NaN,{},true]) {
    assert.throws(()=>createRoom('ABC234',ps[0],'food',invalid),/Choose/);
    assert.throws(()=>apply(room,ps[0].token,{type:'settings',discussionSeconds:invalid}),/Choose/);
    assert.equal(room.discussionSeconds,0);
  }
  assert.throws(()=>apply(room,ps[1].token,{type:'settings',discussionSeconds:15}),/host/);
  apply(room,ps[0].token,{type:'settings',discussionSeconds:30});assert.equal(room.pack,'everyday');
  apply(room,ps[0].token,{type:'settings',pack:'food'});assert.equal(room.discussionSeconds,30);
  discuss(room,ps);
  assert.throws(()=>apply(room,ps[0].token,{type:'settings',discussionSeconds:60}),/lobby/);
  apply(room,ps[0].token,{type:'start-vote'});assert.equal(room.phase,'vote');
});

test('reset and next round retain the duration but start a fresh timer',t=>{
  let now=100000;t.mock.method(Date,'now',()=>now);
  const {room,ps}=setup(15);discuss(room,ps);const first=discussionDeadline(room);
  apply(room,ps[0].token,{type:'reset'});assert.equal(discussionDeadline(room),null);
  now+=60000;discuss(room,ps);
  assert.equal(room.discussionSeconds,15);assert.equal(discussionDeadline(room),first+60000);
});
