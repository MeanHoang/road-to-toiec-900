'use client';

import { Badge } from '@/shared/ui/atoms/Badge';
import { Callout } from '@/shared/ui/atoms/Callout';
import { Card } from '@/shared/ui/atoms/Card';
import { Notice } from '@/shared/ui/atoms/Notice';
import { Section } from '@/shared/ui/atoms/Section';

/**
 * Khối lý thuyết không đồng dạng — có khối là danh sách, có khối là bảng cặp đối lập,
 * có khối là so sánh hai ảnh. Mỗi khối mang `type`, ở đây chọn cách vẽ theo type.
 * Buổi sau có kiểu khối mới thì thêm một nhánh, không phải đập lại cấu trúc.
 */
export function TheoryBlock({ block }) {
  switch (block.type) {
    case 'aspects':
      return <AspectsBlock block={block} />;
    case 'notes':
      return <NotesBlock block={block} />;
    case 'pairs':
      return <PairsBlock block={block} />;
    case 'wordGroups':
      return <WordGroupsBlock block={block} />;
    case 'compare':
      return <CompareBlock block={block} />;
    default:
      // Buổi mới có type chưa hỗ trợ thì nói thẳng, đừng render ra khoảng trắng im lặng.
      return (
        <Notice style={{ marginTop: 'var(--space-5)' }}>
          ⚠️ Khối lý thuyết kiểu <code>{block.type}</code> chưa có cách hiển thị.
        </Notice>
      );
  }
}

/** Khối ghi chú thuần chữ: vài ý cần nhớ về một loại tranh. */
function NotesBlock({ block }) {
  return (
    <Section title={block.title}>
      <Card>
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          {block.lines.map((line, i) => (
            <p key={i} style={{ lineHeight: 'var(--leading-snug)' }}>
              {line}
            </p>
          ))}
        </div>
      </Card>
    </Section>
  );
}

function AspectsBlock({ block }) {
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
}

function PairsBlock({ block }) {
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
}

function WordGroupsBlock({ block }) {
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
}

function CompareBlock({ block }) {
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
}
