import { Badge } from '@/shared/ui/atoms/Badge';

/**
 * Nhãn "xong / đang làm / chưa bắt đầu" tính từ hai con số.
 * Trước đây mỗi màn tự viết lại chuỗi if này, và mỗi chỗ lại chọn tone khác nhau.
 */
export function CountBadge({ done, total, emptyLabel = 'none yet', startLabel = 'start' }) {
  if (total === 0) return <Badge>{emptyLabel}</Badge>;
  if (done === 0) return <Badge>{startLabel}</Badge>;
  if (done >= total) return <Badge tone="success">complete</Badge>;
  return (
    <Badge tone="brand">
      {done} / {total}
    </Badge>
  );
}
