'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/features/language/LanguageProvider';
import { BOARD_SIZE as N, emptyBoard, makeTray, hasMove, canPlace, placeBlock } from './blockRules';
import { makeRound } from './practice';
import { BlockQuiz } from './BlockQuiz';

const fresh=()=>{const board=emptyBoard();return {board,tray:makeTray(board),score:0,lines:0,questions:0,phase:'playing',cleared:[],question:null,picked:null,attempts:0};};
export function BlockPuzzle({words,accent,onHome,onMiss}) {
  const t=useTranslation();
  const [game,setGame]=useState(fresh),live=useRef(game),boardRef=useRef(null),drag=useRef(null),ghost=useRef(null);
  const [selected,setSelected]=useState(null),[hover,setHover]=useState(null),[dragging,setDragging]=useState(null),[cursor,setCursor]=useState(0),[notice,setNotice]=useState('');
  const [best,setBest]=useState(0),bestRef=useRef(0);
  function update(next){live.current=next;setGame(next);}
  useEffect(()=>{try{const saved=Number(localStorage.getItem('toeic900:blocks:best'));if(Number.isFinite(saved)&&saved>0){bestRef.current=saved;setBest(saved);}}catch{}},[]);
  useEffect(()=>{if(game.score>bestRef.current){bestRef.current=game.score;setBest(game.score);try{localStorage.setItem('toeic900:blocks:best',String(game.score));}catch{}}},[game.score]);
  useEffect(()=>{
    if(game.phase!=='clearing')return;
    const timer=setTimeout(()=>{
      const current=live.current;
      if(current.phase!=='clearing')return;
      const round=makeRound(words,'meaning',words.length);
      const question=round.find(q=>q.word.id!==current.question?.word.id)||round[0];
      update({...current,phase:'question',board:current.nextBoard,cleared:[],question,picked:null,attempts:0});
    },420);
    return()=>clearTimeout(timer);
  },[game.phase,words]);
  const piece=game.tray.find(p=>p?.id===selected);
  const preview=piece&&hover?piece.cells.map(([r,c])=>[hover.row+r,hover.column+c]).filter(([r,c])=>r>=0&&c>=0&&r<N&&c<N).map(([r,c])=>r*N+c):[];
  const valid=piece&&hover&&canPlace(game.board,piece,hover.row,hover.column);
  function put(row,column,id=selected){
    const state=live.current,p=state.tray.find(p=>p?.id===id);
    if(state.phase!=='playing'||!p)return;
    const result=placeBlock(state.board,p,row,column);
    if(!result){setNotice('That block does not fit there. Try another spot.');return;}
    let tray=state.tray.map(p=>p?.id===id?null:p);
    if(tray.every(p=>!p))tray=makeTray(result.board);
    update({...state,board:result.lines?result.placed:result.board,nextBoard:result.board,tray,score:state.score+result.score,lines:state.lines+result.lines,cleared:result.cleared,phase:result.lines?'clearing':hasMove(result.board,tray)?'playing':'over'});
    setSelected(null);setHover(null);setNotice(result.lines?'Line cleared! A quick word question is coming.':'Pick your next block.');
  }
  function answer(option){
    const state=live.current;if(state.phase!=='question')return;
    const correct=option.id===state.question.word.id;
    if(!correct&&!state.attempts)onMiss(state.question.word);
    update({...state,picked:option.id,attempts:state.attempts+1,phase:correct?'answered':'question',questions:state.questions+Number(correct)});
  }
  function resume(){const state=live.current;if(state.phase!=='answered')return;update({...state,phase:hasMove(state.board,state.tray)?'playing':'over'});}
  function geometry(){const rect=boardRef.current.querySelector('.block-cell').getBoundingClientRect();return {rect,cell:rect.width,unit:rect.width+parseFloat(getComputedStyle(boardRef.current).columnGap)};}
  function point(event){const {rect,cell,unit}=geometry(),d=drag.current;return {row:Math.round((event.clientY-(d?.lift||0)-rect.top-cell/2)/unit)-(d?.grabRow||0),column:Math.round((event.clientX-rect.left-cell/2)/unit)-(d?.grabColumn||0)};}
  function finishDrag(){drag.current=null;setDragging(null);setHover(null);if(ghost.current)ghost.current.style.visibility='hidden';}
  function begin(event,p){
    if(game.phase!=='playing'||event.button>0)return;
    event.preventDefault();event.currentTarget.focus({preventScroll:true});
    setSelected(p.id);setNotice('Tap a square on the board, or drag the block.');
    const mini=event.currentTarget.querySelector('.block-mini').getBoundingClientRect();
    const columns=Math.max(...p.cells.map(c=>c[1]))+1,rows=Math.max(...p.cells.map(c=>c[0]))+1;
    const {cell}=geometry();
    drag.current={id:p.id,x:event.clientX,y:event.clientY,moved:false,lift:event.pointerType==='touch'?cell*1.6:0,grabRow:Math.max(0,Math.min(rows-1,Math.floor((event.clientY-mini.top)/(mini.height/rows)))),grabColumn:Math.max(0,Math.min(columns-1,Math.floor((event.clientX-mini.left)/(mini.width/columns))))};
    ghost.current.style.setProperty('--ghost-cell',`${cell}px`);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event){
    const d=drag.current;if(!d)return;
    if(!d.moved&&Math.hypot(event.clientX-d.x,event.clientY-d.y)>5){d.moved=true;setDragging(d.id);}
    if(!d.moved)return;
    const {cell,unit}=geometry(),p=point(event);
    ghost.current.style.visibility='visible';
    ghost.current.style.transform=`translate3d(${event.clientX-cell/2-d.grabColumn*unit}px,${event.clientY-d.lift-cell/2-d.grabRow*unit}px,0)`;
    ghost.current.dataset.valid=String(canPlace(live.current.board,live.current.tray.find(p=>p?.id===d.id),p.row,p.column));
    setHover(previous=>previous?.row===p.row&&previous?.column===p.column?previous:p);
  }
  function end(event){const d=drag.current;if(!d)return;if(d.moved){const p=point(event);put(p.row,p.column,d.id);}finishDrag();}
  function reset(){update(fresh());setSelected(null);setHover(null);setNotice('');finishDrag();}
  return <section className="block-game">
    <header className="arcade-session-top"><button type="button" className="arcade-exit" onClick={onHome} aria-label={t('Back to games')}>←</button><div><span className="arcade-eyebrow">{t('Build. Clear. Discover.')}</span><h1>{t('Word blocks')}</h1></div><button type="button" className="arcade-secondary block-reset" onClick={reset}>{t('Restart')}</button></header>
    <div className="block-layout">
      <div className="block-play-area">
        <div className="block-scorebar"><strong>{game.score}<small>{t('Score')}</small></strong><span>♛ {best}<small>{t('Personal best')}</small></span></div>
        <div className={`block-board ${game.phase==='clearing'?'is-clearing':''}`} ref={boardRef} role="group" aria-label={t('Block puzzle board')} aria-busy={game.phase==='clearing'} onPointerLeave={()=>!drag.current&&setHover(null)}>
          {game.board.map((color,index)=>{
            const row=Math.floor(index/N),column=index%N,inPreview=preview.includes(index);
            return <button type="button" key={index} tabIndex={cursor===index?0:-1} aria-label={t(color?'Row {0}, column {1}, occupied':'Row {0}, column {1}, empty',[row+1,column+1])} aria-disabled={game.phase!=='playing'} className={`block-cell block-color-${color} ${game.cleared.includes(index)?'will-clear':''} ${inPreview?valid?'is-preview':'is-invalid':''}`} onPointerEnter={()=>!drag.current&&setHover({row,column})} onFocus={()=>{setCursor(index);setHover({row,column});}} onClick={()=>{setCursor(index);put(row,column);}} onKeyDown={event=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-N,ArrowDown:N}[event.key];if(delta){event.preventDefault();const next=Math.max(0,Math.min(N*N-1,index+delta));setCursor(next);boardRef.current.children[next]?.focus();}}} />;
          })}
        </div>
        <div className="block-tray" aria-label={t('Choose a block')}>{game.tray.map((p,index)=><div className="block-tray-slot" key={index}>{p&&<button type="button" className={`block-piece ${selected===p.id?'is-selected':''} ${dragging===p.id?'is-dragging':''}`} disabled={game.phase!=='playing'} aria-label={t('Block {0}, {1} squares',[index+1,p.cells.length])} aria-pressed={selected===p.id} onPointerDown={event=>begin(event,p)} onPointerMove={move} onPointerUp={end} onPointerCancel={finishDrag} onLostPointerCapture={()=>drag.current&&finishDrag()} onClick={event=>{if(!event.detail)setSelected(p.id);}}>
          <span className="block-mini" style={{gridTemplateColumns:`repeat(${Math.max(...p.cells.map(c=>c[1]))+1},var(--mini-cell))`,gridTemplateRows:`repeat(${Math.max(...p.cells.map(c=>c[0]))+1},var(--mini-cell))`}} aria-hidden="true">{p.cells.map(([r,c])=><span className={`block-color-${p.color}`} style={{gridRow:r+1,gridColumn:c+1}} key={`${r}-${c}`} />)}</span>
        </button>}</div>)}</div>
      </div>
      <aside className="block-guide"><span className="arcade-eyebrow">{t('No rush. Find your fit.')}</span><h2>{t('A little space for every word.')}</h2><p>{t('Drag a block, or tap a block and then the board. Fill a row or column to clear it.')}</p><div className="block-mini-stats"><span><b>{game.lines}</b>{t('Lines cleared')}</span><span><b>{game.questions}</b>{t('Words unlocked')}</span></div><p>{t('Each clear brings one short vocabulary question. Get it right and keep building. No timer, no penalty for a wrong answer.')}</p><p className="block-notice" role="status">{t(notice||'Pick a block to begin.')}</p>
        {game.phase==='over'&&<div className="block-game-over" role="status"><h3>{t('No more space. Nice building!')}</h3><p>{t('Your score')}: {game.score}</p><button type="button" className="arcade-primary" onClick={reset}>{t('Play again')}</button></div>}
      </aside>
    </div>
    <div ref={ghost} className="block-drag-ghost" aria-hidden="true">{piece&&<span className="block-ghost-grid" style={{gridTemplateColumns:`repeat(${Math.max(...piece.cells.map(c=>c[1]))+1},var(--ghost-cell))`,gridTemplateRows:`repeat(${Math.max(...piece.cells.map(c=>c[0]))+1},var(--ghost-cell))`}}>{piece.cells.map(([r,c])=><span className={`block-color-${piece.color}`} key={`${r}-${c}`} style={{gridRow:r+1,gridColumn:c+1}} />)}</span>}</div>
    <BlockQuiz question={game.question} phase={game.phase} picked={game.picked} attempts={game.attempts} accent={accent} onAnswer={answer} onContinue={resume} onExit={onHome} />
  </section>;
}
