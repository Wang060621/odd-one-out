import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,player,join,apply,view} from '../lib/game.mjs';
function setup(){const ps=['Alex','Sam','Jamie'].map(player);const r=createRoom('ABC234',ps[0]);ps.slice(1).forEach(p=>join(r,p));apply(r,ps[0].token,{type:'start'},()=>0);ps.forEach(p=>apply(r,p.token,{type:'ready'}));return{r,ps};}
test('all clues lead to discussion, votes stay locked until the host opens them',()=>{
 const {r,ps}=setup();ps.forEach((p,i)=>apply(r,p.token,{type:'clue',text:`A clue ${i}`}));assert.equal(r.phase,'discussion');
 assert.throws(()=>apply(r,ps[0].token,{type:'vote',target:ps[1].id}),/stage/);
 assert.throws(()=>apply(r,ps[1].token,{type:'start-vote'}),/host/);
 apply(r,ps[1].token,{type:'discuss',text:'It might be Alex.'});assert.equal(view(r,ps[0].token).messages[0].text,'It might be Alex.');
 assert.throws(()=>apply(r,ps[1].token,{type:'discuss',text:'Too fast'}),/wait/);
 apply(r,ps[0].token,{type:'start-vote'});assert.equal(r.phase,'vote');
 assert.throws(()=>apply(r,ps[1].token,{type:'discuss',text:'Too late'}),/not open/);
});
test('new rounds reset discussion without exposing secret words',()=>{const {r,ps}=setup();ps.forEach(p=>apply(r,p.token,{type:'clue',text:'A vague clue'}));apply(r,ps[0].token,{type:'discuss',text:'Let us compare.'});assert.equal(view(r,ps[1].token).words,undefined);apply(r,ps[0].token,{type:'reset'});apply(r,ps[0].token,{type:'start'},()=>0);assert.equal(r.messages.length,0);assert.equal(view(r,ps[0].token).messages.length,0);});

test('legacy audio submissions are rejected without advancing the turn',()=>{const {r,ps}=setup();for(const command of [{type:'clue',voice:true},{type:'clue',voice:true,text:'A clue'}])assert.throws(()=>apply(r,ps[0].token,command),/Only text/);assert.equal(r.clues.length,0);});
