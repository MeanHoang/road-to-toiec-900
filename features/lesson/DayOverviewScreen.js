'use client';

import { useProgress } from '@/features/progress/useProgress';
import { summarize } from '@/features/progress/summarize';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Progress } from '@/shared/ui/atoms/Progress';
import { Section } from '@/shared/ui/atoms/Section';
import { CountBadge } from '@/shared/ui/molecules/CountBadge';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { countExercises, countPictures, countQuestions } from './stats';

const percentOf = (done, total) => (total ? (done / total) * 100 : 0);

export function DayOverviewScreen({ slug, day }) {
  const { day: state, ready } = useProgress(slug);
  const s = summarize(state, day);
  const base = `/day/${slug}`;

  return (
    <>
      <PageHeader eyebrow={`Lesson ${day.no}`} title={day.title} subtitle={day.subtitle}>
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Progress percent={ready ? s.percent : 0} label="Progress" />
        </div>
      </PageHeader>

      <Section
        title="Lesson activities"
        lead="Work from top to bottom: start with theory and finish with listening practice."
      >
        <div className="stack">
          {(day.has('grammar') || day.has('theory')) && (
            <NavCard
              href={`${base}/theory`}
              lead="📘"
              title="Theory"
              meta={[
                day.grammar.length > 0 && `${day.grammar.length} grammar structures`,
                day.theory.length > 0 && `${day.theory.length} theory sections`,
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={<Badge>read</Badge>}
            />
          )}

          {day.has('vocabulary') && (
            <>
              <NavCard
                href={`${base}/cards`}
                lead="🗂"
                title="Flashcards"
                meta="Word and IPA on the front; flip to see the meaning"
                percent={ready ? percentOf(s.known, s.total) : 0}
                trailing={<CountBadge done={s.known} total={s.total} />}
              />

              <NavCard
                href={`${base}/game`}
                lead="🎮"
                title="Vocabulary game"
                meta="English ↔ Vietnamese quiz · missed words return to your To learn flashcards"
                trailing={<Badge>play</Badge>}
              />
            </>
          )}

          {day.has('pictures') && (
            <NavCard
              href={`${base}/pictures`}
              lead="🖼"
              title="Picture vocabulary"
              meta={`${countPictures(day)} images · clothes, prepositions of place, and locations`}
              trailing={<Badge>practice</Badge>}
            />
          )}

          {day.has('translation') && (
            <NavCard
              href={`${base}/grammar`}
              lead="✍️"
              title="Grammar exercises"
              meta={`${day.translation.length} sentences · label S / V / O, then translate`}
              percent={ready ? percentOf(s.transDone, s.transTotal) : 0}
              trailing={<CountBadge done={s.transDone} total={s.transTotal} />}
            />
          )}

          {day.has('exercises') && (
            <NavCard
              href={`${base}/exercises`}
              lead="🧩"
              title="Grammar quiz"
              meta={`${day.exercises.length} sets · ${countExercises(day)} questions · choose an answer to complete the sentence`}
              percent={ready ? percentOf(s.drillDone, s.drillTotal) : 0}
              trailing={<CountBadge done={s.drillDone} total={s.drillTotal} />}
            />
          )}

          {day.has('listening') && (
            <NavCard
              href={`${base}/listen`}
              lead="🎧"
              title="Listening practice"
              meta={`${day.listening.length} sets · ${countQuestions(day)} questions`}
              percent={ready ? percentOf(s.listenDone, s.listenTotal) : 0}
              trailing={<CountBadge done={s.listenDone} total={s.listenTotal} />}
            />
          )}

          {day.has('vocabulary') && (
            <NavCard
              href={`${base}/vocab`}
              lead="📋"
              title="Vocabulary list"
              meta={`Browse ${day.vocabulary.length} words · UK/US IPA · filter by learning status`}
              trailing={<Badge>browse</Badge>}
            />
          )}
        </div>
      </Section>

      <p className="caption" style={{ marginTop: 'var(--space-5)' }}>
        Your progress is saved on this device and syncs to your account when you sign in.
      </p>
    </>
  );
}
