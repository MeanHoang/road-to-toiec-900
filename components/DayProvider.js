'use client';

// Nạp một buổi học một lần ở layout rồi chia cho mọi màn con qua context.
// Nếu để từng màn tự gọi Firestore thì mỗi lần điều hướng lại tải lại nội dung.

import { createContext, useContext, useEffect, useState } from 'react';
import { fetchDay, fetchDayList } from '@/lib/content';

const DayContext = createContext(null);

export function DayProvider({ slug, children }) {
  const [state, setState] = useState({ day: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    setState({ day: null, loading: true, error: null });

    fetchDay(slug)
      .then((day) => alive && setState({ day, loading: false, error: null }))
      .catch((e) => alive && setState({ day: null, loading: false, error: e.message }));

    return () => {
      alive = false;
    };
  }, [slug]);

  return <DayContext.Provider value={state}>{children}</DayContext.Provider>;
}

/** Trả về buổi học đang mở. `null` khi đang tải hoặc không tìm thấy. */
export function useDay() {
  const ctx = useContext(DayContext);
  if (!ctx) throw new Error('useDay phải nằm trong <DayProvider>');
  return ctx;
}

/** Danh sách buổi học cho trang chủ. */
export function useDayList() {
  const [slugs, setSlugs] = useState(null);
  const [days, setDays] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchDayList()
      .then(async (list) => {
        if (!alive) return;
        setSlugs(list);
        const loaded = await Promise.all(list.map((s) => fetchDay(s)));
        if (alive) setDays(loaded.filter(Boolean));
      })
      .catch(() => alive && setSlugs([]));
    return () => {
      alive = false;
    };
  }, []);

  return { days, loading: slugs === null };
}
