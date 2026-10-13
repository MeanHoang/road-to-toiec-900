'use client';

// Lối vào phòng thi: một nút nhỏ trên thanh tài khoản, cạnh "Bảng xếp hạng".
//
// Không đặt thành một thẻ trong danh sách buổi: thẻ cùng kiểu với DAY 1, DAY 2…
// trông như một buổi học, trong khi thi thử là việc khác hẳn học bài.

import { Button } from '@/shared/ui/atoms/Button';

export function ExamRoomButton() {
  return (
    <Button size="sm" href="/exam">
      📝 Phòng thi
    </Button>
  );
}
