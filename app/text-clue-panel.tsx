'use client';

export default function TextCluePanel({mine,current,next,remaining,expired,busy,clue,setClue,submit}:{mine:boolean;current:string;next?:string;remaining:number|null;expired:boolean;busy:boolean;clue:string;setClue:(value:string)=>void;submit:()=>void}) {
  return <>
    <h2>{mine?'Your turn to give a clue':`Waiting for ${current}.`}</h2>
    <p className="muted">Describe your word in one sentence without naming it. Each player has 60 seconds to submit a text clue.</p>
    <p className={'turn-time-note'+(remaining!==null&&remaining<=10?' urgent':'')} role="status">{expired?'Time is up. Moving to the next player…':remaining!==null&&remaining<=10?`Only ${remaining} seconds left.`:'Watch the countdown on the table.'}</p>
    {mine?<>
      <form onSubmit={e=>{e.preventDefault();submit();}}>
        <label htmlFor="clue">Your clue</label>
        <textarea id="clue" maxLength={80} required disabled={expired||busy} value={clue} onChange={e=>setClue(e.target.value)} placeholder="Type your clue…"/>
        <small className="char-count">{clue.length} / 80</small>
        <button className="primary wide" disabled={busy||expired||!clue.trim()}>Send clue</button>
      </form>
      <p className="turn-auto-note">Send your clue to continue. When time runs out, {next?`${next}’s turn starts`:'open discussion starts'} automatically.</p>
    </>:<p className="waiting-label">{expired?'Updating the turn…':`Read the clues. ${next?`${next} is next.`:'Discussion follows this turn.'}`}</p>}
  </>;
}
