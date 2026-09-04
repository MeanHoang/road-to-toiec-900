'use client';

import { use, useMemo, useState } from 'react';
import { useProgress } from '@/lib/progress';
import { Badge, Button, Input, StarToggle } from '@/components/primitives';
import { TopBar, PageHeader, Speak, CopyUnknown } from '@/components/patterns';
import { DayGate } from '@/components/DayGate';

// 'star' nằm ngoài trục chưa học / đã biết, cố ý: từ gắn sao thường CHÍNH LÀ từ
// đã đánh dấu "đã biết" — nhớ nghĩa rồi nhưng nhìn mặt chữ vẫn ngờ ngợ.
const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unknown', label: 'Chưa học' },
  { key: 'known', label: 'Đã biết' },
  { key: 'star', label: '★ Gắn sao' },
];

function VocabTableScreen({ slug, day }) {
  const { day: state, ready, setVocab, setStar } = useProgress(slug);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return day.vocabulary.filter((v) => {
      const status = state.vocab[v.id] === 'known' ? 'known' : 'unknown';
      if (filter === 'star') {
        if (!state.star[v.id]) return false;
      } else if (filter !== 'all' && filter !== status) return false;
      if (!needle) return true;
      return (
        v.word.toLowerCase().includes(needle) ||
        v.meaningVi.toLowerCase().includes(needle) ||
        (v.ipa.uk || '').includes(needle) ||
        (v.ipa.us || '').includes(needle)
      );
    });
  }, [day.vocabulary, state.vocab, state.star, query, filter]);

  const starCount = useMemo(
    () => day.vocabulary.filter((v) => ready && state.star[v.id]).length,
    [day.vocabulary, state.star, ready],
  );

  return (
    <>
      <TopBar
        crumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: day.title, href: `/day/${slug}` },
          { label: 'Bảng từ vựng' },
        ]}
      />

      <PageHeader
        eyebrow={day.title}
        title="Bảng từ vựng"
        subtitle={`${day.vocabulary.length} từ · tra theo từ, nghĩa hoặc IPA`}
      >
        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          <CopyUnknown
            daySlug={slug}
            words={day.vocabulary.filter((v) => ready && state.vocab[v.id] !== 'known')}
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
              const known = ready && state.vocab[v.id] === 'known';
              const starred = ready && Boolean(state.star[v.id]);
              return (
                <tr key={v.id} className={starred ? 'is-starred' : ''}>
                  <td className="col-star">
                    <StarToggle
                      on={starred}
                      onClick={() => setStar(v.id, !starred)}
                      label={starred ? `Bỏ sao ${v.word}` : `Gắn sao ${v.word}`}
                    />
                  </td>
                  <td className="caption">{v.no}</td>
                  <td>
                    <strong>{v.word}</strong>
                    <br />
                    <span className="caption">{v.pos}</span>
                  </td>
                  <td className="ipa">{v.ipa.uk}</td>
                  <td className="ipa">{v.ipa.us}</td>
                  <td>{v.meaningVi}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setVocab(v.id, known ? 'unknown' : 'known')}
                      style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
                      aria-label={`Đánh dấu ${v.word} là ${known ? 'chưa học' : 'đã biết'}`}
                    >
                      <Badge tone={known ? 'success' : 'warning'}>
                        {known ? 'đã biết' : 'chưa học'}
                      </Badge>
                    </button>
                  </td>
                  <td>
                    <Speak text={v.word} />
                  </td>
                </tr>
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

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} crumbLabel={'Bảng từ vựng'}>
      {(day) => <VocabTableScreen slug={slug} day={day} />}
    </DayGate>
  );
}
