'use client';

import { useMemo, useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { CopyUnknown } from './CopyUnknown';
import { FILTERS, countStarred, filterVocabulary, isKnown, notKnownYet } from './filters';
import { VocabRow } from './VocabRow';

export function VocabTableScreen({ slug, day }) {
  const { day: state, ready, setVocab, setStar } = useProgress(slug);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(
    () =>
      filterVocabulary(day.vocabulary, {
        vocabState: state.vocab,
        starState: state.star,
        query,
        filter,
      }),
    [day.vocabulary, state.vocab, state.star, query, filter],
  );

  const starCount = useMemo(
    () => (ready ? countStarred(day.vocabulary, state.star) : 0),
    [day.vocabulary, state.star, ready],
  );

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title="Vocabulary list"
        subtitle={`${day.vocabulary.length} words · search by word, meaning, or IPA`}
      >
        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          <CopyUnknown
            daySlug={slug}
            words={ready ? notKnownYet(day.vocabulary, state.vocab) : []}
          />
          <span className="caption">
            Paste into Claude Code so the <code>toeic-quiz</code> skill can generate questions for these words
          </span>
        </div>
      </PageHeader>

      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <Input
          type="search"
          placeholder="Search words, meanings, or IPA…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'primary' : 'quiet'}
            onClick={() => setFilter(f.key)}
          >
            {f.key === 'star' && starCount ? `${f.label} (${starCount})` : f.label}
          </Button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="col-star">
                <span aria-label="Star" title="Star">
                  ★
                </span>
              </th>
              <th>#</th>
              <th>Word</th>
              <th>UK</th>
              <th>US</th>
              <th>Meaning</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const known = ready && isKnown(state.vocab, v.id);
              const starred = ready && Boolean(state.star[v.id]);
              return (
                <VocabRow
                  key={v.id}
                  word={v}
                  known={known}
                  starred={starred}
                  onToggleKnown={() => setVocab(v.id, known ? 'unknown' : 'known')}
                  onToggleStar={() => setStar(v.id, !starred)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="section-lead" style={{ marginTop: 'var(--space-4)' }}>
          {filter === 'star' && !starCount
            ? 'No starred words yet. Click ★ here or press S while studying flashcards.'
            : 'No matching words.'}
        </p>
      )}

      <p className="caption" style={{ marginTop: 'var(--space-3)' }}>
        Click a status label to change it. Missed words in the game are marked as To learn. Star words you want to review, even if they are already Known. Vietnamese meanings were added by AI. If a meaning needs correcting, edit{' '}
        <code>content/{slug}/vocabulary.json</code>.
      </p>
    </>
  );
}
