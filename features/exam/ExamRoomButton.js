'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Lối vào phòng thi: một nút nhỏ trên thanh tài khoản, cạnh "Bảng xếp hạng".
//
// Không đặt thành một thẻ trong danh sách buổi: thẻ cùng kiểu với DAY 1, DAY 2…
// trông như một buổi học, trong khi thi thử là việc khác hẳn học bài.

import { Icon } from '@/shared/ui/atoms/Icon';
import { Button } from '@/shared/ui/atoms/Button';

export function ExamRoomButton() {
  const t = useTranslation();
  return (
    <Button size="sm" href="/exam">
      <Icon name="exam" size={16} />{t('Exam room')}
    </Button>
  );
}
