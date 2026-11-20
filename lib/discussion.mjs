export const discussionDurations = [0, 15, 30, 60];

export function discussionDeadline(room) {
  const seconds = room.discussionSeconds;
  return room.phase === 'discussion' && discussionDurations.includes(seconds) && seconds > 0 && Number.isFinite(room.discussionStarted)
    ? room.discussionStarted + seconds * 1000 : null;
}

export function discussionEnded(room, now = Date.now()) {
  const deadline = discussionDeadline(room);
  return deadline !== null && now >= deadline;
}

// The next authenticated game request persists expiry with the room's version check.
// No host tab, client clock or long-running server timer is needed.
export function advanceDiscussion(room, now = Date.now()) {
  if (!discussionEnded(room, now)) return false;
  room.phase = 'vote';
  return true;
}
