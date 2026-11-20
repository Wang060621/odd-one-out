'use client';

import { type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export type MotionState = {
  code?: string; phase?: string; round?: number; ballot?: number;
  clues: number; selected: string; voted?: string | null; rules: boolean; revealed: boolean; setupOpen: boolean; players: number;
};

export function useGameMotion(root: RefObject<HTMLDivElement | null>, state: MotionState) {
  const { code, phase, round, ballot, clues, selected, voted, rules, setupOpen, players } = state;

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (!code && root.current?.querySelector('.painted-lobby')) return;
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.45 } });
      if (!code) {
        timeline.from('.game-title', { scale: .92, rotation: -6, autoAlpha: 0, ease: 'back.out(1.5)', duration: .6 }, 0)
          .from('.menu-world', { autoAlpha: 0, duration: .7 }, .1)
          .from('.menu-actions > button', { x: -15, autoAlpha: 0, stagger: .08, duration: .35, clearProps: 'transform,opacity,visibility' }, .2)
          .from('.scene-preview .seat-character', { y: 14, autoAlpha: 0, stagger: .09, duration: .55, ease: 'back.out(1.4)', clearProps: 'transform,opacity,visibility' }, .25);
      } else {
        timeline.from('.action-panel', { x: 10, autoAlpha: 0, duration: 0.3 }, 0)
          .from('.table-focus h2, .table-focus > strong, .room-table-focus h2, .room-table-focus > strong, .table-countdown', { scale: .9, autoAlpha: 0, duration: .35 }, 0)
          .from('.progress li.current > span', { scale: 0.7, duration: 0.4, ease: 'back.out(1.8)' }, 0.05);
        if (phase === 'result') {
          timeline.from('.result-symbol', { scale: 0.5, rotation: -25, autoAlpha: 0, ease: 'back.out(1.5)' }, 0.08)
            .from('.word-pair > div', { y: 16, autoAlpha: 0, stagger: 0.12 }, 0.2);
        }
      }
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [code, phase, round, ballot], revertOnUpdate: true });

  useGSAP(() => {
    if (code || setupOpen || rules) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const scene = root.current?.querySelector('.scene-preview');
      if (!scene) return;
      const loops: gsap.core.Animation[] = [];
      // Shadows stay on the floor; bodies move around their feet.
      const gestures = gsap.timeline({ repeat: -1, repeatDelay: 1.8 });
      loops.push(gestures);
      scene.querySelectorAll('.member-body').forEach((body, index) => {
        gsap.set(body, { svgOrigin: '65 137' });
        loops.push(gsap.to(body, {
          scaleY: 1.018, scaleX: .994, duration: 1.7 + index * .13,
          delay: index * .37, repeat: -1, yoyo: true, ease: 'sine.inOut',
        }));
        // Only one character makes a larger gesture at a time.
        const at = 1.6 + index * 2.6;
        const direction = index % 2 ? -1 : 1;
        gestures.to(body, { rotation: direction * 3.5, duration: .65, ease: 'sine.inOut' }, at)
          .to(body, { rotation: -direction * 1.8, duration: .65, ease: 'sine.inOut' }, at + .65)
          .to(body, { rotation: 0, duration: .6, ease: 'sine.inOut' }, at + 1.3);
        const eyes = body.querySelector('.member-eyes');
        if (eyes) {
          gsap.set(eyes, { svgOrigin: '66 64' });
          loops.push(gsap.timeline({ repeat: -1, repeatDelay: 3.6 + index * .43, delay: 1.3 + index * .61 })
            .to(eyes, { scaleY: .08, duration: .09, ease: 'power1.in' })
            .to(eyes, { scaleY: 1, duration: .14, ease: 'power1.out' }));
        }
      });
      loops.push(gsap.fromTo(scene.querySelector('.lamp-glow'), { opacity: .45 }, {
        opacity: 1, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }));
      loops.push(gsap.fromTo(scene.querySelector('.pendant-lamp'), { rotation: -.9, svgOrigin: '450 0' }, {
        rotation: .9, duration: 3.8, ease: 'sine.inOut', repeat: -1, yoyo: true,
      }));
      scene.querySelectorAll('.window-star').forEach((star, index) => {
        loops.push(gsap.to(star, { opacity: .25, duration: 1.8, delay: index * 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
      });
      const syncVisibility = () => loops.forEach(loop => loop.paused(document.hidden));
      syncVisibility();
      document.addEventListener('visibilitychange', syncVisibility);
      return () => document.removeEventListener('visibilitychange', syncVisibility);
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [code, setupOpen, rules], revertOnUpdate: true });

  useGSAP(() => {
    if (!code) return;
    const media=gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)',()=>{
      const newest=root.current?.querySelector(`.occupied-seat[data-player-index="${players-1}"] .club-member`);
      if(newest)gsap.from(newest,{y:16,scale:.85,autoAlpha:0,duration:.5,ease:'back.out(1.8)'});
    },root);
    return()=>media.revert();
  },{scope:root,dependencies:[code,players],revertOnUpdate:true});

  useGSAP(() => {
    if(!setupOpen||code)return;
    const media=gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)',()=>{
      gsap.from('.entry-panel',{scale:.94,rotation:-1,autoAlpha:0,duration:.3,ease:'back.out(1.2)'});
    },root);
    return()=>media.revert();
  },{scope:root,dependencies:[setupOpen,code],revertOnUpdate:true});

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lastClue = root.current?.querySelector('.clue-item:last-child');
      if (lastClue) gsap.from(lastClue, { x: -10, autoAlpha: 0, duration: 0.3, ease: 'power2.out' });
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [clues], revertOnUpdate: true });

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const target = root.current?.querySelector(voted ? '.vote-submit' : '.vote-options .selected');
      if (target) gsap.fromTo(target, { scale: 0.97 }, { scale: 1, duration: 0.3, ease: 'back.out(1.6)' });
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [selected, voted], revertOnUpdate: true });

  useGSAP(() => {
    if (!rules) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.rules-modal', { y: 15, autoAlpha: 0, duration: 0.25, ease: 'power2.out' });
    }, root);
    return () => media.revert();
  }, { scope: root, dependencies: [rules], revertOnUpdate: true });
}

export function GameMotion({ root, state }: { root: RefObject<HTMLDivElement | null>; state: MotionState }) {
  useGameMotion(root, state);
  useGSAP(() => {
    const inner = root.current?.querySelector('.secret-card-inner');
    if (!inner) return;
    gsap.to(inner, {
      rotationY: state.revealed ? 180 : 0,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.5,
      ease: 'power2.inOut', overwrite: 'auto',
    });
  }, { scope: root, dependencies: [state.revealed, state.round, state.phase, state.code] });
  return null;
}
