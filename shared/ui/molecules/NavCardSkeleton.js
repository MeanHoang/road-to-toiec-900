import { Skeleton } from '@/shared/ui/atoms/Skeleton';

/** Bản giữ chỗ của NavCard — cùng khung, cùng chiều cao, chỉ chưa có chữ. */
export function NavCardSkeleton({ lines = 2 }) {
  return (
    <div className="nav-card nav-card-skeleton">
      <span className="lead-slot" aria-hidden="true">
        <Skeleton width={24} height={24} radius="var(--radius-sm)" />
      </span>
      <span className="body">
        <Skeleton width="55%" height={18} />
        {lines > 1 && <Skeleton width="80%" height={13} />}
      </span>
    </div>
  );
}
