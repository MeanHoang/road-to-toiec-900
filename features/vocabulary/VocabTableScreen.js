'use client';

import { useMemo, useState } from 'react';
import { lessonCrumbs } from '@/features/lesson/crumbs';
import { useProgress } from '@/features/progress/useProgress';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { TopBar } from '@/shared/ui/organisms/TopBar';
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
      <TopBar crumbs={lessonCrumbs(slug, day.title, 'Bảng từ vựng')} />

      <PageHeader
        eyebrow={day.title}
        title="Bảng từ vựng"
        subtitle={`${day.vocabulary.length} từ · tra theo từ, nghĩa hoặc IPA`}
      >
        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          <CopyUnknown
            daySlug={slug}
            words={ready ? notKnownYet(day.vocabulary, state.vocab) : []}
          />
          <span className="caption">
            Dán vào Claude Code để skill <code>toeic-quiz</code> sinh thêm câu hỏi cho đúng mấy từ này
          </span>
        </div>
      </PageHeader>

      <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
        <Input
          type="search"
          placeholder="Tìm từ, nghĩa hoặc IPA…"
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
                <span aria-label="Gắn sao" title="Gắn sao">
                  ★
                </span>
              </th>
              <th>#</th>
              <th>Từ</th>
              <th>UK</th>
              <th>US</th>
              <th>Nghĩa</th>
              <th>Trạng thái</th>
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
            ? 'Chưa gắn sao từ nào. Bấm ★ ở đây, hoặc bấm S khi đang học thẻ từ vựng.'
            : 'Không có từ nào khớp.'}
        </p>
      )}

      <p className="caption" style={{ marginTop: 'var(--space-3)' }}>
        Bấm vào nhãn trạng thái để đổi. Trả lời sai ở game cũng tự đẩy từ về &ldquo;chưa học&rdquo;.
        Gắn ★ cho từ nhớ nghĩa rồi mà hay quên mặt chữ — sao không phụ thuộc trạng thái, từ
        &ldquo;đã biết&rdquo; vẫn lọc lại được.
        Nghĩa tiếng Việt do AI bổ sung vì tài liệu gốc bỏ trống — sửa trong{' '}
        <code>content/{slug}/vocabulary.json</code> nếu thấy lệch.
      </p>
    </>
  );
}
