'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** One recording player per game, reused between rounds for mobile playback. */
export function useGameAudio(word, accent, autoplay = true, onPlaying) {
  const player = useRef(null);
  const current = useRef({word,accent,onPlaying});
  current.current={word,accent,onPlaying};
  const [error,setError]=useState(false);
  const [playing,setPlaying]=useState(false);
  const pause=useCallback(()=>{player.current?.pause();setPlaying(false);},[]);
  const play=useCallback((slow=false)=>{
    const audio=player.current, {word,accent}=current.current;
    const src=word?.voice?.[accent]||word?.voice?.us||word?.voice?.uk;
    if(!audio||!src)return;
    audio.pause();if(!audio.src.endsWith(src))audio.src=src;
    audio.currentTime=0;audio.playbackRate=slow ? 0.8 : 1;setError(false);
    audio.play().catch(()=>{if(player.current===audio&&audio.src.endsWith(src)){setError(true);setPlaying(false);}});
  },[]);
  useEffect(()=>{
    const audio=new Audio();player.current=audio;
    audio.onplaying=()=>{setPlaying(true);current.current.onPlaying?.();};
    audio.onended=()=>setPlaying(false);
    audio.onerror=()=>{setError(true);setPlaying(false);};
    return()=>{audio.pause();audio.onplaying=audio.onended=audio.onerror=null;audio.removeAttribute('src');player.current=null;};
  },[]);
  useEffect(()=>{if(autoplay&&word)play();else pause();return()=>player.current?.pause();},[word?.id,accent,autoplay,play,pause]);
  return {play,pause,error,playing};
}
