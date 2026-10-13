'use client';

// Lối vào phòng thi, đặt ở trang chủ ngay trên danh sách buổi.
//
// Một thẻ to chứ không phải một nút trong thanh tài khoản: thi thử là việc
// khác hẳn học bài, và nó không thuộc buổi nào nên không có chỗ nào trong
// danh sách buổi để nhét vào.
//
// Số bài thi được tính từ nội dung đang có, nên hôm nào Part 3 đủ câu là con
// số tự tăng — không phải sửa chữ ở đây.
//
// Nhận `days` qua props chứ KHÔNG tự gọi useDayList: trang chủ đã tải nội dung
// cả chín buổi rồi, gọi lần nữa là tải lại toàn bộ từ vựng và bài nghe lần thứ
// hai chỉ để đếm xem có mấy bài thi.

import { useMemo } from 'react';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { availableExams } from './rules';
import { bundledForms } from './examContent';

export function ExamRoomButton({ days, loading }) {
  const ready = useMemo(
    () => availableExams(days, bundledForms).filter((e) => e.ready),
    [days],
  );

  return (
    <NavCard
      href="/exam"
      lead="📝"
      title="Phòng thi"
      meta={
        loading
          ? 'Đang kiểm nội dung…'
          : `${ready.length} bài thi · bấm giờ, nghe một lần, không xem đáp án`
      }
    />
  );
}
