const paths = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M18 6 6 18',
  book: 'M12 5v15M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z',
  cards: 'm8 3 12 2-2 14M3 7h12v14H3z',
  headphones: 'M4 14v-2a8 8 0 0 1 16 0v2M4 13H2v7h5v-7H4Zm16 0h2v7h-5v-7h3Z',
  game: 'M8 7h8c3 0 4 3 5 7s-1 6-3 4l-3-3H9l-3 3c-2 2-4 0-3-4s2-7 5-7ZM8 10v5m-2-2h4m6-2h.01m2 3h.01',
  image: 'M3 3h18v18H3zM3 17l6-6 5 5 3-3 4 4M15 7h.01',
  pen: 'm4 16 11-11 4 4L8 20l-5 1 1-5ZM14 6l4 4M3 3h6M3 7h3',
  list: 'M9 5h12M9 12h12M9 19h12M3 5h.01M3 12h.01M3 19h.01',
  home: 'm3 10 9-7 9 7v11H3V10Zm6 11v-8h6v8',
  exam: 'M8 4H4v18h16V4h-4M8 2h8v5H8zM8 12h8M8 17h5',
  chevron: 'm9 5 7 7-7 7',
  down: 'm6 9 6 6 6-6',
  speaker: 'M11 4 6 8H2v8h4l5 4V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',
};

export function Icon({ name = 'book', size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.book} /></svg>;
}
