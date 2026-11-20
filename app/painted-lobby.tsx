'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, DoorOpen, Fingerprint, HelpCircle, Layers3, MessageCircle, Plus, Users } from 'lucide-react';

import {characterFor} from '../lib/characters.mjs';

const members = [
  { name:'Sage', x:49, foot:49.4, size:16.4, col:0, row:0, hello:'Hey!' },
  { name:'Amber', x:60.5, foot:47.2, size:16.4, col:50, row:0, hello:'Hello!' },
  { name:'Mint', x:73, foot:49.4, size:16.4, col:100, row:0, hello:'Hi there!' },
  { name:'Blue', x:43.7, foot:79.6, size:20.5, col:0, row:100, hello:'Your move!' },
  { name:'Violet', x:61.2, foot:82, size:21.8, col:50, row:100, hello:'Who, me?' },
  { name:'Coral', x:78.4, foot:80.2, size:20.4, col:100, row:100, hello:'Welcome!' },
  { name:'Pearl', x:37.3, foot:59.6, size:18, col:0, row:0, hello:'Hi there!' },
  { name:'Rust', x:84.6, foot:60, size:18, col:0, row:0, hello:'Let’s play!' },
].map(member=>({...member,...characterFor(member.name.toLowerCase())}));

type Props = { onCreate:()=>void; onJoin:()=>void; onRules:()=>void; paused:boolean; error:string };

export default function PaintedLobby({onCreate,onJoin,onRules,paused,error}:Props) {
  const [hidden,setHidden]=useState(false);
  const [greeting,setGreeting]=useState<{index:number;revision:number}|null>(null);
  const [announcement,setAnnouncement]=useState('');
  const timeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const revision=useRef(0);
  useEffect(()=>{
    const sync=()=>setHidden(document.hidden);
    sync();document.addEventListener('visibilitychange',sync);
    return()=>{document.removeEventListener('visibilitychange',sync);if(timeout.current)clearTimeout(timeout.current);};
  },[]);
  function greet(index:number) {
    if(timeout.current)clearTimeout(timeout.current);
    setGreeting({index,revision:++revision.current});
    setAnnouncement(`${members[index].name} says ${members[index].hello}`);
    timeout.current=setTimeout(()=>setGreeting(null),1500);
  }
  const speakingMember=greeting&&greeting.index>=3?members[greeting.index]:null;
  return <main className={'painted-lobby'+(paused||hidden?' is-paused':'')}>
    <div className="environment" aria-hidden="true">
      <img src="/lobby-art/club-room-depth.png" alt="" fetchPriority="high"/>
      <div className="lamp-light"/>
      <div className="motes">{Array.from({length:9},(_,i)=><span key={i} className="mote" style={{'--x':`${52+(i*19%40)}%`,'--y':`${19+(i*7%28)}%`,'--duration':`${7+i%4}s`,'--delay':`${-i*1.3}s`} as CSSProperties}/>)}</div>
    </div>
    <header className="header">
      <a className="brand" href="/" aria-label="Odd One Out home"><span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span><span>Odd One Out</span></a>
      <button className="help-button" onClick={onRules} aria-label="How to play"><HelpCircle className="icon"/>How to play</button>
    </header>
    <section className="menu" aria-label="Game menu">
      <p className="eyebrow"><span/>The midnight word club</p>
      <h1>Odd One Out<span className="question">?</span></h1>
      <p className="tagline">One of you is a little different.</p>
      <nav className="actions" aria-label="Room options">
        <button className="wood-button gold" onClick={onCreate}><Plus className="icon"/><span>Create a room</span><ArrowRight className="icon arrow"/></button>
        <button className="wood-button teal" onClick={onJoin}><DoorOpen className="icon"/><span>Join a room</span></button>
      </nav>
      <div className="menu-facts"><span><Users className="icon"/>3–8 players</span><i/><span><MessageCircle className="icon"/>Text chat</span></div>
      {error&&<p className="menu-error" role="alert">{error}</p>}
    </section>
    <section className="characters" aria-label="Meet the eight club members">
      {members.map((member,index)=><button key={member.name} className={'member'+(index>2?' front':'')+(greeting?.index===index?' is-greeting':'')}
        style={{'--x':`${member.x}%`,'--foot':`${member.foot}%`,'--size':`${member.size}%`,'--col':`${member.col}%`,'--row':`${member.row}%`,'--delay':`${[-.3,-1.4,-2.7,-.9,-2,-3.2,-1.8,-2.4][index]}s`,'--turn':`${-index*3}s`} as CSSProperties}
        aria-label={`Greet ${member.name}`} onClick={()=>greet(index)}>
        <span className="ground-shadow"/>
        <span className="sway" key={greeting?.index===index?greeting.revision:'idle'}><span className="sprite-art" style={{backgroundImage:`url("${member.image}")`,backgroundSize:member.grid,top:`${[0,0,0,1.6,1.8,1.8,2.3,4.1][index]}%`,bottom:`${-[0,0,0,1.6,1.8,1.8,2.3,4.1][index]}%`}}/></span>
        <span className="member-label">{member.name}</span>
      </button>)}
    </section>
    <div className="lobby-table" aria-hidden="true"><img src="/lobby-art/club-table-depth.png" alt=""/></div>
    <div className="table-copy"><Fingerprint className="fingerprint"/><h2>Trust your instincts.</h2><p>One word. One odd one.</p></div>
    <div className="greeting-layer" aria-hidden="true">{speakingMember&&<div key={greeting!.revision} className="greeting-anchor" data-character={speakingMember.id} style={{'--x':`${speakingMember.x}%`,'--foot':`${speakingMember.foot}%`,'--size':`${speakingMember.size}%`} as CSSProperties}><span className="greeting">{speakingMember.hello}</span></div>}</div>
    <footer className="footer"><span><Layers3 className="icon"/>Get a shared word.</span><i/><span><MessageCircle className="icon"/>Talk your way out.</span><i/><span><Users className="icon"/>Find the odd one.</span></footer>
    <div className="sr-only" role="status">{announcement}</div>
  </main>;
}
