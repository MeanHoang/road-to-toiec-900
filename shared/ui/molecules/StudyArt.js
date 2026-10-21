/** Original vector illustration: a small listening and reading desk. */
export function StudyArt({ className = '' }) {
  return <svg className={`study-art ${className}`} width="300" height="170" viewBox="0 0 300 170" fill="none" aria-hidden="true">
    <ellipse cx="152" cy="148" rx="115" ry="9" fill="currentColor" opacity=".08" />
    <path d="M55 128 41 61l83-14 15 71-84 10Z" fill="var(--surface)" stroke="currentColor" strokeWidth="2" />
    <path d="m124 47 75 16 9 68-69-13-15-71Z" fill="var(--surface)" stroke="currentColor" strokeWidth="2" />
    <path d="m124 47 15 71m-15 0-67 11m82-11 62 13M58 75l49-9M62 88l49-9M65 101l34-6m44-28 39 9m-36 5 39 9m-35 5 26 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5" />
    <rect x="170" y="91" width="80" height="51" rx="10" fill="var(--brand)" />
    <path d="M184 116h4m5-9v18m6-25v31m6-20v10m6-18v26m6-32v38m6-27v16m6-9h5" stroke="var(--text-on-brand)" strokeWidth="3" strokeLinecap="round" />
    <path d="M213 64V52a24 24 0 0 1 48 0v12" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    <rect x="206" y="57" width="15" height="25" rx="6" fill="currentColor" /><rect x="253" y="57" width="15" height="25" rx="6" fill="currentColor" />
    <path d="m54 36 4-12 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill="var(--warning)" />
    <circle cx="183" cy="26" r="4" fill="var(--warning)" />
  </svg>;
}
