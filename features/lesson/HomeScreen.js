'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useState } from 'react';
import { AccountBar } from '@/features/auth/AccountBar';
import { ExamRoomButton } from '@/features/exam/ExamRoomButton';
import { LeaderboardButton } from '@/features/leaderboard/LeaderboardButton';
import { EventGreeting } from '@/shared/ui/atoms/EventGreeting';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { LoadingBlock } from '@/shared/ui/molecules/LoadingBlock';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { NavCardSkeleton } from '@/shared/ui/molecules/NavCardSkeleton';
import { LessonNumberArt } from './LessonNumberArt';
import { StudyArt } from '@/shared/ui/molecules/StudyArt';
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
    <div className="home-dashboard">
      <aside className="home-summary"><div className="hero home-intro"><div className="home-intro-copy">
        <span className="eyebrow">Road to TOEIC 900</span><h1>{t('Choose a lesson to get started')}</h1>


        <div className="stat-row">
          <Stat value={days.length} label={t('lessons')} loading={loading} />
          <Stat value={totalVocab} label={t('words')} loading={loading} />
          <Stat value={totalAudio} label={t('listening questions')} loading={loading} />
        </div>
      </div><StudyArt /></div>

      <EventGreeting />

      <AccountBar
        trailing={
          <>
            <ExamRoomButton />
            <LeaderboardButton />
          </>
        }
      />

      </aside>
      <div className="home-catalog">
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

          <div className="lesson-grid">
          {active?.days.map((d) => <DayRow key={d.slug} day={d} />)}

          {/* Thẻ "buổi tiếp theo" chỉ hiện khi đã biết có bao nhiêu buổi — lúc
              đang tải nó sẽ đánh số 01 rồi nhảy sang 02, trông như lỗi. */}
          {active && active.phase === latest.phase && (
            <NavCard
              empty
              art={<LessonNumberArt no={Math.max(...days.map((day) => day.no)) + 1} />}
              artLayout="side"
              tone="mint"
              title={t('Next lesson')}
              meta={t('Material not available yet')}
            />
          )}
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
