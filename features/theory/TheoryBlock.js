'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Callout } from '@/shared/ui/atoms/Callout';
import { Card } from '@/shared/ui/atoms/Card';
import { Notice } from '@/shared/ui/atoms/Notice';
import { Section } from '@/shared/ui/atoms/Section';
import { englishLabel } from '@/shared/lib/englishLabels';

/**
 * Khối lý thuyết không đồng dạng — có khối là danh sách, có khối là bảng cặp đối lập,
 * có khối là so sánh hai ảnh. Mỗi khối mang `type`, ở đây chọn cách vẽ theo type.
 * Buổi sau có kiểu khối mới thì thêm một nhánh, không phải đập lại cấu trúc.
 */
export function TheoryBlock({ block }) {
  const t = useTranslation();
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
    case 'table':
      return <TableBlock block={block} />;
    default:
      // Buổi mới có type chưa hỗ trợ thì nói thẳng, đừng render ra khoảng trắng im lặng.
      return (
        <Notice style={{ marginTop: 'var(--space-5)' }}>
          {t('⚠️ Theory block type')} <code>{block.type}</code> {t('is not supported yet.')}
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

/**
 * Khối bảng: bảng thì, công thức bị động, cách trả lời từng loại câu hỏi…
 * `columns` là tiêu đề cột, `rows` là mảng các dòng `{ cells: [...] }`, mỗi
 * dòng cùng số ô với `columns`. Ô có xuống dòng (\n) thì giữ nguyên xuống dòng.
 *
 * Dòng phải bọc trong object chứ không để mảng trần: Firestore không lưu được
 * mảng nằm trong mảng ("Property array contains an invalid nested entity").
 */
function TableBlock({ block }) {
  const t = useTranslation();
  return (
    <Section title={block.title} lead={block.note}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {block.columns.map((col) => (
                <th key={col}>{t(englishLabel(col))}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.cells.map((cell, j) => (
                  <td key={j} style={{ whiteSpace: 'pre-line', lineHeight: 'var(--leading-snug)' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function AspectsBlock({ block }) {
  const t = useTranslation();
  return (
    <Section
      title={block.title}
      lead={t('Scan these four details in each picture before listening.')}
    >
      <div className="grid grid-2">
        {block.items.map((a, i) => (
          <Card key={a.id}>
            <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
              <Badge tone="brand" eyebrow>
                {i + 1}. {t(englishLabel(a.title))}
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
  const t = useTranslation();
  return (
    <Section title={t('{0} — opposite pairs', [t(block.title)])} lead={block.note}>
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
          {t('Without an opposite:')} {block.singles.join(' · ')}
        </p>
      </Card>
    </Section>
  );
}

function WordGroupsBlock({ block }) {
  const t = useTranslation();
  return (
    <Section title={block.title}>
      <div className="grid grid-3">
        {Object.entries(block.groups).map(([group, words]) => (
          <Card key={group}>
            <Badge tone="accent" eyebrow>
              {t(englishLabel(group))}
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
  const t = useTranslation();
  return (
    <Section title={t('Compare {0} vs {1}', [block.left.word, block.right.word])}>
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
