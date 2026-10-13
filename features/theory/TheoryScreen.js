'use client';

import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Callout } from '@/shared/ui/atoms/Callout';
import { Card } from '@/shared/ui/atoms/Card';
import { Section } from '@/shared/ui/atoms/Section';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { Speak } from '@/shared/ui/molecules/Speak';
import { TheoryBlock } from './TheoryBlock';

function GrammarCard({ item, index }) {
  return (
    <Card>
      <Badge tone={item.voice === 'active' ? 'brand' : 'accent'} eyebrow>
        {item.voice === 'active' ? 'Active voice' : 'Passive voice'} {index + 1}
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
      <PageHeader eyebrow={day.title} title="Theory" subtitle={day.subtitle} />

      {day.grammar.length > 0 && (
        <Section
          title={`Grammar corner — ${day.grammar.length} structures`}
          lead="Click 🔊 to hear the example."
        >
          <div className="grid grid-2">
            {day.grammar.map((g, i) => (
              <GrammarCard key={g.id} item={g} index={i} />
            ))}
          </div>
        </Section>
      )}

      {day.theory.map((block) => (
        <TheoryBlock key={block.id} block={block} />
      ))}

      {day.has('translation') && (
        <Callout style={{ marginTop: 'var(--space-7)' }}>
          <p style={{ marginBottom: 'var(--space-3)' }}>
            Practice in <strong>Grammar exercises</strong> — {day.translation.length} sentences to label S / V / O and translate.
          </p>
          <Button variant="primary" href={`/day/${slug}/grammar`}>
            Start exercises →
          </Button>
        </Callout>
      )}
    </>
  );
}
