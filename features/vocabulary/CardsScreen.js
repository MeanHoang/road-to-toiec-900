'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Progress } from '@/shared/ui/atoms/Progress';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { LessonSkeleton } from '@/features/lesson/LessonSkeleton';
import { Flashcard } from './Flashcard';
import { SwipeFlashcard } from './SwipeFlashcard';
import { notKnownYet } from './filters';

export function CardsScreen({ slug, day }) {
  const t = useTranslation();
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
      if (e.target.closest?.('input, textarea, select, button, a, [contenteditable="true"]')) return;
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
        title={t('Flashcards')}
        subtitle={t('Recall the meaning from the word and IPA on the front. Flip to see the meaning and image.')}
      >
        <div style={{ marginTop: 'var(--space-5)' }}>
          <Progress percent={(known / total) * 100} label={t('{0} / {1} Known', [known, total])} />
        </div>
        <p className="caption flashcard-keyboard-hint" style={{ marginTop: 'var(--space-3)' }}>
          <kbd>Space</kbd> {t('flip ·')} <kbd>←</kbd> {t('To learn ·')} <kbd>→</kbd> {t('Known ·')} <kbd>S</kbd> {t('star')}
        </p>
      </PageHeader>

      {deck.length === 0 ? (
        <Card className="stack" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: 'var(--text-4xl)' }}>🎉</div>
          <h3>{t('You have reviewed all')} {total} {t('words')}</h3>
          <p className="section-lead" style={{ margin: '0 auto' }}>
            {t('Known cards are hidden, so you can bring them back for review later.')}
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="primary" onClick={resetVocab}>
              {t('↺ Review all words')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flashcard-stage">
          <p className="caption flashcard-touch-hint">{t('Swipe left to keep learning · right for known')}</p>
          <SwipeFlashcard cardId={card.id} onMark={mark}>
            <Flashcard
              card={card}
              flipped={flipped}
              starred={starred}
              onFlip={() => setFlipped((f) => !f)}
              onToggleStar={toggleStar}
            />
          </SwipeFlashcard>

          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="danger" onClick={() => mark('unknown')}>
              {t('← Still learning')}
            </Button>
            <Button variant="success" onClick={() => mark('known')}>
              {t('Known →')}
            </Button>
          </div>

          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="quiet" size="sm" onClick={resetVocab}>
              {t('↺ Review all words')}
            </Button>
            <span className="caption">
              {t('Known cards are hidden. Star words you want to review, then find them in the')} <Link href={`/day/${slug}/vocab`}>{t('vocabulary list')}</Link>.
            </span>
          </div>
        </div>
      )}
    </>
  );
}
