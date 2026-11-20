'use client';
import { useEffect, useRef, useState } from 'react';
import { WordCard } from './word-card';
import TextCluePanel from './text-clue-panel';
import ClubScene, { ClubMember } from './club-scene';
import type { GameMotion } from './game-motion';
import PaintedLobby from './painted-lobby';
import CharacterPicker,{CharacterSprite} from './character-picker';
import {isCharacter,characterFor} from '../lib/characters.mjs';
import { ArrowRight, Check, CheckCheck, ChevronRight, Copy, DoorOpen, Fingerprint, HelpCircle, Layers3, LoaderCircle, MessageCircle, Plus, RotateCcw, ShieldCheck, Sparkles, Trophy, Users, Vote, X } from 'lucide-react';

type Session = { code: string; token: string };
const packNames: Record<string,string> = { everyday:'Everyday life', food:'Food & drink', campus:'Campus life' };
const phaseNames: Record<string,string> = {lobby:'Lobby',reveal:'Your word',clue:'Give clues',discussion:'Discuss',vote:'Vote',result:'The reveal'};
const discussionOptions = [[0,'No time limit'],[15,'15 seconds'],[30,'30 seconds'],[60,'1 minute']] as const;
const colors = ['peach','mint','lavender','yellow','blue','rose','mint','peach'];
function Mark() { return <span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span>; }


