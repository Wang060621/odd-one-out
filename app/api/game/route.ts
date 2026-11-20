import { env } from 'cloudflare:workers';
import { actor, apply, cleanCharacter, cleanName, createRoom, fail, join, player, view } from '../../../lib/game.mjs';
import { advanceRoomClock } from '../../../lib/clue-timer.mjs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return json({error:'Cross-site requests are not allowed.'},403);
    if (Number(request.headers.get('content-length') || 0) > 4096) return json({error:'The request is too large.'},413);
    const raw = await request.text();
    if (raw.length > 4096) return json({error:'The request is too large.'},413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({error:'Invalid request format.'},400); }
    if (!body || typeof body !== 'object') return json({error:'Invalid request format.'},400);
    if (!env.DB) return json({error:'The database is not connected yet.'},503);
    const db = env.DB;
    if (body.type === 'create') {
      const p = ({...player(body.name),...(body.character!==undefined?{character:cleanCharacter(body.character)}:{})});
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), n => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');
        const state = createRoom(code,p,body.pack,body.discussionSeconds);
        const inserted = await db.prepare('INSERT OR IGNORE INTO rooms (code,state,version,expires_at) VALUES (?,?,0,?)').bind(code,JSON.stringify(state),Date.now()+86400000).run();
        if (inserted.meta.changes) return json({token:p.token,room:view(state,p.token)});
      }
      fail('Could not create a room. Please try again.',503);
    }
    if (typeof body.code !== 'string' || !/^[A-HJ-NP-Z2-9]{6}$/.test(body.code)) fail('Enter a valid 6-character room code.');
    const token = request.headers.get('authorization')?.replace(/^Bearer /,'');
    // Version checks prevent concurrent clients from overwriting each other.
    for (let attempt=0;attempt<8;attempt++) {
      const stored = await db.prepare('SELECT state,version,expires_at FROM rooms WHERE code=?').bind(body.code).first<{state:string;version:number;expires_at:number}>();
      if (!stored || stored.expires_at < Date.now()) return json({error:'Room not found or expired after 24 hours. Please create a new room.'},404);
      const state = JSON.parse(stored.state);
      // Authenticate before allowing the clock to update a room. A state poll may
      // advance the stage, so persist it through the same CAS loop as any action.
      if (body.type !== 'join') actor(state,token);
      const expired = advanceRoomClock(state);
      if (body.type === 'state' && !expired) return json({room:view(state,token)});
      let issued;
      if (body.type === 'join') {
        cleanName(body.name);
        const p = ({...player(body.name),...(body.character!==undefined?{character:cleanCharacter(body.character)}:{})}); join(state,p); issued = p.token;
      } else if (body.type !== 'state') {
        apply(state,token,body);
      }
      const updated = await db.prepare('UPDATE rooms SET state=?,version=version+1 WHERE code=? AND version=?')
        .bind(JSON.stringify(state),body.code,stored.version).run();
      if (updated.meta.changes) {
        if (body.type === 'leave') return json({left:true});
        return json({...(issued ? {token:issued}:{}),room:view(state,issued || token)});
      }
    }
    return json({error:'The room is being updated. Please try again.'},409);
  } catch (error: any) {
    if (error.status) return json({error:error.message},error.status);
    console.error('Game request failed',error);
    return json({error:'The service is temporarily unavailable. Please try again shortly.'},500);
  }
}
