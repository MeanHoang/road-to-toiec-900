'use client';

import { lessonCrumbs } from '@/features/lesson/crumbs';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Callout } from '@/shared/ui/atoms/Callout';
import { Card } from '@/shared/ui/atoms/Card';
import { Section } from '@/shared/ui/atoms/Section';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { Speak } from '@/shared/ui/molecules/Speak';
import { TopBar } from '@/shared/ui/organisms/TopBar';
import { TheoryBlock } from './TheoryBlock';

function GrammarCard({ item, index }) {
  return (
    <Card>
      <Badge tone={item.voice === 'active' ? 'brand' : 'accent'} eyebrow>
        {item.voice === 'active' ? 'Chủ động' : 'Bị động'} {index + 1}
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
  return (
    <>
      <TopBar crumbs={lessonCrumbs(slug, day.title, 'Lý thuyết')} />

      <PageHeader eyebrow={day.title} title="Lý thuyết" subtitle={day.subtitle} />

      <Section
        title={`Grammar corner — ${day.grammar.length} cấu trúc`}
        lead="Ba cấu trúc chủ động, ba cấu trúc bị động. Bấm 🔊 để nghe ví dụ."
      >
        <div className="grid grid-2">
          {day.grammar.map((g, i) => (
            <GrammarCard key={g.id} item={g} index={i} />
          ))}
        </div>
      </Section>

      {day.theory.map((block) => (
        <TheoryBlock key={block.id} block={block} />
      ))}

      {day.has('translation') && (
        <Callout style={{ marginTop: 'var(--space-7)' }}>
          <p style={{ marginBottom: 'var(--space-3)' }}>
            Luyện phần này ở màn <strong>Bài tập ngữ pháp</strong> — {day.translation.length} câu
            gạch S / V / O rồi dịch.
          </p>
          <Button variant="primary" href={`/day/${slug}/grammar`}>
            Vào làm bài tập →
          </Button>
        </Callout>
      )}
    </>
  );
}