async function request(body: any, session?: Session, signal?: AbortSignal) {
  const response = await fetch('/api/game', {method:'POST',headers:{'Content-Type':'application/json',...(session ? {Authorization:`Bearer ${session.token}`}:{})},body:JSON.stringify({...body,...(session ? {code:session.code}:{})}),signal});
  const data: any = await response.json();
  if (!response.ok) { const error: any = new Error(data.error || 'Request failed. Please try again.'); error.status=response.status; throw error; }
  return data;
}
export default function GameClient() {
  const [mode,setMode]=useState('create'),[name,setName]=useState(''),[code,setCode]=useState(''),[pack,setPack]=useState('everyday');
  const [session,setSession]=useState<Session|null>(null),[room,setRoom]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[offline,setOffline]=useState(false);
  const [setupOpen,setSetupOpen]=useState(false);
  const [character,setCharacter]=useState('amber'),[characterOpen,setCharacterOpen]=useState(false);
  useEffect(()=>{try{const saved=localStorage.getItem('odd-character');if(isCharacter(saved))setCharacter(saved!);}catch{}},[]);
  const [rules,setRules]=useState(false),[showWord,setShowWord]=useState(false),[clue,setClue]=useState(''),[selected,setSelected]=useState(''),[copied,setCopied]=useState(false);
  const [custom,setCustom]=useState(false),[customA,setCustomA]=useState(''),[customB,setCustomB]=useState('');
  const [discussionMessage,setDiscussionMessage]=useState('');
  const [discussionSeconds,setDiscussionSeconds]=useState(0),[clockNow,setClockNow]=useState(0);
  const mutation=useRef(0), inFlight=useRef(false);
  const root=useRef<HTMLDivElement>(null);
  const [Motion,setMotion]=useState<typeof GameMotion | null>(null);
  useEffect(()=>{
    let mounted=true;
    // GSAP starts its ticker on import. Load it after hydration, outside Worker SSR.
    import('./game-motion').then(module=>{if(mounted)setMotion(()=>module.GameMotion);}).catch(()=>{});
    return()=>{mounted=false;};
  },[]);
  useEffect(()=>{
    if(!rules&&!setupOpen&&!characterOpen)return;
    const previous=document.activeElement as HTMLElement | null;
    const dialog=root.current?.querySelector<HTMLElement>(characterOpen?'.character-picker':rules?'.rules-modal':'.entry-panel');
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){if(characterOpen){if(!busy)setCharacterOpen(false);}else if(rules)setRules(false);else setSetupOpen(false);return;}
      if(event.key!=='Tab'||!dialog)return;
      const buttons=Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]'));
      const first=buttons[0],last=buttons[buttons.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    };
    dialog?.querySelector<HTMLElement>('input,button')?.focus();
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('keydown',onKey);previous?.focus();};
  },[rules,setupOpen,characterOpen,busy]);
  useEffect(()=>{
    const invite=new URLSearchParams(location.search).get('room');
    if (invite) {setCode(invite.toUpperCase());setMode('join');setSetupOpen(true);}
    try {const saved=JSON.parse(sessionStorage.getItem('odd-session') || 'null');if(saved?.code&&saved?.token&&(!invite||invite===saved.code))setSession(saved);}catch{}
  },[]);
  useEffect(()=>{
    if(!session)return;
    const controller=new AbortController(); let stopped=false;
    async function sync(){
      if(inFlight.current)return;
      const version=mutation.current;
      try {
        const data=await request({type:'state'},session!,controller.signal);
        if(!stopped&&version===mutation.current&&!inFlight.current){setRoom({...data.room,receivedAt:Date.now()});setOffline(false);}
      } catch(e:any) {
        if(stopped || e.name==='AbortError')return;
        if(e.status===401||e.status===404){setError(e.message);sessionStorage.removeItem('odd-session');setSession(null);setRoom(null);}else setOffline(true);
      }
    }
    sync(); const timer=setInterval(sync,1500);
    return()=>{stopped=true;controller.abort();clearInterval(timer);};
  },[session]);
  useEffect(()=>{setShowWord(false);setClue('');setSelected('');setDiscussionMessage('');},[room?.round,room?.phase,room?.ballot]);
  async function enter(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');
    try {
      const data=await request({type:mode,name,code:code.toUpperCase().trim(),pack,discussionSeconds,character});
      const next={code:data.room.code,token:data.token};
      setSetupOpen(false);sessionStorage.setItem('odd-session',JSON.stringify(next));setRoom({...data.room,receivedAt:Date.now()});setSession(next);
    }catch(e:any){setError(e.message);}finally{setBusy(false);}
  }
  async function action(type:string, fields:any={}){
    if(!session||inFlight.current)return;
    inFlight.current=true;mutation.current++;setBusy(true);setError('');
    try {
      const turn=type==='clue'?{expectedRound:room.round,expectedTurn:room.clues.length}:{};
      const data=await request({type,...fields,...turn},session);
      if(data.left){sessionStorage.removeItem('odd-session');setSession(null);setRoom(null);history.replaceState(null,'',location.pathname);}
      else setRoom({...data.room,receivedAt:Date.now()});
      setOffline(false);return true;
    }catch(e:any){setError(e.message);return false;}finally{inFlight.current=false;setBusy(false);}
  }
  const currentCharacter=room?.players.find((p:any)=>p.id===room.me)?.character||character;
  function openCharacters(){setError('');setCharacterOpen(true);}
  async function saveCharacter(id:string){
    if(room&&!await action('character',{character:id}))return;
    setCharacter(id);try{localStorage.setItem('odd-character',id);}catch{}
    setCharacterOpen(false);
  }
  async function copyRoomCode(){
    try {await navigator.clipboard.writeText(room.code);setCopied(true);setTimeout(()=>setCopied(false),2200);}catch{setError(`Copy this room code: ${room.code}`);}
  }
  useEffect(()=>{
    if(!['discussion','clue'].includes(room?.phase))return;
    setClockNow(Date.now());
    const timer=setInterval(()=>setClockNow(Date.now()),250);
    return()=>clearInterval(timer);
  },[room?.phase,room?.discussionDeadline,room?.clueDeadline]);
  const serverClock=room ? room.serverNow+Math.max(0,clockNow-room.receivedAt) : 0;
  const remaining=room?.discussionDeadline ? Math.max(0,Math.ceil((room.discussionDeadline-serverClock)/1000)) : null;
  const turnRemaining=room?.clueDeadline ? Math.max(0,Math.ceil((room.clueDeadline-serverClock)/1000)) : null;
  const turnExpired=room?.phase==='clue'&&turnRemaining===0;
  useEffect(()=>{setClue('');},[room?.round,room?.clues?.length]);
  const discussionExpired=room?.phase==='discussion'&&remaining===0;
  const host=room?.host===room?.me;
  const current=room?.players[room?.clues?.length];
  const myTurn=room?.phase==='clue'&&current?.id===room?.me;
  return <div className={'site-shell '+(room?'in-game':'at-menu')} ref={root}>
    {Motion&&<Motion root={root} state={{code:room?.code,phase:room?.phase,round:room?.round,ballot:room?.ballot,clues:room?.clues?.length||0,selected,voted:room?.myVote,rules,setupOpen,players:room?.players.length||0,revealed:showWord}}/>}
    <header className="site-header"><a className="brand" href="/" onClick={e=>{if(session){e.preventDefault();setRules(true);}}}><Mark/><span>Odd One Out<span className="brand-caption">The midnight word club</span></span></a><button className="text-button" onClick={()=>setRules(true)}><HelpCircle size={17}/>How to play</button></header>
    {!room ? <PaintedLobby onCreate={()=>{setMode('create');setSetupOpen(true);}} onJoin={()=>{setMode('join');setSetupOpen(true);}} onRules={()=>setRules(true)} paused={setupOpen||rules||characterOpen} error={error}/> : <main className="room-main">
      <div className="room-top"><div><span className="intro-pill"><span className={'status-dot '+(offline?'offline':'')}/>{offline?'Reconnecting':'Room connected'}</span><h1>{phaseNames[room.phase]}<span>Round {room.round||1}</span></h1></div><div className="invite"><small>Invite friends with this code</small><button onClick={copyRoomCode} title="Copy room code">{room.code}{copied?<Check size={20}/>:<Copy size={20}/>}</button><span aria-live="polite">{copied?'Room code copied':'Room expires 24 hours after creation'}</span></div></div>
      <ol className="progress" aria-label="Round progress">{['lobby','reveal','clue','discussion','vote','result'].map((phase,index)=><li className={phase===room.phase?'current':''} key={phase} aria-current={phase===room.phase?'step':undefined}><span>{index+1}</span>{phaseNames[phase]}</li>)}</ol>
      {error&&<p className="error" role="alert">{error}</p>}{offline&&<p className="error" role="status">Connection lost. Check your network; the game will reconnect automatically.</p>}
      <div className="game-grid"><div className="playfield"><ClubScene room={room} remaining={room.phase==='clue'?turnRemaining:remaining} selected={selected} onSelect={setSelected} busy={busy}/></div><section className="table-panel"><details className="roster-details"><summary><span><Users size={18}/>Players & scores</span><span>{room.players.length} / 8</span></summary><div className="players">{room.players.map((p:any,index:number)=><div className={'player-row '+(current?.id===p.id&&room.phase==='clue'?'speaking':'')} key={p.id}><div className={'avatar '+colors[index]}><ClubMember index={index} character={p.character} small/></div><div className="player-name"><strong>{p.name} {p.id===room.me&&<small>You</small>}</strong><span>{p.id===room.host?'Host':`Player ${index+1}`}{room.phase==='reveal'?(room.ready.includes(p.id)?' · Ready':' · Reading their word'):''}{room.phase==='clue'&&p.id===current?.id?' · Giving a clue':''}</span></div><span className="score"><Trophy size={14}/>{p.score}</span>{host&&room.phase==='lobby'&&p.id!==room.me&&<button className="icon-button" title={`Remove ${p.name}`} aria-label={`Remove ${p.name}`} onClick={()=>{if(confirm(`Remove ${p.name} from this room?`))action('remove',{target:p.id});}} disabled={busy}><X size={15}/></button>}</div>)}</div></details>
      {room.phase==='lobby'&&<div className="waiting-note"><Sparkles size={23}/><p><strong>{room.players.length<3?`Invite ${3-room.players.length} more to get started.`:'The table is ready. Let the guessing begin.'}</strong><span>Share the room code above. Friends can enter it under Join a room.</span></p></div>}
      {['clue','discussion','vote'].includes(room.phase)&&<section className="clue-board"><h3><MessageCircle size={18}/>Clues on the table</h3>{room.clues.length===0?<p className="muted">The first player is thinking of a clue.</p>:room.clues.map((c:any)=><div className="clue-item" key={c.playerId}><strong>{room.players.find((p:any)=>p.id===c.playerId)?.name}</strong><p>{c.text}</p></div>)}</section>}
      {room.phase==='discussion'&&<section className="discussion-board"><h3><MessageCircle size={18}/>Open discussion</h3><p className="muted">Compare clues and send a message below.</p><div className="discussion-feed" role="log" aria-label="Discussion messages" aria-live="polite">{room.messages.length===0?<p className="muted">Who sounds different? Start the conversation.</p>:room.messages.map((m:any)=><div className="discussion-message" key={m.id}><strong>{room.players.find((p:any)=>p.id===m.playerId)?.name}</strong><p>{m.text}</p></div>)}</div><form onSubmit={async e=>{e.preventDefault();if(await action('discuss',{text:discussionMessage}))setDiscussionMessage('');}}><label htmlFor="discussion-message">Your message</label><textarea id="discussion-message" disabled={discussionExpired} value={discussionMessage} maxLength={200} required onChange={e=>setDiscussionMessage(e.target.value)} placeholder="I think it might be…"/><div className="discussion-send"><small>{discussionMessage.length} / 200</small><button className="primary" disabled={busy||discussionExpired||!discussionMessage.trim()}>Send message</button></div></form></section>}
      {room.phase==='result'&&<section className="result-panel"><div className="result-symbol"><Fingerprint size={40}/></div><h2>{room.result.draw?'A mystery, still unsolved.':room.result.majorityWon?'The odd one is found!':'Hidden in plain sight!'}</h2><p><strong>{room.players.find((p:any)=>p.id===room.result.odd)?.name}</strong> had the different word.</p><div className="word-pair"><div><small>The shared word</small><strong>{room.result.words[0]}</strong></div><div><small>The different word</small><strong>{room.result.words[1]}</strong></div></div><p>{room.result.draw?'Three tied ballots. This round is a draw; no points awarded.':room.result.winners.includes(room.me)?'You won this round. +1 point!':'Not your round. There is always the next one.'}</p><details><summary>See the votes</summary>{Object.entries(room.result.votes).map(([id,target])=><p className="vote-receipt" key={id}>{room.players.find((p:any)=>p.id===id)?.name}<ChevronRight size={14}/>{room.players.find((p:any)=>p.id===target)?.name}</p>)}</details></section>}
      </section><aside className="action-panel">
      {room.phase==='lobby'?<><span className="tiny-icon"><Layers3 size={24}/></span><h2>Room settings</h2><button className="secondary wide character-room-entry" onClick={openCharacters} disabled={busy}><CharacterSprite character={currentCharacter}/><span>{characterFor(currentCharacter).name}<small>Change character</small></span></button><label htmlFor="room-pack">Word pack</label><select id="room-pack" value={room.pack} disabled={!host||busy} onChange={e=>action('settings',{pack:e.target.value})}>{Object.entries(packNames).map(([id,title])=><option value={id} key={id}>{title} · 10 pairs</option>)}</select><label htmlFor="room-discussion-time">Discussion time</label><select id="room-discussion-time" value={room.discussionSeconds} disabled={!host||busy} onChange={e=>action('settings',{discussionSeconds:Number(e.target.value)})}>{discussionOptions.map(([seconds,label])=><option key={seconds} value={seconds}>{label}</option>)}</select><p className="field-note">Timed discussions automatically move to voting.</p>{host&&<><label className="checkbox"><input type="checkbox" checked={custom} onChange={e=>setCustom(e.target.checked)}/>Use a custom word pair</label>{custom&&<div className="custom-words"><input aria-label="The shared word" placeholder="The shared word" maxLength={20} value={customA} onChange={e=>setCustomA(e.target.value)}/><input aria-label="The different word" placeholder="The different word" maxLength={20} value={customB} onChange={e=>setCustomB(e.target.value)}/><small>As the author, you will know both possible words.</small></div>}</>}<div className="side-note"><ShieldCheck size={18}/><p>Only your own word is visible. Listen closely before making your guess.</p></div>{host?<button className="primary wide" disabled={busy||room.players.length<3||(custom&&(!customA.trim()||!customB.trim()))} onClick={()=>action('start',custom?{customA,customB}:{})}>Start the game<ArrowRight size={18}/></button>:<p className="waiting-label">Waiting for the host to start…</p>}</>:room.phase==='result'?<><Trophy className="big-icon" size={38}/><h2>That was a good round.</h2><p className="muted">Scores are updated. Try a new pair and see who blends in next.</p>{host?<><button className="primary wide" disabled={busy} onClick={()=>action('start')}><RotateCcw size={18}/>Play again</button><button className="secondary wide" disabled={busy} onClick={()=>action('reset')}>Back to lobby</button></>:<p className="waiting-label">Waiting for the next round…</p>}</>:<><WordCard key={room.round} word={room.word} revealed={showWord} onToggle={()=>setShowWord(!showWord)}/>
      {room.phase==='reveal'?<><h2>Got your word?</h2><p className="muted">Keep your screen private. Clues begin once everyone is ready.</p><button className="primary wide" disabled={busy||room.ready.includes(room.me)} onClick={()=>action('ready')}><CheckCheck size={19}/>{room.ready.includes(room.me)?'Ready. Waiting for friends':'Got it. I am ready'}</button><p className="center-note">{room.ready.length} / {room.players.length} ready</p></>:room.phase==='clue'?<TextCluePanel mine={myTurn} current={current?.name||'Player'} next={room.players[room.clues.length+1]?.name} remaining={turnRemaining} expired={turnExpired} busy={busy} clue={clue} setClue={setClue} submit={()=>{void action('clue',{text:clue});}}/>:room.phase==='discussion'?<><h2>Talk it through.</h2><p className="field-note">{remaining===null?'No time limit. Start voting when everyone is ready.':discussionExpired?'Time is up. Opening voting…':'Watch the table timer. Voting starts automatically.'}</p><p className="muted">Everyone has submitted a clue. Use the message box to discuss.</p>{host?<button className="primary wide" disabled={busy||discussionExpired} onClick={()=>action('start-vote')}><Vote size={18}/>Start voting</button>:<p className="waiting-label">{remaining===null?'The host will start voting when discussion is finished.':'You will move to voting when the timer ends. The host can also start it early.'}</p>}</>:<><h2>{room.ballot>1?'A tie. Take another look.':'Who has the different word?'}</h2><p className="muted">{room.ballot>1?`Ballot ${room.ballot}: choose a tied candidate. Three tied ballots end in a draw.`:'Choose the player you suspect. Votes stay private until everyone has voted.'}</p><div className="vote-options">{room.players.filter((p:any)=>p.id!==room.me&&(!room.candidates.length||room.candidates.includes(p.id))).map((p:any)=><button className={selected===p.id?'selected':''} key={p.id} disabled={busy||!!room.myVote} onClick={()=>setSelected(p.id)}><ClubMember index={room.players.findIndex((member:any)=>member.id===p.id)} character={p.character} small/><span>{p.name}</span>{selected===p.id&&<Check size={16}/>}</button>)}</div><button className="primary wide vote-submit" disabled={busy||!!room.myVote||!selected} onClick={()=>action('vote',{target:selected})}><>{room.myVote?<CheckCheck size={18}/>:<Vote size={18}/>}</>{room.myVote?'Vote locked. Waiting…':'Lock in my vote'}</button><p className="center-note">{room.voteCount} / {room.players.length} voted</p></>}
      </>}
      {host&&!['lobby','result'].includes(room.phase)&&<button className="text-button reset-button" disabled={busy} onClick={()=>{if(confirm('End this round and return to the lobby? No points will be awarded.'))action('reset');}}>End this round</button>}
      {['lobby','result'].includes(room.phase)&&<button className="text-button leave-button" disabled={busy} onClick={()=>action('leave')}><DoorOpen size={16}/>Leave room</button>}
      </aside></div>
      {room.history.length>0&&<section className="history"><h2>Stories from this table</h2><div>{room.history.map((h:any)=><p key={h.round}><span>Round {h.round}</span><strong>{h.words.join(' / ')}</strong><span>{h.oddName} was the odd one</span><b>{h.draw?'Draw':h.majorityWon?'Majority wins':'Odd one wins'}</b></p>)}</div></section>}
    </main>}
    <footer className="site-footer"><span><span className="status-dot"/>Odd One Out</span><span>{room?'Room expires 24 hours after creation':'Private words. Public suspicions.'}</span></footer>
    {setupOpen&&!room&&<div className="modal-backdrop setup-backdrop" onClick={()=>setSetupOpen(false)}><div className="setup-container" onClick={e=>e.stopPropagation()}><section className="entry-panel painted-dialog" role="dialog" aria-modal="true" aria-labelledby="setup-title"><button type="button" className="icon-button close" aria-label="Close room setup" onClick={()=>setSetupOpen(false)}><X size={20}/></button><div className="dialog-emblem"><Users size={30}/></div><div className="panel-heading"><h2 id="setup-title">{mode==='create'?'Create your room':'Join your friends'}</h2><p>{mode==='create'?'Your table. Your rules.':'There is a seat with your name on it.'}</p></div>
      <form onSubmit={enter}><button type="button" className="character-setup-entry" onClick={openCharacters}><CharacterSprite character={character}/><span>Your character<strong>{characterFor(character).name}</strong></span><span>Change</span></button><label htmlFor="nickname">Your nickname</label><input id="nickname" maxLength={20} placeholder="What should we call you?" value={name} onChange={e=>setName(e.target.value)} required autoComplete="nickname"/>
      {mode==='join'?<><label htmlFor="room-code">Room code</label><input id="room-code" className="code-input" minLength={6} maxLength={6} placeholder="e.g. ABC234" value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,''))} required autoComplete="off"/></>:<><label htmlFor="word-pack">Choose a word pack</label><select id="word-pack" value={pack} onChange={e=>setPack(e.target.value)}>{Object.entries(packNames).map(([id,title])=><option key={id} value={id}>{title} · 10 pairs</option>)}</select><label htmlFor="discussion-time">Discussion time</label><select id="discussion-time" value={discussionSeconds} onChange={e=>setDiscussionSeconds(Number(e.target.value))}>{discussionOptions.map(([seconds,label])=><option key={seconds} value={seconds}>{label}</option>)}</select><p className="field-note">The timer starts after all clues. Voting begins when time runs out.</p></>}
      {error&&<p className="error" role="alert">{error}</p>}<button className="primary wide" disabled={busy}>{busy?<LoaderCircle className="spin" size={19}/>:mode==='create'?<Plus size={19}/>:<DoorOpen size={19}/>} {mode==='create'?'Create my room':'Join the game'}<ArrowRight className="end-icon" size={19}/></button></form><p className="setup-note"><ShieldCheck size={14}/>No account needed. Your word stays private.</p></section></div></div>}
    {characterOpen&&<CharacterPicker character={currentCharacter} onClose={()=>setCharacterOpen(false)} onSave={saveCharacter} busy={busy} error={error}/>}
    {rules&&<div className="modal-backdrop" onClick={()=>setRules(false)}><section className="rules-modal painted-dialog" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={e=>e.stopPropagation()}><button className="icon-button close" aria-label="Close rules" onClick={()=>setRules(false)} autoFocus><X/></button><Mark/><h2 id="rules-title">A little clue gives a lot away.</h2><ol><li>Create a room and invite 3–8 players. Everyone uses their own device.</li><li>Everyone gets a word. One player gets a different word, but no one knows their role.</li><li>Read your word and get ready. Each player has 60 seconds to submit a text clue. When time runs out, the next turn begins automatically. Do not name your word.</li><li>After everyone has submitted a clue, discuss using text messages. Choose 15 seconds, 30 seconds, 1 minute or no time limit when creating a room. Timed discussions move to voting automatically; the host can also start voting early.</li><li>Read the clues and vote for another player. Find the odd one and the majority wins. Guess wrong and the odd one wins.</li><li>If votes are tied, vote again among the tied players. Three ties make a draw. Each winner earns one point.</li></ol><p>Disconnected? Refresh the same browser tab to rejoin. If a player leaves mid-round, the host can end the round and remove them in the lobby. Rooms expire after 24 hours.</p><button className="primary wide" onClick={()=>setRules(false)}>Got it</button></section></div>}
  </div>;
}
