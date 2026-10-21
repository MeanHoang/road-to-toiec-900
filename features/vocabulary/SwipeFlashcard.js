'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';

/** Touch gestures stay outside the flip transform and never intercept audio/star controls. */
export function SwipeFlashcard({ children, cardId, onMark }) {
  const t = useTranslation();
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const gesture = useRef(null), suppressClick = useRef(false), timer = useRef(null);
  const action = useRef(onMark); action.current = onMark;

  useEffect(() => {
    setOffset(0); setLeaving(false); gesture.current = null;
    return () => clearTimeout(timer.current);
  }, [cardId]);

  function reset() { gesture.current = null; setOffset(0); }
  function start(event) {
    if (leaving) return;
    suppressClick.current = false;
    if (event.pointerType !== 'touch' || !event.isPrimary ||
        !window.matchMedia('(max-width: 767px)').matches ||
        event.target.closest('.icon-btn, a, input, select, textarea')) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, horizontal: false };
  }
  function move(event) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x, dy = event.clientY - g.y;
    if (!g.horizontal) {
      if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) { reset(); return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      g.horizontal = true; suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    g.dx = dx; setOffset(dx);
  }
  function end(event) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    const threshold = Math.min(96, event.currentTarget.clientWidth * .25);
    if (g.horizontal && Math.abs(g.dx) >= threshold) {
      setLeaving(true); setOffset(Math.sign(g.dx) * (event.currentTarget.clientWidth + 40));
      const status = g.dx > 0 ? 'known' : 'unknown';
      timer.current = setTimeout(() => {
        action.current(status); setOffset(0); setLeaving(false);
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160);
    } else setOffset(0);
  }
  return <div className="flashcard-swipe-window">
    <div className={`flashcard-swipe-backdrop ${offset > 0 ? 'is-known' : 'is-learning'}`} aria-hidden="true"
      style={{ opacity: Math.min(1, Math.abs(offset) / 100) }}>
      <b>{offset > 0 ? '✓' : '↻'}</b><span>{t(offset > 0 ? 'Known →' : '← Still learning')}</span>
    </div>
    <div className={`flashcard-swipe ${gesture.current?.horizontal ? 'is-dragging' : ''} ${leaving ? 'is-leaving' : ''}`}
      style={{ transform: `translate3d(${offset}px,0,0) rotate(${Math.max(-12, Math.min(12, offset / 20))}deg)` }}
      onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={reset}
      onClickCapture={event => { if (suppressClick.current || leaving) { event.preventDefault(); event.stopPropagation(); } }}>
      {children}
      <span className={`flashcard-swipe-label ${offset > 0 ? 'is-known' : 'is-learning'}`} aria-hidden="true"
        style={{ opacity: Math.min(1, Math.abs(offset) / 72) }}>{t(offset > 0 ? 'Known →' : '← Still learning')}</span>
    </div>
  </div>;
}
