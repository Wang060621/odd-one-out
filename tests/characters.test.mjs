import test from 'node:test';
import assert from 'node:assert/strict';
import {apply,player,join,createRoom,view,cleanCharacter} from '../lib/game.mjs';
import {characters} from '../lib/characters.mjs';
test('characters are public, persist across rounds, and never expose player tokens',()=>{
  const ps=['host','guest','third'].map(player),room=createRoom('ABC234',ps[0]);ps.slice(1).forEach(p=>join(room,p));
  apply(room,ps[1].token,{type:'character',character:'violet'});
  for(const p of ps){const v=view(room,p.token);assert.equal(v.players[1].character,'violet');assert.ok(v.players.every(x=>!('token' in x)));}
  apply(room,ps[0].token,{type:'start'});assert.equal(view(room,ps[0].token).players[1].character,'violet');
  assert.throws(()=>apply(room,ps[1].token,{type:'character',character:'mint'}),/before the round/);
  apply(room,ps[0].token,{type:'reset'});assert.equal(view(room,ps[0].token).players[1].character,'violet');
});
test('only own character can be changed; invalid characters and forged sessions are rejected',()=>{
  const host=player('host'),guest=player('guest'),room=createRoom('ABC234',host);join(room,guest);
  apply(room,guest.token,{type:'character',character:'coral',target:host.id});
  assert.equal(guest.character,'coral');assert.equal(host.character,undefined);
  for(const value of ['missing',null,4,{},'__proto__'])assert.throws(()=>cleanCharacter(value),/valid character/);
  assert.throws(()=>apply(room,'forged',{type:'character',character:'blue'}),/session/);
  assert.ok(view(room,host.token).players.every(p=>typeof p.character==='string'));
});
test('both new characters synchronize to every player and keep their identity in a round',()=>{
  assert.equal(characters.length,8);assert.equal(new Set(characters.map(c=>c.id)).size,8);
  const ps=['host','guest','third'].map(player),room=createRoom('ABC234',ps[0]);ps.slice(1).forEach(p=>join(room,p));
  apply(room,ps[0].token,{type:'character',character:'pearl'});apply(room,ps[1].token,{type:'character',character:'rust'});
  for(const p of ps)assert.deepEqual(view(room,p.token).players.slice(0,2).map(x=>x.character),['pearl','rust']);
  apply(room,ps[0].token,{type:'start'});assert.deepEqual(view(room,ps[2].token).players.slice(0,2).map(x=>x.character),['pearl','rust']);
});
