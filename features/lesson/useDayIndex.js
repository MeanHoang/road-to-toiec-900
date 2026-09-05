'use client';

// Danh sách buổi cho drawer. Tách khỏi useDayList (thứ tải nội dung đầy đủ cho
// trang chủ) vì drawer chỉ cần tên buổi và buổi đó có gì.

import { useEffect, useState } from 'react';
import { fetchDayIndex } from './api';

export function useDayIndex() {
  const [days, setDays] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchDayIndex()
      .then((list) => alive && setDays(list))
      .catch(() => alive && setDays([]));
    return () => {
      alive = false;
    };
  }, []);

  return { days: days || [], loading: days === null };
}
