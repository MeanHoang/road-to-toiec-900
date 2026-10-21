'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useEffect, useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Notice } from '@/shared/ui/atoms/Notice';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { usePageSize } from '@/shared/ui/hooks/usePageSize';
import { Pagination } from '@/shared/ui/molecules/Pagination';
import { countLabelled, isRight, isWrong } from './grade';

/** Một ảnh + ô điền. Chỉ tô xanh/đỏ khi người học đã bấm "Kiểm tra". */
function PictureCell({ question, value, checked, onChange }) {
  const t = useTranslation();
  const right = checked && isRight(question, value);
  const wrong = checked && isWrong(question, value);

  return (
    <div className="picture-cell">
      <img src={question.image} alt="" loading="lazy" />
      <Input
        className={right ? 'is-correct' : wrong ? 'is-wrong' : ''}
        placeholder={t('enter a word…')}
        aria-label={`${t('Word')} ${question.no || question.id}`}
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
  const t = useTranslation();
  const { day: state, ready, setPicture } = useProgress(slug);
  const [tab, setTab] = useState(day.pictures[0].id);
  const [checked, setChecked] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = usePageSize(6, 4);

  useEffect(() => setPage(0), [pageSize]);

  const set = day.pictures.find((s) => s.id === tab);
  const labelled = countLabelled(set);

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title={t('Picture vocabulary')}
        subtitle={t('Look at each picture and enter the word. Practice clothes, prepositions of place, and locations.')}
      />

      <div className="row picture-tabs" style={{ marginBottom: 'var(--space-5)' }}>
        {day.pictures.map((s) => (
          <Button
            key={s.id}
            variant={tab === s.id ? 'primary' : 'quiet'}
            onClick={() => {
              setTab(s.id);
              setPage(0);
              setChecked(false);
            }}
          >
            {t(s.title)}
          </Button>
        ))}
      </div>

      {labelled === 0 && (
        <Notice style={{ marginBottom: 'var(--space-5)' }}>
          {t('No answer key is available. You can still type and save your answers.')}
        </Notice>
      )}

      <div className="quiz-head">
        <span>
          {t(set.title)} — {set.questions.length} {t('images')}
        </span>
        <Badge tone={labelled ? 'brand' : 'warning'}>
          {labelled} / {set.questions.length} {t('images with answer keys')}
        </Badge>
      </div>

      <div className="picture-grid">
        {set.questions.slice(page * pageSize, (page + 1) * pageSize).map((q) => (
          <PictureCell
            key={q.id}
            question={q}
            value={(ready && state.picture[q.id]) || ''}
            checked={checked}
            onChange={(value) => setPicture(q.id, value)}
          />
        ))}
      </div>

      <div className="row row-end picture-actions" style={{ marginTop: 'var(--space-5)' }}>
        <Pagination page={page} total={set.questions.length} pageSize={pageSize} onChange={setPage} />
        <Button variant="primary" disabled={labelled === 0} onClick={() => setChecked((c) => !c)}>
          {checked ? t('Hide answers') : t('Check all')}
        </Button>
      </div>
    </>
  );
}
