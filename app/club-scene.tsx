'use client';
import { Check, Crown, Fingerprint, MessageCircle, Trophy, Vote } from 'lucide-react';
import type { CSSProperties } from 'react';
import {CharacterSprite} from './character-picker';
import RoomScene from './room-scene';

const coats=['#e7b85d','#6abbb0','#d9907d','#a797c6','#7ba8d1','#b0bd74','#d77e9e','#b79068'];
const seats=[[50,15],[76,25],[87,51],[76,74],[50,80],[24,74],[13,51],[24,25]];
const seatLayouts:Record<number,number[]>={1:[0],2:[0,4],3:[0,3,6],4:[0,2,4,6],5:[0,2,3,5,6],6:[0,1,3,4,5,7],7:[0,1,2,3,4,5,6],8:[0,1,2,3,4,5,6,7]};

/** Original illustrated club members, drawn as vectors so they stay crisp on phones. */
export function ClubMember({index=0,small=false,character}:{index?:number;small?:boolean;character?:string}) {
  if(character)return <CharacterSprite character={character} index={index} className={'club-member'+(small?' member-small':'')}/>;
  return <svg className={'club-member'+(small?' member-small':'')} viewBox="0 0 130 150" fill="none" aria-hidden="true">
    <ellipse cx="65" cy="137" rx="43" ry="9" fill="#081723" opacity=".45"/>
    <g className="member-body">
    <path d="M39 118L34 137Q42 144 55 136L62 120M75 120L78 137Q94 144 99 134L92 117" fill="#233340" stroke="#102433" strokeWidth="5" strokeLinejoin="round"/>
    <path d="M37 77Q19 87 21 108Q25 118 35 110L43 95M93 78Q110 84 111 104Q108 118 98 109L89 95" fill={coats[index%8]} stroke="#102433" strokeWidth="5"/>
    <path d="M30 65Q25 26 62 23Q104 23 103 65L99 111Q68 135 31 111Z" fill={coats[index%8]} stroke="#102433" strokeWidth="5"/>
    <path d="M34 87Q66 103 99 86L97 112Q63 130 33 111Z" fill="#102433" opacity=".13"/>
    <rect x="39" y="47" width="53" height="36" rx="17" fill="#182c38" stroke="#102433" strokeWidth="3"/>
    <g className="member-eyes"><ellipse cx="55" cy="64" rx="5" ry="8" fill="#fff5da"/><ellipse cx="77" cy="64" rx="5" ry="8" fill="#fff5da"/></g>
    {index%3===0?<><path d="M33 40L42 17Q55 8 65 21Q80 7 91 20L99 40" fill="#c89448" stroke="#102433" strokeWidth="5" strokeLinejoin="round"/><path d="M26 43Q65 31 106 43" stroke="#102433" strokeWidth="7" strokeLinecap="round"/></>:index%3===1?<><path d="M37 36Q40 10 65 10Q91 10 94 36Z" fill="#395c68" stroke="#102433" strokeWidth="5"/><path d="M38 34H91" stroke="#8cbdb2" strokeWidth="9" strokeLinecap="round"/><circle cx="65" cy="10" r="8" fill="#8cbdb2" stroke="#102433" strokeWidth="4"/></>:<><path d="M32 37Q44 18 64 18Q87 16 98 37L111 40Q106 50 83 44L34 43Z" fill="#6e5869" stroke="#102433" strokeWidth="5"/><path d="M49 24L81 24" stroke="#aa8b9c" strokeWidth="4" strokeLinecap="round"/></>}
    <path d="M53 95L65 104L77 95" stroke="#102433" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="65" cy="112" r="3" fill="#102433"/>
    </g>
  </svg>;
}

