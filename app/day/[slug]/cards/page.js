'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useProgress } from '@/lib/progress';
import { Badge, Button, Card, Progress } from '@/components/primitives';
import { TopBar, PageHeader, Speak } from '@/components/patterns';
import { DayGate } from '@/components/DayGate';

function CardsScreen({ slug, day }) {
  const { day: state, ready, setVocab, resetVocab } = useProgress(slug);
  const [flipped, setFlipped] = useState(false);
  const [cursor, setCursor] = useState(0);

  // Bộ thẻ của phiên này: từ nào chưa đánh dấu "known" thì còn phải học.
  const deck = useMemo(
    () => day.vocabulary.filter((v) => state.vocab[v.id] !== 'known'),
    [day.vocabulary, state.vocab],
  );

  const total = day.vocabulary.length;
  const known = total - deck.length;
  const card = deck[cursor % Math.max(deck.length, 1)];

  const mark = useCallback(
    (status) => {
      if (!card) return;
      setFlipped(false);
      // Đánh dấu "known" thì thẻ biến khỏi deck, giữ nguyên cursor là đã sang thẻ kế tiếp.
      setVocab(card.id, status);
      if (status !== 'known') setCursor((c) => c + 1);
    },
    [card, setVocab],
  );

  // Phím tắt — kéo chuột trên máy tính rất khó chịu.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') mark('unknown');
      else if (e.key === 'ArrowRight') mark('known');
      else if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mark]);

  const crumbs = [
    { label: 'Trang chủ', href: '/' },
    { label: day.title, href: `/day/${slug}` },
    { label: 'Thẻ từ vựng' },
  ];

  if (!ready) return <TopBar crumbs={crumbs} />;

  return (
    <>
      <TopBar crumbs={crumbs} />

      <PageHeader
        eyebrow={day.title}
        title="Thẻ từ vựng"
        subtitle="Mặt trước chỉ có từ và IPA — phải tự nhớ nghĩa. Ảnh nằm ở mặt sau, để mặt trước là lộ đáp án."
      >
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Progress percent={(known / total) * 100} label={`${known} / ${total} đã biết`} />
        </div>
        <p className="caption" style={{ marginTop: 'var(--space-3)' }}>
          <kbd>Space</kbd> lật · <kbd>←</kbd> chưa thuộc · <kbd>→</kbd> đã biết
        </p>
      </PageHeader>

      {deck.length === 0 ? (
        <Card className="stack" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: 'var(--text-4xl)' }}>🎉</div>
          <h3>Đã đi hết {total} từ</h3>
          <p className="section-lead" style={{ margin: '0 auto' }}>
            Thẻ &ldquo;đã biết&rdquo; chỉ bị ẩn chứ không xoá — trí nhớ có phai, nên ôn lại được.
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="primary" onClick={resetVocab}>
              ↺ Học lại tất cả
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flashcard-stage">
          <div
            className={`flashcard ${flipped ? 'is-flipped' : ''}`}
            onClick={(e) => {
              if (!e.target.closest('.icon-btn')) setFlipped((f) => !f);
            }}
          >
            <div className="flashcard-inner">
              <div className="flashcard-face">
                <Badge eyebrow>{card.group}</Badge>
                <div className="word">{card.word}</div>
                {/* Mỗi giọng một dòng, nhãn và phiên âm thẳng cột nhau. Trước đây
                    cả bốn thứ nằm trong một flex-wrap nên khi hết chỗ nó ngắt bừa,
                    nút loa Anh rơi xuống nằm cạnh phiên âm Mỹ. */}
                <div className="ipa-row">
                  {card.ipa.uk && (
                    <div className="ipa-line">
                      <span className="ipa-label">UK</span>
                      <span className="ipa">{card.ipa.uk}</span>
                      <Speak text={card.word} lang="en-GB" label={`Đọc ${card.word} giọng Anh`} />
                    </div>
                  )}
                  {card.ipa.us && (
                    <div className="ipa-line">
                      <span className="ipa-label">US</span>
                      <span className="ipa">{card.ipa.us}</span>
                      <Speak text={card.word} lang="en-US" label={`Đọc ${card.word} giọng Mỹ`} />
                    </div>
                  )}
                </div>
                <div className="hint">tự nhớ nghĩa trước · bấm để lật</div>
              </div>

              <div className="flashcard-face back">
                {card.image && <img src={card.image} alt="" />}
                <Badge>{card.pos}</Badge>
                <div className="meaning">{card.meaningVi}</div>
                {card.example && <div className="example-vi">{card.example.en}</div>}
              </div>
            </div>
          </div>

          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="danger" onClick={() => mark('unknown')}>
              ← Chưa thuộc
            </Button>
            <Button variant="success" onClick={() => mark('known')}>
              Đã biết →
            </Button>
          </div>

          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="quiet" size="sm" onClick={resetVocab}>
              ↺ Học lại tất cả
            </Button>
            <span className="caption">Thẻ &ldquo;đã biết&rdquo; chỉ bị ẩn, không xoá vĩnh viễn</span>
          </div>
        </div>
      )}
    </>
  );
}

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} crumbLabel={'Thẻ từ vựng'}>
      {(day) => <CardsScreen slug={slug} day={day} />}
    </DayGate>
  );
}
