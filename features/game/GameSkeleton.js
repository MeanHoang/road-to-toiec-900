'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { LoadingBlock } from '@/shared/ui/molecules/LoadingBlock';

export function GameSkeleton({ session = false }) {
  const t = useTranslation();
  return <LoadingBlock label={t('Loading games')}>
    <div className="page-head">
      <Skeleton width={80} height={13} />
      <Skeleton width="55%" height={34} style={{ marginBlock:12 }} />
      <Skeleton width="75%" height={16} />
    </div>
    {session ? <div className="game-session-skeleton"><Skeleton width={80} height={80} radius="50%" /><Skeleton width="65%" height={26} /><Skeleton width="90%" height={48} /></div> : <>
      <div className="game-loading-toolbar"><Skeleton width={220} height={44} /><Skeleton width={160} height={44} /></div>
      <div className="arcade-grid">{Array.from({length:6},(_,index)=><div className="game-card-skeleton" key={index}><Skeleton height={84} radius={14} /><Skeleton width="60%" height={18} /><Skeleton width="85%" height={14} /><Skeleton width="40%" height={13} /></div>)}</div>
    </>}
  </LoadingBlock>;
}