export default function ClubScene({room,remaining=null,selected='',onSelect,busy=false,preview=false}:{room?:any;remaining?:number|null;selected?:string;onSelect?:(id:string)=>void;busy?:boolean;preview?:boolean}) {
  if(!preview)return <RoomScene room={room} remaining={remaining} selected={selected} onSelect={onSelect} busy={busy}/>;
  const players=preview?Array.from({length:6},(_,i)=>({id:String(i),name:'Club member'})):room.players;
  const current=room?.players[room?.clues?.length];
  const seating=seatLayouts[players.length]||seatLayouts[8];
  const phase=preview?'preview':room.phase;
  const title=phase==='lobby'?(players.length<3?'Gather your friends':'The table is ready'):phase==='reveal'?'Keep it secret':phase==='clue'?`${current?.name || 'Player'}’s turn`:phase==='discussion'?'Open discussion':phase==='vote'?'Who is the odd one?':phase==='result'?'Case closed':'Trust your instincts.';
  return <section className={'club-scene '+(preview?'scene-preview':'scene-'+phase)} aria-label={preview?'Illustrated detective clubhouse':'Player table'}>
    <svg className="room-scenery" viewBox="0 0 900 650" fill="none" aria-hidden="true">
      <defs><radialGradient id={preview?'lamp-menu':'lamp-room'}><stop stopColor="#edcb7a" stopOpacity=".17"/><stop offset="1" stopColor="#edcb7a" stopOpacity="0"/></radialGradient><pattern id={preview?'floor-menu':'floor-room'} width="90" height="65" patternUnits="userSpaceOnUse"><path d="M0 64H90M45 0V64" stroke="#5d7f8c" strokeOpacity=".12" strokeWidth="2"/></pattern></defs>
      <path d="M22 166Q22 143 45 143H854Q880 143 880 168V588Q880 611 853 611H48Q22 611 22 587Z" fill="#1c3b49" stroke="#102735" strokeWidth="6"/>
      <path d="M25 244H876V587Q876 607 851 607H49Q26 607 26 586Z" fill={`url(#${preview?'floor-menu':'floor-room'})`}/>
      <path d="M24 238H877" stroke="#102735" strokeWidth="9"/>
      <rect x="64" y="84" width="141" height="137" rx="61" fill="#12293d" stroke="#0e2330" strokeWidth="10"/>
      <path d="M135 86V218M68 156H201" stroke="#355867" strokeWidth="7"/><path d="M163 111Q141 116 150 137Q125 131 138 109Q152 101 163 111" fill="#e7d8a7"/><circle className="window-star" cx="107" cy="117" r="2" fill="#a1bdc5"/><circle className="window-star" cx="178" cy="176" r="2" fill="#a1bdc5"/>
      <rect x="712" y="103" width="116" height="102" rx="9" fill="#122a37" stroke="#102330" strokeWidth="7"/>
      <path d="M715 147H826M727 148V111M743 148V120M761 148V111M779 148V122M798 148V113M737 191V156M756 191V164M780 191V156M802 191V162" stroke="#8c9c8d" strokeWidth="10"/>
      <g transform="translate(120 0)"><g className="pendant-lamp"><path d="M450 0V36" stroke="#0a1b27" strokeWidth="7"/><path d="M418 38Q450 22 482 38L500 66H400Z" fill="#d6a559" stroke="#102735" strokeWidth="5"/><ellipse cx="450" cy="67" rx="39" ry="7" fill="#ffe3a0"/></g></g>
      <ellipse className="lamp-glow" cx="450" cy="326" rx="350" ry="275" fill={`url(#${preview?'lamp-menu':'lamp-room'})`}/>
      <ellipse cx="450" cy="390" rx="245" ry="133" fill="#0a1c26" opacity=".5"/>
      <ellipse cx="450" cy="356" rx="224" ry="123" fill="#553c30" stroke="#102735" strokeWidth="8"/>
      <path d="M227 332V359Q254 476 450 478Q646 476 673 359V332" fill="#735039" stroke="#102735" strokeWidth="7"/>
      <ellipse cx="450" cy="329" rx="224" ry="122" fill="#ad8050" stroke="#102735" strokeWidth="7"/>
      <ellipse cx="450" cy="329" rx="207" ry="107" fill="#34594f" stroke="#cfab70" strokeWidth="3"/>
      <ellipse cx="450" cy="329" rx="190" ry="92" stroke="#729381" strokeWidth="2" strokeDasharray="4 7" opacity=".4"/>
      <path d="M296 294L320 275L345 288L322 309Z" fill="#f1dfb9" stroke="#1c3440" strokeWidth="3"/><path d="M305 295L326 280" stroke="#bb8b51" strokeWidth="3"/>
      <path d="M566 360L591 343L613 356L587 374Z" fill="#f1dfb9" stroke="#1c3440" strokeWidth="3"/><path d="M580 355L594 360" stroke="#bb8b51" strokeWidth="3"/>
      <ellipse cx="586" cy="280" rx="14" ry="7" fill="#243f3c"/><path d="M573 271Q585 280 599 271V286Q585 296 573 286Z" fill="#ccad77" stroke="#1c3440" strokeWidth="3"/>
      <path d="M101 548V494M84 517Q53 495 80 474Q101 479 101 509M103 501Q117 466 141 479Q143 507 103 517" stroke="#172d36" strokeWidth="7" fill="#548479"/><path d="M78 534H126L119 573H85Z" fill="#b18560" stroke="#102735" strokeWidth="5"/>
    </svg>
    <div className="table-focus"><span className="table-symbol">{phase==='vote'?<Vote/>:phase==='result'?<Trophy/>:phase==='discussion'?<MessageCircle/>:<Fingerprint/>}</span><h2>{title}</h2>{phase==='discussion'?<div className={'table-countdown '+(remaining!==null&&remaining<=10?'running-out':'')} role="timer" aria-label="Discussion time remaining">{remaining===null?'∞':remaining===0?'0:00':`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`}</div>:<strong>{phase==='lobby'?`${players.length} / 8`:phase==='reveal'?`${room.ready.length} / ${players.length}`:phase==='vote'?`${room.voteCount} / ${players.length}`:phase==='preview'?'One word. One odd one.':phase==='clue'?`${room.clues.length+1} / ${players.length}`:room.result?.draw?'A draw!':room.result?.winners.includes(room.me)?'You win!':'Mystery solved'}</strong>}<small>{phase==='lobby'?(players.length<3?`${3-players.length} more to start`:'Waiting for the host'):phase==='discussion'?(remaining===null?'No time limit':'Until the vote begins'):phase==='reveal'?'players ready':phase==='vote'?'votes locked':phase==='clue'?'Listen closely.':phase==='preview'?'A social deduction party game':'Ready for another round?'}</small></div>
    <div className="table-seats">{seats.map(([x,y],index)=>{
      const playerIndex=seating.indexOf(index);
      const p=players[playerIndex];
      const speaking=phase==='clue'&&p?.id===current?.id;
      const ready=phase==='reveal'&&room.ready.includes(p?.id);
      const canSelect=phase==='vote'&&p&&p.id!==room.me&&!room.myVote&&(!room.candidates.length||room.candidates.includes(p.id));
      return <div key={p?.id||`empty-${index}`} data-player-index={p?playerIndex:undefined} className={'table-seat '+(!p?'empty-seat':'occupied-seat')+(speaking?' taking-turn':'')+(selected===p?.id?' seat-selected':'')} style={{'--seat-x':`${x}%`,'--seat-y':`${y}%`} as CSSProperties}>
        {p?<><button className="seat-character" disabled={!canSelect||busy} onClick={()=>onSelect?.(p.id)} aria-label={canSelect?`Select ${p.name}`:`${preview?'Club member':p.name}${ready?', ready':''}${speaking?', giving a clue':''}`} aria-pressed={canSelect?selected===p.id:undefined}><ClubMember index={playerIndex} character={p.character}/>{!preview&&p.id===room.host&&<Crown className="host-crown" size={17}/>} {ready&&<span className="seat-ready"><Check size={13}/></span>}{speaking&&<span className="turn-bubble"><MessageCircle size={14}/></span>}</button>{!preview&&<><strong className="seat-name">{p.name}{p.id===room.me&&<small>You</small>}</strong><span className="seat-status">{speaking?'Giving a clue':ready?'Ready':p.id===room.host?'Host':`${p.score} ${p.score===1?'point':'points'}`}</span></>}</>:<><div className="empty-chair"><span>+</span></div>{!preview&&<span className="seat-status">Open seat</span>}</>}
      </div>;
    })}</div>
  </section>;
}
