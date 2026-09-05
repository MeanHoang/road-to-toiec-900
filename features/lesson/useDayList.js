'use client';

// Danh sách buổi học cho trang chủ — tải hết nội dung để đếm từ vựng / câu nghe.
// Tách khỏi DayProvider vì đây là chuyện của trang chủ, không phải của một buổi.

import { useEffect, useState } from 'react';
import { fetchDay, fetchDayList } from './api';

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
