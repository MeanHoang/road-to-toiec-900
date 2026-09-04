'use client';

import { use } from 'react';
import { Badge, Button, Callout, Card, Notice, Section } from '@/components/primitives';
import { TopBar, PageHeader, Speak } from '@/components/patterns';
import { DayGate } from '@/components/DayGate';

/**
 * Khối lý thuyết không đồng dạng — có khối là danh sách, có khối là bảng cặp đối lập,
 * có khối là so sánh hai ảnh. Mỗi khối mang `type`, ở đây chọn cách vẽ theo type.
 * Buổi sau có kiểu khối mới thì thêm một nhánh, không phải đập lại cấu trúc.
 */
function TheoryBlock({ block }) {
  switch (block.type) {
    case 'aspects':
      return (
        <Section
          title={block.title}
          lead="Nhìn tranh là quét lần lượt bốn thứ này, đừng nghe tới đâu đoán tới đó."
        >
          <div className="grid grid-2">
            {block.items.map((a, i) => (
              <Card key={a.id}>
                <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
                  <Badge tone="brand" eyebrow>
                    {i + 1}. {a.title}
                  </Badge>
                  <span className="caption" style={{ fontStyle: 'italic' }}>
                    {a.en}
                  </span>
                </div>
                <div className="stack" style={{ gap: 'var(--space-2)' }}>
                  {a.lines.map((line, j) => (
                    <p key={j} style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-snug)' }}>
                      {line}
                    </p>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Section>
      );

    case 'pairs':
      return (
        <Section title={`${block.title} — dạng cặp đối lập`} lead={block.note}>
          <Card>
            <div className="pair-list">
              {block.pairs.map((pair) => (
                <div className="pair" key={pair.left}>
                  <span>{pair.left}</span>
                  <em aria-hidden="true">↔</em>
                  <span>{pair.right}</span>
                </div>
              ))}
            </div>
            <p className="caption" style={{ marginTop: 'var(--space-4)' }}>
              Không có cặp đối: {block.singles.join(' · ')}
            </p>
          </Card>
        </Section>
      );

    case 'wordGroups':
      return (
        <Section title={block.title}>
          <div className="grid grid-3">
            {Object.entries(block.groups).map(([group, words]) => (
              <Card key={group}>
                <Badge tone="accent" eyebrow>
                  {group}
                </Badge>
                <p style={{ marginTop: 'var(--space-3)' }}>
                  {words.map((word) => (
                    <span className="chip" key={word}>
                      {word}
                    </span>
                  ))}
                </p>
              </Card>
            ))}
          </div>
        </Section>
      );

    case 'compare':
      return (
        <Section title={`Phân biệt ${block.left.word} vs ${block.right.word}`}>
          <Card>
            <div className="compare">
              {[block.left, block.right].map((side) => (
                <figure key={side.word}>
                  <img src={side.image} alt={side.word} />
                  <figcaption>
                    <strong style={{ color: 'var(--text)' }}>{side.word}</strong> — {side.vi}
                    <br />
                    <em>&ldquo;{side.gloss}&rdquo;</em>
                    <br />
                    <span className="example-en" style={{ color: 'var(--text)' }}>
                      {side.example.en}
                    </span>
                    <br />
                    {side.example.vi}
                  </figcaption>
                </figure>
              ))}
            </div>
            {block.note && <Callout style={{ marginTop: 'var(--space-4)' }}>{block.note}</Callout>}
          </Card>
        </Section>
      );

    default:
      // Buổi mới có type chưa hỗ trợ thì nói thẳng, đừng render ra khoảng trắng im lặng.
      return (
        <Notice style={{ marginTop: 'var(--space-5)' }}>
          ⚠️ Khối lý thuyết kiểu <code>{block.type}</code> chưa có cách hiển thị.
        </Notice>
      );
  }
}

function TheoryScreen({ slug, day }) {
  return (
    <>
      <TopBar
        crumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: day.title, href: `/day/${slug}` },
          { label: 'Lý thuyết' },
        ]}
      />

      <PageHeader eyebrow={day.title} title="Lý thuyết" subtitle={day.subtitle} />

      <Section
        title={`Grammar corner — ${day.grammar.length} cấu trúc`}
        lead="Ba cấu trúc chủ động, ba cấu trúc bị động. Bấm 🔊 để nghe ví dụ."
      >
        <div className="grid grid-2">
          {day.grammar.map((g, i) => (
            <Card key={g.id}>
              <Badge tone={g.voice === 'active' ? 'brand' : 'accent'} eyebrow>
                {g.voice === 'active' ? 'Chủ động' : 'Bị động'} {i + 1}
              </Badge>
              <p className="section-lead" style={{ margin: 'var(--space-2) 0 0' }}>
                {g.name} ({g.nameVi})
              </p>
              <div className="formula">{g.formula}</div>
              <div className="example">
                <Speak text={g.example.en} />
                <span>
                  <span className="example-en">{g.example.en}</span>
                  <br />
                  <span className="example-vi">{g.example.vi}</span>
                </span>
              </div>
            </Card>
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

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} crumbLabel={'Lý thuyết'}>
      {(day) => <TheoryScreen slug={slug} day={day} />}
    </DayGate>
  );
}
