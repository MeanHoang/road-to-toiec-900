'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';
import { makeRound } from './practice';
import { useGameAudio } from './useGameAudio';

function BubbleArt() {
  return <svg viewBox="0 0 180 180" fill="none" aria-hidden="true"><path d="M90 5 116 11 137 24 157 41 166 65 175 90 166 115 158 137 136 156 114 168 90 175 64 169 42 156 23 137 12 114 5 90 12 65 24 43 43 23 66 12Z" fill="currentColor" stroke="#b9a7ff" strokeWidth="3" /><path d="M36 54c7-13 20-22 35-26" stroke="#d4c8ff" strokeWidth="9" strokeLinecap="round" opacity=".45" /><circle cx="139" cy="111" r="15" fill="#151735" opacity=".23" /><circle cx="47" cy="130" r="10" fill="#151735" opacity=".2" /></svg>;
}
function Ship() {
  return <svg className="blast-ship" viewBox="0 0 180 120" fill="none" aria-hidden="true"><path d="m72 82 18 33 18-33" fill="#ffc56e" /><path d="m80 88 10 21 10-21" fill="#fff2bf" /><path d="m47 77-23 16 5-37 30-14m74 35 23 16-5-37-30-14" fill="#72e2ce" stroke="#2c867b" strokeWidth="4" /><ellipse cx="90" cy="58" rx="51" ry="44" fill="#59d6bd" stroke="#2c867b" strokeWidth="5" /><path d="M52 47c7-20 25-30 44-27" stroke="#c3fff0" strokeWidth="7" strokeLinecap="round" /><circle cx="90" cy="58" r="25" fill="#213665" stroke="#c3fff0" strokeWidth="5" /><image href="/brand/chicken-mark.webp" x="70" y="38" width="40" height="40" /><rect x="40" y="67" width="14" height="26" rx="6" fill="#c3fff0" /><rect x="126" y="67" width="14" height="26" rx="6" fill="#c3fff0" /></svg>;
}
export function WordBlast({words,accent,onHome,onMiss}) {
  const t=useTranslation();
  const [round,setRound]=useState(()=>makeRound(words,'meaning',10)),[index,setIndex]=useState(0),[score,setScore]=useState(0),[combo,setCombo]=useState(0),[wrong,setWrong]=useState([]),[shot,setShot]=useState(null),[finished,setFinished]=useState(false),[missed,setMissed]=useState([]);
  const question=round[index],locked=useRef(false),timer=useRef(null),actions=useRef(null);
  const audio=useGameAudio(question?.word,accent,!finished&&!shot);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function fire(option,position){
    if(locked.current||finished||wrong.includes(option.id))return;
    locked.current=true;const correct=option.id===question.word.id;
    setShot({position,correct});
    if(correct){setScore(value=>value+10+Math.min(combo,5)*5);setCombo(value=>value+1);}
    else {setCombo(0);setWrong(previous=>[...previous,option.id]);if(!wrong.length){onMiss(question.word);setMissed(previous=>[...previous,question.word]);}}
    timer.current=setTimeout(()=>{
      if(correct){if(index+1>=round.length)setFinished(true);else{setIndex(value=>value+1);setWrong([]);}}
      setShot(null);locked.current=false;
    },correct?650:450);
  }
  actions.current=fire;
  useEffect(()=>{const key=event=>{if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,textarea,select'))return;const n=Number(event.key)-1;if(n>=0&&n<question?.options.length){event.preventDefault();actions.current(question.options[n],n);}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[question]);
  function restart(){clearTimeout(timer.current);locked.current=false;setRound(makeRound(words,'meaning',10));setIndex(0);setScore(0);setCombo(0);setWrong([]);setShot(null);setFinished(false);setMissed([]);}
  if(!question)return null;
  return <section className="word-blast">
    <header className="arcade-session-top"><button type="button" className="arcade-exit" onClick={onHome} aria-label={t('Back to games')}>←</button><div><span className="arcade-eyebrow">{t('Ready, aim, remember.')}</span><h1>{t('Word blast')}</h1></div><span className="arcade-counter">{score} <small>{t('points')}</small></span></header>
    <div className={`blast-scene ${shot&&!shot.correct?'is-shaken':''}`}>
      <div className="blast-stars" aria-hidden="true">{Array.from({length:24},(_,n)=><i key={n} style={{left:`${(n*43+11)%100}%`,top:`${(n*31+7)%100}%`,animationDelay:`${n%5}s`}} />)}</div>
      <div className="blast-planet" aria-hidden="true" />
      {finished?<div className="blast-result"><span className="blast-medal" aria-hidden="true">✦</span><h2>{t('Mission complete!')}</h2><p>{t('Your score')}: <b>{score}</b></p><p>{t('Words to revisit')}: {missed.length}</p><div className="arcade-result-actions"><button className="arcade-primary" type="button" onClick={restart}>{t('Play again')}</button><button className="arcade-secondary" type="button" onClick={onHome}>{t('Back to games')}</button></div></div>:<>
        <div className="blast-prompt"><span>{index+1} / {round.length}</span><div><strong lang="en">{question.word.word}</strong><button className="blast-audio" type="button" aria-label={t('Play word audio')} onClick={()=>audio.play()}>♫</button></div><p>{t('Shoot the matching meaning.')}</p></div>
        <div className="blast-targets">{question.options.map((option,n)=><button type="button" key={`${question.word.id}-${option.id}`} className={`blast-target ${shot?.position===n?shot.correct?'is-hit':'is-wrong':''}`} style={{'--float-delay':`${n*-.7}s`}} disabled={Boolean(shot)||wrong.includes(option.id)} onClick={()=>fire(option,n)}><BubbleArt /><span><small aria-hidden="true">{n+1}</small>{option.meaningVi}</span></button>)}</div>
        {shot?.correct&&<div className={`blast-laser blast-laser-${shot.position}`} aria-hidden="true" />}
        <div className="blast-flight"><span className="blast-combo">{t('Streak')}<b>×{combo}</b></span><Ship /><span className="blast-level">{t('Level {0}',[1+Math.floor(index/5)])}<b>{Math.min(index+1,round.length)}/{round.length}</b></span></div>
        <div className="blast-status" role="status">{shot?t(shot.correct?'Direct hit!':'Not this one. Try another bubble.'):audio.error?t('Audio could not play. Tap the note to try again.'):t('No timer. Take your shot when you are ready.')}</div>
      </>}
    </div>
  </section>;
}
