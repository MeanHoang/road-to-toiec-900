'use client';

// Lối vào phòng thi, đặt ở trang chủ ngay trên danh sách buổi.
//
// Một thẻ to chứ không phải một nút trong thanh tài khoản: thi thử là việc
// khác hẳn học bài, và nó không thuộc buổi nào nên không có chỗ nào trong
// danh sách buổi để nhét vào.
//
// Số đề đếm từ các đề bundle sẵn — thêm đề mới là con số tự tăng.

import { NavCard } from '@/shared/ui/molecules/NavCard';
import { bundledForms } from './examContent';

export function ExamRoomButton() {
  return (
    <NavCard
      href="/exam"
      lead="📝"
      title="Phòng thi"
      meta={`${bundledForms.length} đề · 200 câu, 7 Part · bấm giờ như thi thật`}
    />
  );
}
