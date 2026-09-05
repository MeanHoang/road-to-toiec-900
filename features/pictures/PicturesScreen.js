'use client';

import { useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Notice } from '@/shared/ui/atoms/Notice';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { countLabelled, isRight, isWrong } from './grade';

/** Một ảnh + ô điền. Chỉ tô xanh/đỏ khi người học đã bấm "Kiểm tra". */
function PictureCell({ question, value, checked, onChange }) {
  const right = checked && isRight(question, value);
  const wrong = checked && isWrong(question, value);

  return (
    <div className="picture-cell">
      <img src={question.image} alt="" loading="lazy" />
      <Input
        className={right ? 'is-correct' : wrong ? 'is-wrong' : ''}
        placeholder="điền từ…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {wrong && (
        <span className="caption" style={{ textAlign: 'center' }}>
          → {question.answer}
        </span>
      )}
    </div>
  );
}

export function PicturesScreen({ slug, day }) {
  const { day: state, ready, setPicture } = useProgress(slug);
  const [tab, setTab] = useState(day.pictures[0].id);
  const [checked, setChecked] = useState(false);

  const set = day.pictures.find((s) => s.id === tab);
  const labelled = countLabelled(set);

  return (
    <>
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
        {set.questions.map((q) => (
          <PictureCell
            key={q.id}
            question={q}
            value={(ready && state.picture[q.id]) || ''}
            checked={checked}
            onChange={(value) => setPicture(q.id, value)}
          />
        ))}
      </div>

      <div className="row row-end" style={{ marginTop: 'var(--space-5)' }}>
        <Button variant="primary" disabled={labelled === 0} onClick={() => setChecked((c) => !c)}>
          {checked ? 'Ẩn đáp án' : 'Kiểm tra tất cả'}
        </Button>
      </div>
    </>
  );
}
