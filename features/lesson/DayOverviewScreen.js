'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useProgress } from '@/features/progress/useProgress';
import { summarize } from '@/features/progress/summarize';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Progress } from '@/shared/ui/atoms/Progress';
import { Section } from '@/shared/ui/atoms/Section';
import { CountBadge } from '@/shared/ui/molecules/CountBadge';
import { LearningArt } from '@/shared/ui/atoms/LearningArt';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { countExercises, countPictures, countQuestions } from './stats';

const percentOf = (done, total) => (total ? (done / total) * 100 : 0);

export function DayOverviewScreen({ slug, day }) {
  const t = useTranslation();
  const { day: state, ready } = useProgress(slug);
  const s = summarize(state, day);
  const activityCount = Number(day.has('grammar') || day.has('theory')) + Number(day.has('vocabulary')) * 3 + ['pictures', 'translation', 'exercises', 'listening'].filter((name) => day.has(name)).length;
  const base = `/day/${slug}`;

  return (
    <>
      <PageHeader eyebrow={t('Lesson {0}', [day.no])} title={day.title} subtitle={day.subtitle}>
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Progress percent={ready ? s.percent : 0} label={t('Progress')} />
        </div>
      </PageHeader>

      <Section
        title={t('Lesson activities')}
        lead={t('Work from top to bottom: start with theory and finish with listening practice.')}
      >
        <div className="activity-grid lesson-activity-grid" data-count={activityCount}>
          {(day.has('grammar') || day.has('theory')) && (
            <NavCard
              href={`${base}/theory`}
              art={<LearningArt kind="book" />}
              tone="mint"
              title={t('Theory')}
              meta={[
                day.grammar.length > 0 && `${day.grammar.length} grammar structures`,
                day.theory.length > 0 && `${day.theory.length} theory sections`,
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={<Badge>{t('read')}</Badge>}
            />
          )}

          {day.has('vocabulary') && (
            <>
              <NavCard
                href={`${base}/cards`}
                art={<LearningArt kind="cards" />}
              tone="sky"
                title={t('Flashcards')}
                meta={t('Word and IPA on the front; flip to see the meaning')}
                percent={ready ? percentOf(s.known, s.total) : 0}
                trailing={<CountBadge done={s.known} total={s.total} />}
              />

              <NavCard
                href={`${base}/game`}
                art={<LearningArt kind="game" />}
              tone="lilac"
                title={t('Vocabulary game')}
                meta={t('English ↔ Vietnamese quiz · missed words return to your To learn flashcards')}
                trailing={<Badge>{t('play')}</Badge>}
              />
            </>
          )}

          {day.has('pictures') && (
            <NavCard
              href={`${base}/pictures`}
              art={<LearningArt kind="pictures" />}
              tone="peach"
              title={t('Picture vocabulary')}
              meta={t('{0} images · clothes, prepositions of place, and locations', [countPictures(day)])}
              trailing={<Badge>{t('practice')}</Badge>}
            />
          )}

          {day.has('translation') && (
            <NavCard
              href={`${base}/grammar`}
              art={<LearningArt kind="pen" />}
              tone="lemon"
              title={t('Grammar exercises')}
              meta={t('{0} sentences · label S / V / O, then translate', [day.translation.length])}
              percent={ready ? percentOf(s.transDone, s.transTotal) : 0}
              trailing={<CountBadge done={s.transDone} total={s.transTotal} />}
            />
          )}

          {day.has('exercises') && (
            <NavCard
              href={`${base}/exercises`}
              art={<LearningArt kind={day.exercises.some((set) => set.part === 7) ? 'book' : 'quiz'} />}
              tone="peach"
              title={day.exercises.some((set) => set.part === 7) ? t('Reading practice') : t('Grammar quiz')}
              meta={day.exercises.some((set) => set.part === 7)
                ? t('{0} sets · {1} reading questions', [day.exercises.length, countExercises(day)])
                : t('{0} sets · {1} questions · choose an answer to complete the sentence', [day.exercises.length, countExercises(day)])}
              percent={ready ? percentOf(s.drillDone, s.drillTotal) : 0}
              trailing={<CountBadge done={s.drillDone} total={s.drillTotal} />}
            />
          )}

          {day.has('listening') && (
            <NavCard
              href={`${base}/listen`}
              art={<LearningArt kind="headphones" />}
              tone="lilac"
              title={t('Listening practice')}
              meta={t('{0} sets · {1} questions', [day.listening.length, countQuestions(day)])}
              percent={ready ? percentOf(s.listenDone, s.listenTotal) : 0}
              trailing={<CountBadge done={s.listenDone} total={s.listenTotal} />}
            />
          )}

          {day.has('vocabulary') && (
            <NavCard
              href={`${base}/vocab`}
              art={<LearningArt kind="vocab" />}
              tone="mint"
              title={t('Vocabulary list')}
              meta={t('Browse {0} words · UK/US IPA · filter by learning status', [day.vocabulary.length])}
              trailing={<Badge>{t('browse')}</Badge>}
            />
          )}
        </div>
      </Section>

      <p className="caption" style={{ marginTop: 'var(--space-5)' }}>
        {t('Your progress is saved on this device and syncs to your account when you sign in.')}
      </p>
    </>
  );
}
