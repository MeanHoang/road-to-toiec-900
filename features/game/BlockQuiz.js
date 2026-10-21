'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';
import { useGameAudio } from './useGameAudio';

export function BlockQuiz({ question, phase, picked, attempts, accent, onAnswer, onContinue, onExit }) {
  const t=useTranslation(),dialog=useRef(null);
  const open=phase==='question'||phase==='answered';
  const audio=useGameAudio(question?.word,accent,phase==='question');
  useEffect(()=>{if(open&&!dialog.current.open)dialog.current.showModal();if(!open&&dialog.current.open)dialog.current.close();},[open]);
  useEffect(()=>{if(phase!=='answered')return;const timer=setTimeout(onContinue,1000);return()=>clearTimeout(timer);},[phase,onContinue]);
  return <dialog className="block-quiz" ref={dialog} aria-labelledby="block-quiz-title" aria-describedby="block-quiz-help" onCancel={event=>event.preventDefault()}>
    <span className="arcade-eyebrow">{t('A little word break')}</span>
    <h2 id="block-quiz-title">{t('One answer, then back to the blocks.')}</h2>
    <p id="block-quiz-help">{t('Listen and choose the meaning. A wrong answer costs no points.')}</p>
    {question&&<>
      <div className="block-quiz-word"><strong lang="en">{question.word.word}</strong><button className="icon-btn" type="button" onClick={()=>audio.play()} aria-label={t('Play word audio')}>♫</button></div>
      {audio.error&&<p className="arcade-audio-error" role="status">{t('Audio could not play. Check your connection and tap play again.')}</p>}
      <div className="block-quiz-options">{question.options.map(option=><button type="button" key={option.id} disabled={phase==='answered'} className={`arcade-meaning-option ${picked===option.id?phase==='answered'?'is-correct':'is-wrong':''}`} onClick={()=>onAnswer(option)}>{option.meaningVi}</button>)}</div>
      <div className="block-quiz-feedback" role="status">{phase==='answered'?t('Correct! Your board is ready.'):attempts>0?<>{t('Try again. Here is a hint:')} <b>{question.word.meaningVi}</b></>:t('Answer correctly to keep building.')}</div>
      {phase==='answered'&&<button type="button" className="arcade-primary" onClick={onContinue} autoFocus>{t('Keep building')} →</button>}
      <button type="button" className="block-quiz-leave" onClick={onExit}>{t('Back to games')}</button>
    </>}
  </dialog>;
}
