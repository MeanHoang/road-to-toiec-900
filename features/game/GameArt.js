/** Small original vector illustrations. Decorative, crisp at mobile sizes. */
export function GameArt({ kind = 'spell', className = '' }) {
  return (
    <svg className={`arcade-art ${className}`} viewBox="0 0 180 140" fill="none" aria-hidden="true">
      <circle cx="90" cy="70" r="55" fill="currentColor" opacity=".09" />
      <path d="M27 31v10m-5-5h10M149 99v12m-6-6h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      {kind === 'meaning' || kind === 'spell' ? <>
        <path d="M54 76V62a36 36 0 0 1 72 0v14" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        <rect x="45" y="64" width="20" height="36" rx="9" fill="currentColor" />
        <rect x="115" y="64" width="20" height="36" rx="9" fill="currentColor" />
        <path d="M79 66v19m11-29v40m11-30v19" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        {kind === 'spell' && <><rect x="80" y="97" width="63" height="30" rx="9" fill="var(--art-paper, var(--surface))" stroke="currentColor" strokeWidth="4" /><path d="M90 110h7m6 0h7m6 0h7m-27 8h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></>}
      </> : kind === 'gaps' ? <>
        <g transform="rotate(-10 70 70)"><rect x="30" y="43" width="48" height="58" rx="11" fill="var(--art-paper, var(--surface))" stroke="currentColor" strokeWidth="4" /><text x="54" y="83" textAnchor="middle" fill="currentColor" fontSize="35" fontFamily="'Be Vietnam Pro',sans-serif" fontWeight="700">a</text></g>
        <rect x="78" y="45" width="35" height="55" rx="10" stroke="currentColor" strokeWidth="4" strokeDasharray="5 5" />
        <g transform="rotate(12 134 72)"><rect x="116" y="45" width="42" height="58" rx="11" fill="currentColor" /><text x="137" y="84" textAnchor="middle" fill="var(--art-paper, var(--surface))" fontSize="32" fontFamily="'Be Vietnam Pro',sans-serif" fontWeight="700">c</text></g>
      </> : kind === 'match' ? <>
        <rect x="35" y="33" width="51" height="68" rx="10" fill="var(--art-paper, var(--surface))" stroke="currentColor" strokeWidth="4" transform="rotate(-10 60 67)" />
        <rect x="96" y="40" width="51" height="68" rx="10" fill="currentColor" transform="rotate(10 121 74)" />
        <text x="60" y="79" fill="currentColor" textAnchor="middle" fontSize="32" fontFamily="'Be Vietnam Pro',sans-serif" fontWeight="700">a</text>
        <path d="m110 74 7 7 13-15" stroke="var(--art-paper, var(--surface))" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m74 113 7 5 14-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </> : kind === 'phrases' ? <>
        <rect x="30" y="35" width="96" height="35" rx="12" fill="var(--art-paper, var(--surface))" stroke="currentColor" strokeWidth="4" transform="rotate(-8 78 52)" />
        <rect x="56" y="76" width="96" height="35" rx="12" fill="currentColor" transform="rotate(8 104 93)" />
        <path d="M48 51h59M74 93h59" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M74 93h59" stroke="var(--art-paper, var(--surface))" strokeWidth="5" strokeLinecap="round" />
        <path d="m81 68 5 9m14-12 5 9" stroke="currentColor" strokeWidth="4" />
      </> : kind === 'sprint' ? <>
        <circle cx="90" cy="77" r="38" fill="var(--art-paper, var(--surface))" stroke="currentColor" strokeWidth="4" />
        <path d="M80 26h20m-10 0v12m29 10 7-8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="m97 49-22 30h17l-5 26 22-34H93z" fill="currentColor" />
      </> : <>
        <rect x="40" y="37" width="100" height="70" rx="14" fill="var(--art-paper, var(--surface))" stroke="currentColor" strokeWidth="3" />
        <path d="m57 60 5 5 9-11m-14 30 5 5 9-11m10-18h37M81 84h37" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </>}
    </svg>
  );
}
