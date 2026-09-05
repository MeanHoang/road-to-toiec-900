'use client';

import { use, useState } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Notice } from '@/shared/ui/atoms/Notice';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { TopBar } from '@/shared/ui/organisms/TopBar';

const norm = (s) => (s || '').trim().toLowerCase();

function PicturesScreen({ slug, day }) {
  const { day: state, ready, setPicture } = useProgress(slug);
  const [tab, setTab] = useState(day.pictures[0].id);
  const [checked, setChecked] = useState(false);

  const set = day.pictures.find((s) => s.id === tab);
  const labelled = set.questions.filter((q) => q.answer).length;

  /** Đúng nếu khớp `answer` hoặc bất kỳ cách viết nào trong `accept`. */
  const isRight = (q, value) =>
    q.answer && [q.answer, ...(q.accept || [])].some((a) => norm(a) === norm(value));

  return (
    <>
      <TopBar
        crumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: day.title, href: `/day/${slug}` },
          { label: 'Từ vựng qua hình' },
        ]}
      />

      <PageHeader
        eyebrow={day.title}
        title="Từ vựng qua hình"
        subtitle="Nhìn hình điền từ. Ba nhóm khớp thẳng với phần lý thuyết: quần áo, giới từ vị trí, địa điểm."
      />

      <div className="row" style={{ marginBottom: 'var(--space-5)' }}>
        {day.pictures.map((s) => (
          <Button
            key={s.id}
            variant={tab === s.id ? 'primary' : 'quiet'}
            onClick={() => {
              setTab(s.id);
              setChecked(false);
            }}
          >
            {s.icon} {s.title}
          </Button>
        ))}
      </div>

      {labelled === 0 && (
        <Notice style={{ marginBottom: 'var(--space-5)' }}>
          ⚠️ Nhóm này chưa được gán đáp án — cần điền <code>answer</code> trong{' '}
          <code>content/{slug}/pictures.json</code>. Vẫn gõ và lưu được, chỉ chưa chấm được.
        </Notice>
      )}

      <div className="quiz-head">
        <span>
          {set.title} — {set.questions.length} ảnh
        </span>
        <Badge tone={labelled ? 'brand' : 'warning'}>
          {labelled} / {set.questions.length} ảnh có đáp án
        </Badge>
      </div>

      <div className="picture-grid">
        {set.questions.map((q) => {
          const value = ready ? state.picture[q.id] || '' : '';
          const right = checked && isRight(q, value);
          const wrong = checked && q.answer && value && !right;

          return (
            <div className="picture-cell" key={q.id}>
              <img src={q.image} alt="" loading="lazy" />
              <Input
                className={right ? 'is-correct' : wrong ? 'is-wrong' : ''}
                placeholder="điền từ…"
                value={value}
                onChange={(e) => setPicture(q.id, e.target.value)}
              />
              {wrong && <span className="caption" style={{ textAlign: 'center' }}>→ {q.answer}</span>}
            </div>
          );
        })}
      </div>

      <div className="row row-end" style={{ marginTop: 'var(--space-5)' }}>
        <Button variant="primary" disabled={labelled === 0} onClick={() => setChecked((c) => !c)}>
          {checked ? 'Ẩn đáp án' : 'Kiểm tra tất cả'}
        </Button>
      </div>
    </>
  );
}

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} crumbLabel={'Từ vựng qua hình'}>
      {(day) => <PicturesScreen slug={slug} day={day} />}
    </DayGate>
  );
}
