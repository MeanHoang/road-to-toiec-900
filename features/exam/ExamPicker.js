'use client';

import { useLanguage, useTranslation } from '@/features/language/LanguageProvider';
// Chọn ĐỀ, rồi thi cả đề hoặc thi riêng một Part.
//
// Một đề TOEIC là 200 câu làm liền một mạch: Listening (Part 1-4) rồi vào
// thẳng Reading (Part 5-7). "Thi cả đề" chạy đúng như vậy.
//
// Vẫn cho thi riêng từng Part, vì đây là app luyện: ngồi đủ hai tiếng mỗi lần
// thì không ai luyện nổi, và người học thường yếu ở một Part cụ thể. Thi riêng
// vẫn giữ nguyên luật của Part đó.

import { useState } from 'react';
import { Select } from '@/shared/ui/atoms/Select';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { LearningArt } from '@/shared/ui/atoms/LearningArt';
import { Card } from '@/shared/ui/atoms/Card';
import { SECTIONS } from './rules';
import { clock } from './useExamRun';

export function ExamPicker({ papers, history, onStart }) {
  const t = useTranslation();
  const [selected, setSelected] = useState('');
  const paper = papers?.find((item) => item.id === selected) || papers?.[0];
  if (!papers?.length) {
    return <p className="caption">{t('No tests available yet.')}</p>;
  }

  return (
    <div className="exam-picker">
      {papers.length > 1 && <Select value={paper.id} onChange={(event) => setSelected(event.target.value)} aria-label={t('Practice test')}>{papers.map((item) => <option key={item.id} value={item.id}>{t(item.title)}</option>)}</Select>}
      <PaperCard paper={paper} history={history} onStart={onStart} />
    </div>
  );
}

/** Một đề: thi cả đề, hoặc thi riêng từng Part. */
function PaperCard({ paper, history, onStart }) {
  const t = useTranslation();
  return (
    <Card className="paper">
      <div className="paper-head">
        <div>
          <b className="paper-title">{t(paper.title)}</b>
          <p className="caption">
            {paper.total} {t('questions ·')} {clock(paper.seconds)}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => onStart(paper.id, null)}>
          {t('Take full test')}
        </Button>
      </div>

      <LastScore history={history} paperId={paper.id} only={null} />

      {SECTIONS.map((s) => {
        const parts = paper.parts.filter((p) => p.section === s.kind);
        if (!parts.length) return null;
        const count = parts.reduce((n, p) => n + p.count, 0);
        return (
          <div key={s.kind} className="paper-sections">
            <div className={`exam-group-art learning-tone-${s.kind === 'listening' ? 'lilac' : 'peach'}`}><LearningArt kind={s.kind === 'listening' ? 'headphones' : 'book'} /><span className="exam-group-title">{t(s.label)} · {count} {t('questions')}</span></div>
            {parts.map((p) => (
              <PartRow key={p.part} part={p} history={history} paperId={paper.id} onStart={onStart} />
            ))}
          </div>
        );
      })}
    </Card>
  );
}

/** Một Part của đề: thi riêng được. */
function PartRow({ part, history, paperId, onStart }) {
  const t = useTranslation();
  return (
    <div className="paper-section">
      <div className="paper-section-main">
        <div className="exam-row-head">
          <b>
            {t('Part {0} · {1}', [part.part, t(part.label)])}
          </b>
          <Badge>
            {part.count} {t('questions ·')} {clock(part.seconds)}
          </Badge>
        </div>
        <LastScore history={history} paperId={paperId} only={part.part} />
      </div>
      <Button size="sm" onClick={() => onStart(paperId, part.part)}>
        {t('Take this part')}
      </Button>
    </div>
  );
}

/** Điểm lần thi gần nhất của đúng bài này. Không có thì không hiện gì. */
function LastScore({ history, paperId, only }) {
  const t = useTranslation();
  const { dateLocale } = useLanguage();
  const last = (history || [])
    .filter((a) => a.paperId === paperId && (a.only ?? null) === only)
    .sort((a, b) => b.id.localeCompare(a.id))[0];
  if (!last) return null;

  const when = new Date(last.id);
  return (
    <p className="caption">
      {t('Last attempt:')} <b>{last.correct}/{last.total} {t('correct')}</b> ·{' '}
      {when.toLocaleDateString(dateLocale)} {when.toLocaleTimeString(dateLocale, { timeStyle: 'short' })}
    </p>
  );
}
