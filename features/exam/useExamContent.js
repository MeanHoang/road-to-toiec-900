'use client';

// Nạp nội dung phòng thi: danh sách đề + các đề mẫu phần Đọc.
//
// Ưu tiên Firestore, không có thì rơi về bản bundle trong repo. Giống
// features/lesson/useDayList nhưng cho nhánh đề thi — hai nhánh không dùng
// chung đường nạp vì đề thi không thuộc buổi học nào.
//
// Bày bản bundle ra NGAY từ lần render đầu rồi mới thay bằng bản trên mạng:
// không có nó thì mở phòng thi là thấy một khoảng trống, trong khi nội dung
// đã nằm sẵn trong repo.

import { useEffect, useState } from 'react';
import { bundledForms, bundledPapers, fetchExamForms, fetchPapers } from './examContent';

export function useExamContent() {
  const [papers, setPapers] = useState(bundledPapers);
  const [forms, setForms] = useState(bundledForms);
  const [source, setSource] = useState('repo');

  useEffect(() => {
    let alive = true;

    Promise.all([fetchPapers(), fetchExamForms()])
      .then(([p, f]) => {
        if (!alive) return;
        setPapers(p);
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

  return { papers, forms, source };
}
