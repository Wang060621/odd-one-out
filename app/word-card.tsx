'use client';
import { Eye, EyeOff, Fingerprint, ShieldCheck } from 'lucide-react';

export function WordCard({ word, revealed, onToggle }: { word: string; revealed: boolean; onToggle: () => void }) {
  return <div className="secret-card">
    <div className="secret-card-inner" style={{ '--card-rotation': revealed ? '180deg' : '0deg' } as React.CSSProperties}>
      <div className="secret-face secret-front" aria-hidden={revealed} inert={revealed}>
        <span><ShieldCheck size={15} /> For your eyes only</span>
        <Fingerprint size={72} strokeWidth={1} />
        <button onClick={onToggle} aria-pressed={false}><Eye size={17} /> Reveal my word</button>
      </div>
      <div className="secret-face secret-back" aria-hidden={!revealed} inert={!revealed}>
        <span><ShieldCheck size={15} /> Keep this to yourself</span>
        <strong>{word}</strong>
        <button onClick={onToggle} aria-pressed={true}><EyeOff size={17} /> Hide my word</button>
      </div>
    </div>
  </div>;
}
