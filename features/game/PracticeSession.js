'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';
import { makeRound, fillMask, normalizeAnswer, spellingDiff } from './practice';
import { ListenButton } from './ListenButton';
import { PracticeResult } from './PracticeResult';

export function PracticeSession({ mode, words, accent, onMiss, onHome }) {
  const t = useTranslation();
  const [round, setRound] = useState(() => makeRound(words, mode.id));
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const [hint, setHint] = useState(false);
  const [heard, setHeard] = useState(false);
  const [finished, setFinished] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const [autoPaused, setAutoPaused] = useState(false);
  const playButton = useRef(null);
  const advancing = useRef(false);
  const deadline = useRef(null);
  const locked = useRef(false);
  const input = useRef(null);
  const sprint = mode.id === 'sprint';
  const gaps = mode.id === 'gaps';
  const meaning = mode.id === 'meaning';
  const question = round[index];
  const correctCount = results.filter((r) => r.correct).length;

  useEffect(() => {
    if (!sprint || finished) return;
    const timer = setInterval(() => {
      if (!deadline.current) return;
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(left);
      if (!left) { locked.current = true; setFinished(true); }
    }, 150);
    return () => clearInterval(timer);
  }, [sprint, finished]);

  useEffect(() => {
    advancing.current = false;
    if (!meaning && window.matchMedia('(min-width: 768px)').matches) input.current?.focus();
  }, [index, meaning]);

  useEffect(() => {
    if (!feedback || autoPaused || finished || (!feedback.correct && !sprint)) return;
    const timer = setTimeout(() => next(), feedback.correct ? 1100 : 2400);
    return () => clearTimeout(timer);
  }, [feedback, autoPaused, finished, sprint]);

  useEffect(() => {
    if (finished) return;
    const keydown = (event) => {
      if (event.altKey && event.code === 'KeyR') { event.preventDefault(); playButton.current?.click(); return; }
      if (event.isComposing || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const editing = event.target.closest?.('input,textarea,select,[contenteditable="true"]');
      if (event.key === 'Enter' && feedback && !event.target.closest?.('button')) {
        event.preventDefault(); next();
      } else if (event.code === 'Space' && !editing && !event.target.closest?.('button')) {
        event.preventDefault(); playButton.current?.click();
      } else if (meaning && !editing && /^[1-4]$/.test(event.key) && !feedback && heard) {
        const option = question?.options[Number(event.key) - 1];
        if (option) { event.preventDefault(); submit(option); }
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  function restart(missed) {
    setRound(makeRound(missed || words, mode.id));
    setIndex(0); setTyped(''); setFeedback(null); setResults([]);
    setHint(false); setHeard(false); setFinished(false); setRemaining(60);
    deadline.current = null; locked.current = false; advancing.current = false; setAutoPaused(false);
  }

  function submit(option) {
    if (locked.current || feedback || !heard || !question || (sprint && deadline.current && Date.now() >= deadline.current)) return;
    const answer = meaning ? option?.word : gaps ? fillMask(question.mask, typed) : typed;
    if (!answer?.trim()) return;
    locked.current = true;
    const correct = meaning ? option.id === question.word.id : normalizeAnswer(answer) === normalizeAnswer(question.word.word);
    const result = { word: question.word, correct, answer, hinted: hint };
    setFeedback(result);
    setResults((previous) => [...previous, result]);
    if (!correct) onMiss(question.word, !meaning);
  }

  function next() {
    if (advancing.current) return;
    advancing.current = true;
    if (index + 1 >= round.length) { setFinished(true); return; }
    setIndex((i) => i + 1); setTyped(''); setFeedback(null); setHint(false); setHeard(false); setAutoPaused(false);
    locked.current = false;
    if (window.matchMedia('(min-width: 768px)').matches) input.current?.focus();
  }

  if (finished) return <PracticeResult results={results} sprint={sprint} onRetry={restart} onHome={onHome} />;
  if (!question) return <div className="arcade-empty"><h2>{t('No words available yet')}</h2><button className="arcade-secondary" onClick={onHome}>{t('Back to games')}</button></div>;
  const diff = feedback && !feedback.correct && !meaning ? spellingDiff(feedback.answer, question.word.word) : [];
  const missingCount = [...question.mask].filter((c) => c === '_').length;

  return (
    <section className="arcade-session">
      <header className="arcade-session-top">
        <button type="button" className="arcade-exit" onClick={onHome} aria-label={t('Back to games')}>←</button>
        <div><span className="arcade-eyebrow">{t(mode.tag)}</span><h1>{t(mode.title)}</h1></div>
        <span className={`arcade-counter ${sprint && remaining <= 10 ? 'is-urgent' : ''}`}>{sprint ? `${remaining}s` : `${index + 1} / ${round.length}`}</span>
      </header>
      <div className="arcade-progress" role="progressbar" aria-label={t('Session progress')} aria-valuemin={0} aria-valuemax={sprint ? 60 : round.length} aria-valuenow={sprint ? 60 - remaining : index}>
        <span style={{ width: `${sprint ? (60 - remaining) / 60 * 100 : index / round.length * 100}%` }} />
      </div>
      <div className="arcade-exercise">
        <div className="arcade-listening-prompt">
          <span className="arcade-eyebrow">{t('TUNE IN. YOU HAVE GOT THIS.')}</span>
          <ListenButton word={question.word} accent={accent} buttonRef={playButton} onPlaying={() => {
            setHeard(true);
            if (sprint && !deadline.current) deadline.current = Date.now() + 60000;
          }} onStop={() => { setHeard(false); }} />
          <h2>{t(meaning ? 'What does it mean?' : gaps ? 'Fill in the missing letters.' : mode.id === 'phrases' ? 'Which phrase did you hear?' : 'What word did you hear?')}</h2>
          <p>{t(sprint ? 'The clock starts when your first audio plays.' : 'Audio plays automatically. Replay whenever you need.')}</p>
        </div>

        <div className="arcade-response">
        {gaps && <div className="arcade-letter-slots" aria-label={t('Word with missing letters')}>
          {[...question.mask].map((letter, i) => <span className={letter === ' ' ? 'is-space' : letter === '_' ? 'is-blank' : ''} key={i}>{letter === '_' ? '·' : letter}</span>)}
        </div>}
        {meaning ? <div className="arcade-meaning-options">
          {question.options.map((option, i) => <button type="button" key={option.id} disabled={Boolean(feedback) || !heard}
            className={`arcade-meaning-option ${feedback && option.id === question.word.id ? 'is-correct' : feedback && option.word === feedback.answer && !feedback.correct ? 'is-wrong' : ''}`}
            onClick={() => submit(option)}><span>{'ABCD'[i]}</span>{option.meaningVi}</button>)}
        </div> : <form onSubmit={(event) => { event.preventDefault(); feedback ? next() : submit(); }}>
          <label className="arcade-input-label" htmlFor="practice-answer">{t(gaps ? 'Type only the missing letters, in order' : 'Write your answer')}</label>
          <input ref={input} id="practice-answer" className={`arcade-answer ${feedback ? feedback.correct ? 'is-correct' : 'is-wrong' : ''}`}
            value={typed} onChange={(event) => setTyped(gaps ? event.target.value.replace(/\s/g, '') : event.target.value)}
            placeholder={gaps ? t('{0} missing letters', [missingCount]) : t('Type what you hear…')}
            readOnly={Boolean(feedback)} aria-describedby={feedback ? 'practice-feedback' : undefined}
            autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint={feedback ? 'next' : 'done'} />
          {gaps && typed && <p className="arcade-word-preview" aria-live="polite">{fillMask(question.mask, typed)}</p>}
          {!feedback && <div className="arcade-hint-row"><button type="button" onClick={() => setHint(!hint)}>{t(hint ? 'Hide meaning hint' : 'Need a meaning hint?')}</button>{hint && <span>{question.word.meaningVi}</span>}</div>}
          {!feedback && <button className="arcade-primary arcade-check" type="submit" disabled={!typed.trim() || !heard}>{t('Check answer')} <span aria-hidden="true">→</span></button>}
        </form>}

        {!heard && !feedback && <p className="arcade-start-hint">{t('Tap play to listen first.')}</p>}
        {feedback && <div className={`arcade-feedback ${feedback.correct ? 'is-correct' : 'is-wrong'}`} id="practice-feedback" role="status">
          <strong>{t(feedback.correct ? (hint ? 'Correct with a hint. Keep going!' : 'That is it. Nicely done!') : 'Almost. Let us look a little closer.')}</strong>
          {!feedback.correct && !meaning && <div className="arcade-spelling-diff" aria-label={t('Spelling correction')}>
            {diff.map((part, i) => <span key={i} className={`diff-${part.kind}`}>{part.kind === 'extra' ? <del>{part.typed}</del> : part.answer}</span>)}
          </div>}
          <p><b>{question.word.word}</b><span>{question.word.meaningVi}</span></p>
          {!feedback.correct && <small>{t('Saved for another practice. You will get there.')}</small>}
        </div>}
        {feedback && (feedback.correct || sprint) && !autoPaused && <div className="arcade-auto-next" role="status"><span>{t('Moving to the next word…')}</span><button type="button" onClick={() => setAutoPaused(true)}>{t('Stay on this word')}</button></div>}
        {feedback && <button type="button" className="arcade-primary arcade-check" onClick={next}>{t(index + 1 >= round.length ? 'See results' : 'Next word')} <span aria-hidden="true">→</span></button>}
        </div>
      </div>
      <footer className="arcade-session-footer"><span>{t('Correct answers')}: {correctCount}</span><span>{(question.word.voice?.[accent] ? accent : question.word.voice?.us ? 'us' : 'uk') === 'uk' ? t('British audio') : t('American audio')}</span></footer>
      <p className="arcade-keyboard-hints"><kbd>Alt R</kbd> {t('Replay audio')} <span>·</span> <kbd>Enter</kbd> {t('Check or continue')} {meaning && <><span>·</span><kbd>1–4</kbd> {t('Choose an answer')}</>}</p>
    </section>
  );
}
