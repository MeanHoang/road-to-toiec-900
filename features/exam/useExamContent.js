'use client';

// Nạp các đề của phòng thi. Ưu tiên Firestore, không có thì dùng bản bundle.
//
// Bày bản bundle ra NGAY từ lần render đầu rồi mới thay bằng bản trên mạng:
// không có nó thì mở phòng thi là thấy một khoảng trống, trong khi nội dung đã
// nằm sẵn trong repo.

import { useEffect, useState } from 'react';
import { bundledForms, fetchExamForms } from './examContent';

export function useExamContent() {
  const [forms, setForms] = useState(bundledForms);
  const [source, setSource] = useState('repo');

  useEffect(() => {
    let alive = true;
    fetchExamForms()
      .then((f) => {
        if (!alive) return;
        setForms(f);
        setSource('firestore');
      })
      .catch(() => {
        // Đọc hỏng thì giữ bản bundle đang bày — phòng thi vẫn chạy được.
      });
    return () => {
      alive = false;
    };
  }, []);

  return { forms, source };
}
