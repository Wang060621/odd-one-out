'use client';
import {useState,type CSSProperties} from 'react';
import {Check,LoaderCircle,Users,X} from 'lucide-react';
import {characters,characterFor} from '../lib/characters.mjs';

export function CharacterSprite({character,index=0,className=''}:{character?:string;index?:number;className?:string}){
  const c=characterFor(character,index);
  return <span className={'painted-avatar '+className} aria-hidden="true"><span className="character-art" style={{'--character-col':`${c.col}%`,'--character-row':`${c.row}%`,backgroundImage:`url("${c.image}")`,backgroundSize:c.grid} as CSSProperties}/></span>;
}

export default function CharacterPicker({character,onClose,onSave,busy,error}:{character:string;onClose:()=>void;onSave:(id:string)=>Promise<void>;busy:boolean;error:string}){
  const [draft,setDraft]=useState(character);
  const selected=characterFor(draft);
  return <div className="modal-backdrop character-backdrop" onClick={()=>{if(!busy)onClose();}}><section className="character-picker painted-dialog" role="dialog" aria-modal="true" aria-labelledby="character-title" onClick={e=>e.stopPropagation()}>
    <button className="icon-button close" aria-label="Close character selection" disabled={busy} onClick={onClose}><X size={20}/></button>
    <p className="character-kicker"><Users size={14}/>The midnight word club</p><h2 id="character-title">Find your character.</h2>
    <div className="character-preview"><CharacterSprite character={draft}/><div aria-live="polite"><strong>{selected.name}</strong><p>{selected.description}</p><small>Characters can be shared by players.</small></div></div>
    <div className="character-grid" role="group" aria-label="Choose your character">{characters.map(c=><button className={'character-option'+(draft===c.id?' chosen':'')} key={c.id} aria-label={`Choose ${c.name}`} aria-pressed={draft===c.id} disabled={busy} onClick={()=>setDraft(c.id)}><CharacterSprite character={c.id}/><span>{c.name}</span>{draft===c.id&&<Check className="character-check" size={15}/>}</button>)}</div>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="character-picker-actions"><button className="text-button" disabled={busy} onClick={onClose}>Cancel</button><button className="primary" disabled={busy} onClick={()=>onSave(draft)}>{busy?<LoaderCircle className="spin" size={17}/>:<Check size={17}/>}Use {selected.name}</button></div>
  </section></div>;
}
