'use client';

import { useEffect, useState } from 'react';

/** Smaller batches on phones keep list navigation near the visible items. */
export function usePageSize(wide = 6, narrow = 3) {
  const [size, setSize] = useState(wide);
  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 700px)');
    const update = () => setSize(viewport.matches ? narrow : wide);
    update();
    viewport.addEventListener('change', update);
    return () => viewport.removeEventListener('change', update);
  }, [wide, narrow]);
  return size;
}
