'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useState } from 'react';
import { AccountBar } from '@/features/auth/AccountBar';
import { ExamRoomButton } from '@/features/exam/ExamRoomButton';
import { LeaderboardButton } from '@/features/leaderboard/LeaderboardButton';
import { Callout } from '@/shared/ui/atoms/Callout';
import { EventGreeting } from '@/shared/ui/atoms/EventGreeting';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { LoadingBlock } from '@/shared/ui/molecules/LoadingBlock';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { NavCardSkeleton } from '@/shared/ui/molecules/NavCardSkeleton';
import { DayRow } from './DayRow';
import { countQuestions } from './stats';
import { useDayList } from './useDayList';
import { lessonPhases } from './phases';

/**
 * Một con số ở đầu trang. Lúc chưa tải xong thì để ô trống chứ KHÔNG hiện 0 —
 * "0 từ vựng" là một câu sai, và người đọc kịp tin nó trước khi số thật nhảy vào.
 */
function Stat({ value, label, loading }) {
  return (
    <div className="stat">
      <b>{loading ? <Skeleton width={36} height={29} style={{ margin: '0 auto' }} /> : value}</b>
      <span>{label}</span>
    </div>
  );
}

export function HomeScreen() {
  const t = useTranslation();
  const { days, loading } = useDayList();
  const [selectedPhase, setSelectedPhase] = useState(null);
  const phases = lessonPhases(days);
  const latest = phases.at(-1);
  const active = phases.find((group) => group.phase === selectedPhase) || latest;
  const totalVocab = days.reduce((n, d) => n + d.vocabulary.length, 0);
  const totalAudio = days.reduce((n, d) => n + countQuestions(d), 0);

  return (
    <>
      <div className="hero">
        <h1>Road to TOEIC 900</h1>
        <p>{t('Choose a lesson to get started')}</p>

        <div className="stat-row">
          <Stat value={days.length} label={t('lessons')} loading={loading} />
          <Stat value={totalVocab} label={t('words')} loading={loading} />
          <Stat value={totalAudio} label={t('listening questions')} loading={loading} />
        </div>
      </div>

      <EventGreeting />

      <AccountBar
        trailing={
          <>
            <ExamRoomButton />
            <LeaderboardButton />
          </>
        }
      />

      {loading ? (
        <LoadingBlock label={t('Loading lessons')}>
          <NavCardSkeleton />
          <NavCardSkeleton />
        </LoadingBlock>
      ) : (
        <div className="stack">
          <div className="home-phases" role="group" aria-label={t('Study phases')}>
            {phases.map((group) => (
              <button
                key={group.phase}
                type="button"
                className={`home-phase ${active?.phase === group.phase ? 'is-active' : ''}`}
                aria-pressed={active?.phase === group.phase}
                onClick={() => setSelectedPhase(group.phase)}
              >
                <b>{t('Phase {0}', [group.phase])}</b>
                <span className="caption">
                  {group.days.length === 1
                    ? t('Lesson {0}', [group.days[0].no])
                    : t('Lessons {0}–{1}', [group.days[0].no, group.days.at(-1).no])}
                </span>
              </button>
            ))}
          </div>

          {active && <h2 className="home-phase-title">{t('Phase {0}', [active.phase])}</h2>}
          {active?.days.map((d) => <DayRow key={d.slug} day={d} />)}

          {/* Thẻ "buổi tiếp theo" chỉ hiện khi đã biết có bao nhiêu buổi — lúc
              đang tải nó sẽ đánh số 01 rồi nhảy sang 02, trông như lỗi. */}
          {active && active.phase === latest.phase && (
            <NavCard
              empty
              lead={String(Math.max(...days.map((day) => day.no)) + 1).padStart(2, '0')}
              title={t('Next lesson')}
              meta={t('Material not available yet')}
            />
          )}
        </div>
      )}

      <Callout style={{ marginTop: 'var(--space-5)' }}>
        {t('Your progress is saved on this device so you can keep studying offline. Sign in with Google to sync it to your account and continue on another device.')}
      </Callout>
    </>
  );
}
