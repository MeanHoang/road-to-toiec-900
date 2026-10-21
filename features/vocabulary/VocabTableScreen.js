'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useEffect, useMemo, useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { CopyUnknown } from './CopyUnknown';
import { FILTERS, countStarred, filterVocabulary, isKnown, notKnownYet } from './filters';
import { usePageSize } from '@/shared/ui/hooks/usePageSize';
import { Pagination } from '@/shared/ui/molecules/Pagination';
import { VocabRow } from './VocabRow';

export function VocabTableScreen({ slug, day }) {
  const t = useTranslation();
  const { day: state, ready, setVocab, setStar } = useProgress(slug);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = usePageSize(6, 3);
  useEffect(() => setPage(0), [query, filter]);

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

  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / pageSize) - 1));

  const starCount = useMemo(
    () => (ready ? countStarred(day.vocabulary, state.star) : 0),
    [day.vocabulary, state.star, ready],
  );

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title={t('Vocabulary list')}
        subtitle={t('{0} words · search by word, meaning, or IPA', [day.vocabulary.length])}
      >
        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          <CopyUnknown
            daySlug={slug}
            words={ready ? notKnownYet(day.vocabulary, state.vocab) : []}
          />

        </div>
      </PageHeader>

      <div className="row vocab-toolbar" style={{ marginBottom: 'var(--space-4)' }}>
        <Input
          type="search"
          placeholder={t('Search words, meanings, or IPA…')}
          value={query}
          aria-label={t('Search words, meanings, or IPA…')}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? 'primary' : 'quiet'}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.key === 'star' && starCount ? `${t(f.label)} (${starCount})` : t(f.label)}
          </Button>
        ))}
      </div>

      <div className="table-wrap vocab-table">
        <table>
          <thead>
            <tr>
              <th className="col-star">
                <span aria-label={t('Star')} title={t('Star')}>
                  ★
                </span>
              </th>
              <th>#</th>
              <th>{t('Word')}</th>
              <th>UK</th>
              <th>US</th>
              <th>{t('Meaning')}</th>
              <th>{t('Status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((v) => {
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
            ? t('No starred words yet. Click ★ here or press S while studying flashcards.')
            : t('No matching words.')}
        </p>
      )}

      <Pagination page={currentPage} total={rows.length} pageSize={pageSize} onChange={setPage} />
    </>
  );
}
