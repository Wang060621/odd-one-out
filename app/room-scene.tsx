'use client';
import type {CSSProperties} from 'react';
import {Check,Crown,Fingerprint,MessageCircle,Trophy,Vote} from 'lucide-react';
import {CharacterSprite} from './character-picker';

// Stable stations: three behind the tabletop, two beside it, three in front.
const stations=[
  {x:50,foot:45,size:12.5,back:true},
  {x:34,foot:46,size:12.5,back:true},
  {x:66,foot:46,size:12.5,back:true},
  {x:21,foot:59,size:13.5,back:false},
  {x:79,foot:59,size:13.5,back:false},
  {x:29,foot:88,size:13.5,back:false},
  {x:50,foot:89,size:13.5,back:false},
  {x:71,foot:88,size:13.5,back:false},
];
export default function RoomScene({room,remaining=null,selected='',onSelect,busy=false}:{room:any;remaining?:number|null;selected?:string;onSelect?:(id:string)=>void;busy?:boolean}){
  const players=room.players,phase=room.phase,current=players[room.clues.length];
  const title=phase==='lobby'?(players.length<3?'Gather your friends':'The table is ready'):phase==='reveal'?'Keep it secret':phase==='clue'?`${current?.name||'Player'}’s turn`:phase==='discussion'?'Open discussion':phase==='vote'?'Who is the odd one?':'Case closed';
  const count=phase==='lobby'?`${players.length} / 8`:phase==='reveal'?`${room.ready.length} / ${players.length}`:phase==='vote'?`${room.voteCount} / ${players.length}`:phase==='clue'?`${room.clues.length+1} / ${players.length}`:room.result?.draw?'A draw!':room.result?.winners?.includes(room.me)?'You win!':'Mystery solved';
  const note=phase==='lobby'?(players.length<3?`${3-players.length} more to start`:'Waiting for the host'):phase==='discussion'?(remaining===null?'No time limit':'Until the vote begins'):phase==='reveal'?'players ready':phase==='vote'?'votes locked':phase==='clue'?(players[room.clues.length+1]?`Next: ${players[room.clues.length+1].name}`:'Discussion is next'):'Ready for another round?';
  return <section className={`room-scene scene-${phase}`} aria-label="Player table">
    <img className="room-art" src="/lobby-art/game-room-cool.png" alt="" aria-hidden="true"/>
    <img className="room-table-art" src="/lobby-art/game-table-cool.png" alt="" aria-hidden="true"/>
    <div className="room-table-focus" ><span className="room-table-symbol">{phase==='vote'?<Vote/>:phase==='result'?<Trophy/>:phase==='discussion'?<MessageCircle/>:<Fingerprint/>}</span><h2>{title}</h2>{(phase==='discussion'||phase==='clue')?<div className={'table-countdown'+(remaining!==null&&remaining<=10?' running-out':'')} role="timer" aria-label={phase==='clue'?'Speaking time remaining':'Discussion time remaining'}>{remaining===null?'∞':`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`}</div>:<strong>{count}</strong>}<small>{note}</small></div>
    {stations.map((s,index)=>{
      const p=players[index],speaking=phase==='clue'&&p?.id===current?.id,ready=phase==='reveal'&&room.ready.includes(p?.id);
      const canSelect=phase==='vote'&&p&&p.id!==room.me&&!room.myVote&&(!room.candidates.length||room.candidates.includes(p.id));
      const style={'--room-x':`${s.x}%`,'--room-foot':`${s.foot}%`,'--room-size':`${s.size}%`} as CSSProperties;
      if(!p)return <div key={`empty-${index}`} className="room-open-station" style={{...style,'--room-foot':`${s.back?s.foot-13:s.foot}%`} as CSSProperties} aria-label="Open seat"><span className="room-open-ring">+</span><small>Open seat</small></div>;
      return <div key={p.id} data-player-index={index} className={'room-person occupied-seat'+(s.back?' back-row':' front-row')+(speaking?' taking-turn':'')+(speaking&&remaining!==null&&remaining<=10?' turn-urgent':'')+(selected===p.id?' is-selected':'')} style={style}>
        <span className="room-contact-shadow" aria-hidden="true"/>
        <button className="room-character" disabled={!canSelect||busy} onClick={()=>onSelect?.(p.id)} aria-label={canSelect?`Select ${p.name}`:`${p.name}${ready?', ready':''}${speaking?', giving a clue':''}`} aria-pressed={canSelect?selected===p.id:undefined}><CharacterSprite character={p.character} index={index} className="club-member"/>{ready&&<span className="room-ready"><Check size={13}/></span>}</button>
        <div className="room-caption">{p.id===room.host&&<Crown className="room-host-crown" size={20} aria-label="Host"/>}<strong>{speaking&&<MessageCircle aria-label="Current turn"/>}<span>{p.name}</span>{p.id===room.me&&<small>You</small>}</strong>{(speaking||ready||p.id===room.host)&&<span className="room-status">{speaking?(remaining===0?'Changing turn…':'Giving a clue'):ready?'Ready':'Host'}</span>}</div>
      </div>;
    })}
  </section>;
}
