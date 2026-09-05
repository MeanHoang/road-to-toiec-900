import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { LoadingBlock } from '@/shared/ui/molecules/LoadingBlock';
import { NavCardSkeleton } from '@/shared/ui/molecules/NavCardSkeleton';

/**
 * Khung chờ của một màn trong buổi học: nhãn nhỏ, tiêu đề, thanh tiến độ, rồi
 * mấy khối nội dung. Không khớp từng pixel với mọi màn — nhưng đúng thứ tự và
 * đúng khoảng, nên lúc nội dung về mắt không phải tìm lại chỗ cũ.
 */
export function LessonSkeleton({ blocks = 4 }) {
  return (
    <LoadingBlock label="Đang tải nội dung buổi học">
      <div className="page-head">
        <Skeleton width={90} height={13} />
        <Skeleton width="60%" height={34} style={{ margin: 'var(--space-3) 0' }} />
        <Skeleton width="42%" height={15} />
        <Skeleton height={10} radius="var(--radius-full)" style={{ marginTop: 'var(--space-5)' }} />
      </div>

      <div className="stack">
        {Array.from({ length: blocks }, (_, i) => (
          <NavCardSkeleton key={i} />
        ))}
      </div>
    </LoadingBlock>
  );
}
