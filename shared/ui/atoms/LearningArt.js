/** Minh hoạ cùng nét vẽ và bảng màu với bộ trò chơi, dùng cho các thẻ học. */
export function LearningArt({ kind = 'book', className = '' }) {
  return <svg className={`learning-art ${className}`} viewBox="0 0 180 140" fill="none" aria-hidden="true">
    <circle cx="90" cy="70" r="54" fill="currentColor" opacity=".09" />
    <circle cx="90" cy="70" r="65" stroke="currentColor" strokeDasharray="3 7" opacity=".16" />
    <path d="M25 32v10m-5-5h10m120 61v10m-5-5h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
    {kind === 'headphones' || kind === 'dictation' ? <>
      <path d="M52 78V61a38 38 0 0 1 76 0v17" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <rect x="43" y="65" width="20" height="35" rx="9" fill="currentColor" /><rect x="117" y="65" width="20" height="35" rx="9" fill="currentColor" />
      <path d="M79 64v21m11-30v39m11-30v21" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {kind === 'dictation' && <g transform="rotate(-8 125 105)"><rect x="96" y="89" width="55" height="32" rx="8" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="2" /><path d="M106 100h32m-32 10h19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></g>}
    </> : kind === 'cards' ? <>
      <rect x="40" y="33" width="63" height="81" rx="10" fill="currentColor" opacity=".3" transform="rotate(-14 72 73)" />
      <rect x="59" y="31" width="63" height="81" rx="10" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="2" transform="rotate(-4 90 71)" />
      <rect x="80" y="40" width="63" height="81" rx="10" fill="currentColor" transform="rotate(10 111 80)" />
      <text x="110" y="92" textAnchor="middle" fontFamily="Georgia,serif" fontSize="43" fill="var(--art-paper,#fff)">a</text>
      <path d="M48 119c9 8 18 9 25 7m-6-4 6 4-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </> : kind === 'game' ? <>
      <path d="M61 52h58c13 0 19 14 24 35s-5 29-15 20l-16-14H68l-16 14c-10 9-20 0-15-20s11-35 24-35Z" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="3" />
      <path d="M65 66v22M54 77h22" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><circle cx="112" cy="71" r="5" fill="currentColor" /><circle cx="125" cy="83" r="5" fill="currentColor" />
      <path d="m91 22 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" fill="currentColor" opacity=".65" />
    </> : kind === 'pictures' ? <>
      <rect x="38" y="28" width="91" height="73" rx="10" fill="currentColor" opacity=".22" transform="rotate(-10 83 64)" />
      <rect x="49" y="40" width="98" height="75" rx="10" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="2" transform="rotate(6 98 77)" />
      <path d="m60 98 24-28 19 20 12-11 20 26-75-7Z" fill="currentColor" opacity=".7" /><circle cx="119" cy="60" r="8" fill="currentColor" />
      <path d="M67 116h37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </> : kind === 'pen' || kind === 'quiz' ? <>
      <rect x="46" y="28" width="80" height="90" rx="10" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="2" transform="rotate(-5 86 73)" />
      <rect x="67" y="23" width="35" height="13" rx="5" fill="currentColor" />
      <path d="m59 55 4 4 8-9m7 5h29m-48 20 4 4 8-9m7 5h29m-48 20h36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m107 107 20-43 12 6-20 43-13 8 1-14Z" fill="currentColor" /><path d="m128 64 3-7c2-4 6-4 9-2s5 5 3 9l-3 6" fill="currentColor" opacity=".5" />
      <path d="m110 108 7 3" stroke="var(--art-paper,#fff)" strokeWidth="2" />
    </> : kind === 'vocab' ? <>
      <rect x="35" y="39" width="89" height="69" rx="10" fill="currentColor" opacity=".24" transform="rotate(-8 79 73)" />
      <rect x="50" y="33" width="89" height="69" rx="10" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="2" />
      <text x="64" y="64" fontFamily="Georgia,serif" fontSize="25" fill="currentColor">Aa</text>
      <path d="M65 76h53m-53 11h34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="130" cy="100" r="19" fill="currentColor" /><path d="m143 114 13 13" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /><circle cx="130" cy="100" r="11" fill="var(--art-paper,#fff)" />
    </> : <>
      <path d="M90 46c-17-12-36-12-55-7v65c20-5 38-3 55 7 17-10 35-12 55-7V39c-19-5-38-5-55 7Z" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M90 46v65M46 55l30 5m-30 9 30 5m-30 9 23 4m35-27 29-5m-29 19 29-5m-29 19 20-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".65" />
      <path d="M107 31v35l9-7 9 4V28" fill="currentColor" />
    </>}
  </svg>;
}
