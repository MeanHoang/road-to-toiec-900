'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/shared/ui/atoms/Select';
import { useTranslation } from '@/features/language/LanguageProvider';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { Speak } from '@/shared/ui/molecules/Speak';
import { TheoryBlock } from './TheoryBlock';

function GrammarCard({ item, index }) {
  const t = useTranslation();
  return (
    <Card>
      <Badge tone={item.voice === 'active' ? 'brand' : 'accent'} eyebrow>
        {item.voice === 'active' ? t('Active voice') : t('Passive voice')} {index + 1}
      </Badge>
      <p className="section-lead" style={{ margin: 'var(--space-2) 0 0' }}>
        {item.name} ({item.nameVi})
      </p>
      <div className="formula">{item.formula}</div>
      <div className="example">
        <Speak text={item.example.en} />
        <span>
          <span className="example-en">{item.example.en}</span>
          <br />
          <span className="example-vi">{item.example.vi}</span>
        </span>
      </div>
    </Card>
  );
}

export function TheoryScreen({ slug, day }) {
  const t = useTranslation();
  const [chapter, setChapter] = useState(0);
  useEffect(() => setChapter(0), [slug]);
  const chapters = [
    ...day.grammar.map((item, index) => ({ id: item.id, title: `${item.name} · ${item.nameVi}`, content: <GrammarCard item={item} index={index} /> })),
    ...day.theory.map((block) => ({ id: block.id, title: t(block.title), content: <TheoryBlock block={block} /> })),
  ];
  return (
    <>
      <PageHeader eyebrow={day.title} title={t('Theory')} subtitle={day.subtitle} />
      <div className="theory-workspace">
        <nav className="theory-chapters" aria-label={t('Theory')}>
          {chapters.map((item, i) => <button type="button" key={item.id} aria-current={i === chapter ? 'step' : undefined} onClick={() => setChapter(i)}><span>{String(i + 1).padStart(2, '0')}</span>{item.title}</button>)}
        </nav>
        <div className="theory-mobile-select"><Select value={chapter} onChange={(event) => setChapter(Number(event.target.value))} aria-label={t('Theory')}>{chapters.map((item, i) => <option key={item.id} value={i}>{i + 1}. {item.title}</option>)}</Select></div>
        <div className="theory-reading" key={chapter} role="region" tabIndex={0} aria-label={t('Theory')}>{chapters[chapter]?.content}</div>
      </div>
      <div className="pagination">
        <Button size="sm" disabled={chapter === 0} onClick={() => setChapter(chapter - 1)}>{t('Previous page')}</Button>
        <span className="caption">{chapter + 1} / {chapters.length}</span>
        {chapter + 1 < chapters.length ? <Button size="sm" onClick={() => setChapter(chapter + 1)}>{t('Next page')}</Button> : day.has('translation') ? <Button href={`/day/${slug}/grammar`}>{t('Start exercises →')}</Button> : <Button size="sm" disabled>{t('Next page')}</Button>}
      </div>
    </>
  );
}
