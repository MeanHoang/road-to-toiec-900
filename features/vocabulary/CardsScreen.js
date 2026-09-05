'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Progress } from '@/shared/ui/atoms/Progress';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { LessonSkeleton } from '@/features/lesson/LessonSkeleton';
import { Flashcard } from './Flashcard';
import { notKnownYet } from './filters';

export function CardsScreen({ slug, day }) {
  const { day: state, ready, setVocab, setStar, resetVocab } = useProgress(slug);
  const [flipped, setFlipped] = useState(false);
  const [cursor, setCursor] = useState(0);

  // Bộ thẻ của phiên này: từ nào chưa đánh dấu "known" thì còn phải học.
  const deck = useMemo(
    () => notKnownYet(day.vocabulary, state.vocab),
    [day.vocabulary, state.vocab],
  );

  const total = day.vocabulary.length;
  const known = total - deck.length;
  const card = deck[cursor % Math.max(deck.length, 1)];
  const starred = Boolean(card && state.star[card.id]);

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

  const toggleStar = useCallback(() => {
    if (card) setStar(card.id, !state.star[card.id]);
  }, [card, state.star, setStar]);

  // Phím tắt — kéo chuột trên máy tính rất khó chịu.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') mark('unknown');
      else if (e.key === 'ArrowRight') mark('known');
      else if (e.key === 's' || e.key === 'S') toggleStar();
      else if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mark, toggleStar]);

  if (!ready) {
    return <LessonSkeleton blocks={1} />;
  }

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title="Thẻ từ vựng"
        subtitle="Mặt trước chỉ có từ và IPA — phải tự nhớ nghĩa. Ảnh nằm ở mặt sau, để mặt trước là lộ đáp án."
      >
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Progress percent={(known / total) * 100} label={`${known} / ${total} đã biết`} />
        </div>
        <p className="caption" style={{ marginTop: 'var(--space-3)' }}>
          <kbd>Space</kbd> lật · <kbd>←</kbd> chưa thuộc · <kbd>→</kbd> đã biết · <kbd>S</kbd> gắn
          sao
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
          <Flashcard
            card={card}
            flipped={flipped}
            starred={starred}
            onFlip={() => setFlipped((f) => !f)}
            onToggleStar={toggleStar}
          />

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
            <span className="caption">
              Thẻ &ldquo;đã biết&rdquo; chỉ bị ẩn, không xoá vĩnh viễn. Gắn ★ cho từ hay quên mặt
              chữ rồi lọc lại ở <Link href={`/day/${slug}/vocab`}>bảng từ vựng</Link>.
            </span>
          </div>
        </div>
      )}
    </>
  );
}
