'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';
import { makeMatchBoard, matchPair } from './practice';
import { GameArt } from './GameArt';

export function MatchGame({ words, accent, onHome, onMiss }) {
  const t = useTranslation();
  const [board, setBoard] = useState(() => makeMatchBoard(words));
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const started = useRef(null);
  const timeout = useRef(null);
  const audio = useRef(null);
  const locked = useRef(false);
  const complete = board.length > 0 && matched.length === board.length;

  useEffect(() => {
    const player = new Audio();
    audio.current = player;
    return () => { clearTimeout(timeout.current); player.pause(); player.removeAttribute('src'); };
  }, []);
  useEffect(() => {
    if (!running || complete) return;
    const clock = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 100);
    return () => clearInterval(clock);
  }, [running, complete]);

  function startAgain() {
    clearTimeout(timeout.current); audio.current?.pause();
    setBoard(makeMatchBoard(words)); setSelected(null); setMatched([]); setFeedback(null);
    setMistakes(0); setElapsed(0); setRunning(false); setAudioError(false);
    started.current = null; locked.current = false;
  }
  function pronounce(word) {
    const player = audio.current;
    const src = word.voice?.[accent] || word.voice?.us || word.voice?.uk;
    if (!player || !src) return;
    player.pause(); player.src = src; setAudioError(false);
    player.play().catch(() => { if (player.src.endsWith(src)) setAudioError(true); });
  }
  function choose(card) {
    if (locked.current || matched.includes(card.id) || complete) return;
    if (!started.current) { started.current = Date.now(); setRunning(true); }
    if (card.side === 'en') pronounce(card.word);
    if (selected?.id === card.id) { setSelected(null); return; }
    // Tapping another card on the same side changes your selection; it is not a mistake.
    if (!selected || selected.side === card.side) { setSelected(card); return; }
    locked.current = true;
    const correct = matchPair(selected, card);
    const ids = [selected.id, card.id];
    setFeedback({ correct, ids });
    if (!correct) { setMistakes((n) => n + 1); onMiss(selected.word); onMiss(card.word); }
    timeout.current = setTimeout(() => {
      if (correct) {
        const next = [...matched, ...ids];
        setMatched(next);
        if (next.length === board.length) {
          setElapsed((Date.now() - started.current) / 1000); setRunning(false); audio.current?.pause();
        }
      }
      setFeedback(null); setSelected(null); locked.current = false;
    }, correct ? 280 : 650);
  }

  if (complete) return <section className="arcade-result">
    <div className="arcade-result-art arcade-tone-sky"><GameArt kind="match" /></div>
    <span className="arcade-eyebrow">{t('BOARD CLEARED')}</span>
    <h1>{t('A perfect pair. Again and again.')}</h1>
    <p>{t('Every match makes these words a little more familiar.')}</p>
    <div className="arcade-result-stats">
      <div><strong>{elapsed.toFixed(1)}<small>s</small></strong><span>{t('Your time')}</span></div>
      <div><strong>{board.length / 2}</strong><span>{t('Pairs matched')}</span></div>
      <div><strong>{mistakes}</strong><span>{t('Mismatches')}</span></div>
    </div>
    <div className="arcade-result-actions"><button type="button" className="arcade-primary" onClick={startAgain}>{t('Shuffle and play again')} <span aria-hidden="true">→</span></button><button type="button" className="arcade-secondary" onClick={onHome}>{t('Back to games')}</button></div>
  </section>;

  return <section className="arcade-match">
    <header className="arcade-session-top">
      <button type="button" className="arcade-exit" onClick={onHome} aria-label={t('Back to games')}>←</button>
      <div><span className="arcade-eyebrow">{t('A LITTLE MEMORY WORKOUT')}</span><h1>{t('Match the cards')}</h1></div>
      <span className="arcade-counter" role="timer" aria-label={t('Elapsed time')}>{elapsed.toFixed(1)}s</span>
    </header>
    <div className="arcade-match-instructions"><p>{t('Pick a word and its meaning. Make every pair disappear.')}</p><span>{matched.length / 2} / {board.length / 2} {t('pairs')}</span></div>
    <div className="arcade-match-board" aria-label={t('Word and meaning cards')}>
      {board.map((card) => {
        const gone = matched.includes(card.id);
        const active = feedback?.ids.includes(card.id);
        return <button key={card.id} type="button" className={`arcade-match-tile ${gone ? 'is-matched' : ''} ${selected?.id === card.id ? 'is-selected' : ''} ${active ? feedback.correct ? 'is-correct' : 'is-wrong' : ''}`}
          disabled={gone || Boolean(feedback)} tabIndex={gone ? -1 : 0} aria-pressed={selected?.id === card.id} aria-hidden={gone ? true : undefined} onClick={() => choose(card)}>
          {!gone && <><span className="arcade-match-side">{card.side === 'en' ? 'EN' : 'VI'} {card.side === 'en' && <span aria-hidden="true">♫</span>}</span><span lang={card.side === 'en' ? 'en' : 'vi'}>{card.label}</span></>}
        </button>;
      })}
    </div>
    <div className="arcade-match-footer"><span role="status">{feedback ? t(feedback.correct ? 'A match! Keep going.' : 'Not this pair. Try another.') : t(running ? 'Find your next pair.' : 'The timer starts with your first card.')}</span><span>{t('Mismatches')}: {mistakes}</span></div>
    {audioError && <p className="arcade-audio-error" role="alert">{t('Audio could not play. Tap the English card to try again.')}</p>}
    <p className="arcade-footnote">{t('English cards speak when you tap them.')}</p>
  </section>;
}
