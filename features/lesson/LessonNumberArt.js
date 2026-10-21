/** Số buổi là hình chính để nhận ra từng bài ngay trong danh sách nhỏ. */
export function LessonNumberArt({ no }) {
  return <svg className="learning-art lesson-number-art" viewBox="0 0 180 140" fill="none" aria-hidden="true">
    <circle cx="90" cy="70" r="56" fill="currentColor" opacity=".1" />
    <circle cx="90" cy="70" r="65" stroke="currentColor" opacity=".17" strokeDasharray="3 7" />
    <rect x="48" y="19" width="83" height="105" rx="14" fill="currentColor" opacity=".16" transform="rotate(-10 90 70)" />
    <rect x="48" y="19" width="83" height="105" rx="14" fill="var(--art-paper,#fff)" stroke="currentColor" strokeWidth="2" transform="rotate(5 90 70)" />
    <path d="M31 39v10m-5-5h10m112 48v10m-5-5h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".65" />
    <text x="91" y="99" textAnchor="middle" fontFamily="'Be Vietnam Pro',sans-serif" fontWeight="600" fontSize={no > 9 ? 62 : 86} letterSpacing="-4" fill="currentColor">{no}</text>
    <path d="M73 113h34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".4" />
    <circle cx="139" cy="31" r="4" fill="currentColor" opacity=".4" />
  </svg>;
}
