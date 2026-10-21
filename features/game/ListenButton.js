'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';

/** File-backed playback only. Accessible labels never contain the hidden answer. */
export function ListenButton({ word, accent, onPlaying, onStop, buttonRef }) {
  const t = useTranslation();
  const audio = useRef(null);
  const callbacks = useRef({ onPlaying, onStop });
  callbacks.current = { onPlaying, onStop };
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const play = useCallback((slow = false) => {
    const player = audio.current;
    if (!player) return;
    player.pause();
    if (player.error) player.load();
    player.currentTime = 0;
    player.playbackRate = slow ? 0.8 : 1;
    player.preservesPitch = true;
    setError(false);
    player.play().catch(() => { setError(true); setPlaying(false); callbacks.current.onStop?.(); });
  }, []);

  useEffect(() => {
    // Reuse one media element: mobile Safari unlocks audio per element, so
    // creating a new Audio for every automatic question would re-lock playback.
    const player = new Audio();
    audio.current = player;
    player.onplaying = () => { setPlaying(true); callbacks.current.onPlaying?.(); };
    player.onended = () => setPlaying(false);
    player.onerror = () => { setError(true); setPlaying(false); callbacks.current.onStop?.(); };
    return () => {
      player.pause();
      player.onplaying = player.onended = player.onerror = null;
      player.removeAttribute('src');
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    let active = true;
    setPlaying(false);
    setError(false);
    player.src = word.voice?.[accent] || word.voice?.us || word.voice?.uk;
    player.playbackRate = 1;
    player.preservesPitch = true;
    // The Start button is the initial gesture. If a browser still blocks it,
    // one tap on Play unlocks this same element for subsequent questions.
    player.play().catch(() => { if (active) setPlaying(false); });
    return () => { active = false; player.pause(); };
  }, [word.id, word.voice?.us, word.voice?.uk, accent]);

  return (
    <div className="arcade-listener">
      <button ref={buttonRef} type="button" className={`arcade-play ${playing ? 'is-playing' : ''}`} onClick={() => play()} aria-label={t('Play word audio')} aria-keyshortcuts="Alt+R Space">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          {playing ? <path d="M6 12v8m7-14v20m7-17v14m7-11v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /> : <path d="m12 7 14 9-14 9V7Z" fill="currentColor" />}
        </svg>
      </button>
      <div className="arcade-audio-actions">
        <button type="button" onClick={() => play()}>{t('Listen again')}</button>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={() => play(true)}>{t('Slow audio')} <span>0.8×</span></button>
      </div>
      {error && <p className="arcade-audio-error" role="alert">{t('Audio could not play. Check your connection and tap play again.')}</p>}
    </div>
  );
}
