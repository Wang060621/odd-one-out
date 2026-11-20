import { discussionDurations, discussionDeadline } from './discussion.mjs';
import {isCharacter,characterFor} from './characters.mjs';
import {advanceRoomClock,clueDeadline,clueSeconds,finishClue} from './clue-timer.mjs';
export function cleanCharacter(id){if(!isCharacter(id))fail('Choose a valid character.');return id;}
export const packs = {
  everyday: { label: 'Everyday life', pairs: [['Umbrella','Raincoat'],['Toothbrush','Floss'],['Sofa','Armchair'],['Lift','Escalator'],['Alarm clock','Doorbell'],['Backpack','Suitcase'],['Glasses','Contact lenses'],['Desk lamp','Torch'],['Train','Bus'],['Shampoo','Shower gel']] },
  food: { label: 'Food & drink', pairs: [['Coffee','Tea'],['Dumpling','Wonton'],['Cake','Bread'],['Hot pot','Barbecue'],['Ice cream','Yogurt'],['Orange','Grapefruit'],['Burger','Sandwich'],['Fries','Crisps'],['Sushi','Rice ball'],['Cola','Lemonade']] },
  campus: { label: 'Campus life', pairs: [['Library','Study room'],['Teacher','Tutor'],['Exam','Quiz'],['Dormitory','Apartment'],['Blackboard','Whiteboard'],['Society','Student union'],['Basketball','Volleyball'],['Pencil','Pen'],['Textbook','Notebook'],['Graduation','Orientation']] },
};
export function fail(message, status = 400) { const e = new Error(message); e.status = status; throw e; }
export function cleanName(input) {
  if (typeof input !== 'string' || !input.trim() || input.trim().length > 20) fail('Enter a nickname with 1–20 characters.');
  return input.trim();
}
export function player(name) { return { id: crypto.randomUUID(), token: crypto.randomUUID() + crypto.randomUUID(), name: cleanName(name), score: 0 }; }
function validDiscussionSeconds(seconds) {
  if (!discussionDurations.includes(seconds)) fail('Choose 15 seconds, 30 seconds, 1 minute or no time limit.');
  return seconds;
}
export function createRoom(code, p, pack = 'everyday', discussionSeconds = 0) {
  if (!Object.hasOwn(packs, pack)) fail('Choose a valid word pack.');
  return { code, host: p.id, players: [p], pack, discussionSeconds: validDiscussionSeconds(discussionSeconds), phase: 'lobby', round: 0, history: [], createdAt: Date.now() };
}
export function actor(room, token) { return room.players.find(p => p.token === token) || fail('Your session has expired. Please rejoin the room.', 401); }
function hostOnly(room, p) { if (room.host !== p.id) fail('Only the host can do that.', 403); }
function result(room, target) {
  const majorityWon = target === room.odd;
  const winners = room.players.filter(p => majorityWon ? p.id !== room.odd : p.id === room.odd);
  winners.forEach(p => p.score++);
  room.result = { majorityWon, target, odd: room.odd, words: room.words, winners: winners.map(p => p.id), votes: {...room.votes} };
  room.phase = 'result';
  room.history.unshift({ round: room.round, oddName: room.players.find(p => p.id === room.odd).name, words: room.words, majorityWon });
  room.history = room.history.slice(0, 20);
}
export function apply(room, token, command, randomIndex = n => crypto.getRandomValues(new Uint32Array(1))[0] % n) {
  const p = actor(room, token);
  advanceRoomClock(room);
  const { type } = command;
  if (type === 'character') {
    if(room.phase!=='lobby')fail('Characters can only be changed before the round starts.');
    p.character=cleanCharacter(command.character);
  } else if (type === 'start') {
    hostOnly(room, p);
    if (!['lobby','result'].includes(room.phase)) fail('This round has not finished yet.');
    if (room.players.length < 3) fail('At least 3 players are needed.');
    if (command.customA || command.customB) {
      const a = cleanName(command.customA), b = cleanName(command.customB);
      if (a === b) fail('The two custom words must be different.');
      room.words = [a,b];
    } else {
      const pairs = packs[room.pack].pairs;
      room.words = pairs[randomIndex(pairs.length)];
    }
    room.round++;
    room.odd = room.players[randomIndex(room.players.length)].id;
    room.ready = []; room.clues = []; room.clueStarted = null; room.messages = []; room.discussionStarted = null; room.votes = {}; room.candidates = []; room.ballot = 1; room.result = null;
    room.phase = 'reveal';
  } else if (type === 'ready') {
    if (room.phase !== 'reveal') fail('It is not the word reveal stage.');
    if (!room.ready.includes(p.id)) room.ready.push(p.id);
    if (room.ready.length === room.players.length) { room.phase = 'clue'; room.clueStarted = Date.now(); }
  } else if (type === 'clue') {
    if ((command.expectedRound !== undefined && command.expectedRound !== room.round) || (command.expectedTurn !== undefined && command.expectedTurn !== room.clues.length)) fail('That turn has ended. Please wait for the latest room state.');
    if (room.phase !== 'clue' || room.players[room.clues.length]?.id !== p.id) fail('Wait for your turn to give a clue.');
    if (command.voice !== undefined) fail('Only text clues are supported.');
    if (typeof command.text !== 'string' || !command.text.trim() || command.text.trim().length > 80) fail('A clue must contain 1–80 characters.');
    const clue = command.text.trim();
    if (room.words.some(w => clue.toLocaleLowerCase().includes(w.toLocaleLowerCase()))) fail('Your clue cannot contain either word. Try a different description.');
    room.clues.push({ playerId: p.id, text: clue });
    finishClue(room);
  } else if (type === 'discuss') {
    if (room.phase !== 'discussion') fail('Discussion is not open right now.');
    if (typeof command.text !== 'string' || !command.text.trim() || command.text.trim().length > 200) fail('A discussion message must contain 1–200 characters.');
    const messages = room.messages || [];
    const previous = [...messages].reverse().find(m => m.playerId === p.id);
    if (previous && Date.now() - previous.sentAt < 1200) fail('Please wait a moment before sending another message.',429);
    room.messages = [...messages, {id:crypto.randomUUID(),playerId:p.id,text:command.text.trim(),sentAt:Date.now()}].slice(-100);
  } else if (type === 'start-vote') {
    hostOnly(room,p);
    if (room.phase !== 'discussion') fail('Finish the clues before starting the vote.');
    room.phase = 'vote';
  } else if (type === 'vote') {
    if (room.phase !== 'vote') fail('It is not the voting stage.');
    if (room.votes[p.id]) fail('You have already voted.');
    if (command.target === p.id || !room.players.some(x => x.id === command.target)) fail('Choose another player.');
    if (room.candidates.length && !room.candidates.includes(command.target)) fail('Choose one of the tied candidates.');
    room.votes[p.id] = command.target;
    if (Object.keys(room.votes).length === room.players.length) {
      const counts = Object.values(room.votes).reduce((a,id) => ({...a,[id]:(a[id] || 0)+1}), {});
      const max = Math.max(...Object.values(counts));
      const tied = Object.keys(counts).filter(id => counts[id] === max);
      if (tied.length > 1 && room.ballot < 3) { room.candidates = tied; room.votes = {}; room.ballot++; }
      else if (tied.length > 1) {
        room.result = { draw: true, odd: room.odd, words: room.words, votes: {...room.votes}, winners: [] };
        room.phase = 'result';
        room.history.unshift({ round: room.round, oddName: room.players.find(p => p.id === room.odd).name, words: room.words, draw: true });
        room.history = room.history.slice(0,20);
      } else result(room, tied[0]);
    }
  } else if (type === 'settings') {
    hostOnly(room, p);
    if (room.phase !== 'lobby') fail('Room settings can only be changed in the lobby.');
    if (command.pack === undefined && command.discussionSeconds === undefined) fail('Choose a room setting to change.');
    if (command.pack !== undefined && !Object.hasOwn(packs, command.pack)) fail('That word pack does not exist.');
    if (command.discussionSeconds !== undefined) validDiscussionSeconds(command.discussionSeconds);
    if (command.pack !== undefined) room.pack = command.pack;
    if (command.discussionSeconds !== undefined) room.discussionSeconds = command.discussionSeconds;
  } else if (type === 'reset') {
    hostOnly(room, p); room.phase = 'lobby'; room.result = null; room.clueStarted = null;
  } else if (type === 'leave' || type === 'remove') {
    if (!['lobby','result'].includes(room.phase)) fail('Wait until the round ends, or ask the host to end it first.');
    if (type === 'remove') hostOnly(room, p);
    const id = type === 'remove' ? command.target : p.id;
    if (!room.players.some(x => x.id === id)) fail('That player is not in this room.');
    if (type === 'remove' && id === room.host) fail('The host cannot remove themselves.');
    room.players = room.players.filter(x => x.id !== id);
    if (room.host === id) room.host = room.players[0]?.id ?? null;
    room.phase = 'lobby'; room.result = null;
  } else fail('Unknown game action.');
  return room;
}
export function join(room, p) {
  if (room.phase !== 'lobby') fail('The game has started. Wait for the host to return to the lobby.');
  if (room.players.length >= 8) fail('This room is full. The maximum is 8 players.');
  if (room.players.some(x => x.name.toLocaleLowerCase() === p.name.toLocaleLowerCase())) fail('That nickname is taken. Choose another one.');
  room.players.push(p);
  return room;
}
export function view(room, token) {
  const p = actor(room, token);
  const inGame = ['reveal','clue','discussion','vote'].includes(room.phase);
  return {
    code: room.code, phase: room.phase, host: room.host, me: p.id, pack: room.pack, round: room.round,
    discussionSeconds: room.discussionSeconds || 0, discussionDeadline: discussionDeadline(room), serverNow: Date.now(),
    clueSeconds, clueDeadline: clueDeadline(room),
    players: room.players.map(({id,name,score,character},index) => ({id,name,score,character:characterFor(character,index).id})),
    word: inGame ? room.words[p.id === room.odd ? 1 : 0] : null,
    ready: inGame ? room.ready : [], clues: inGame ? room.clues : [],
    messages: ['discussion','vote'].includes(room.phase) ? room.messages || [] : [],
    discussionStarted: room.phase === 'discussion' ? room.discussionStarted || null : null,
    myVote: room.phase === 'vote' ? room.votes[p.id] || null : null,
    voteCount: room.phase === 'vote' ? Object.keys(room.votes).length : 0,
    candidates: room.phase === 'vote' ? room.candidates : [], ballot: room.ballot || 1,
    result: room.phase === 'result' ? room.result : null, history: room.history,
  };
}
