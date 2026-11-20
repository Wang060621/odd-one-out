import {advanceDiscussion} from './discussion.mjs';

export const clueSeconds = 60;
export function clueDeadline(room) {
  if (room.phase !== 'clue') return null;
  if (Number.isFinite(room.clueDeadline)) return room.clueDeadline;
  return Number.isFinite(room.clueStarted) ? room.clueStarted + clueSeconds * 1000 : null;
}
export function clueEnded(room, now = Date.now()) {
  const deadline = clueDeadline(room);
  return deadline !== null && now >= deadline;
}
export function finishClue(room, now = Date.now()) {
  if (room.clues.length === room.players.length) {
    room.phase = 'discussion';
    room.discussionStarted = now;
    room.clueStarted = null;
  } else room.clueStarted = now;
}
// Catch up using the original deadlines, even when every browser was offline.
// Existing active rooms receive a full first timed turn on their next poll.
export function advanceRoomClock(room, now = Date.now()) {
  let changed = false;
  if (room.phase === 'clue' && !Number.isFinite(room.clueStarted)) {
    room.clueStarted = now;
    changed = true;
  }
  while (room.phase === 'clue' && clueEnded(room, now)) {
    const deadline = clueDeadline(room);
    room.clues.push({playerId:room.players[room.clues.length].id,text:'Time ran out. No clue submitted.',timedOut:true});
    finishClue(room, deadline);
    changed = true;
  }
  return advanceDiscussion(room, now) || changed;
}
