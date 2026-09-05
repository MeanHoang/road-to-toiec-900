'use client';

import { useCallback, useEffect, useState } from 'react';
import { lessonCrumbs } from '@/features/lesson/crumbs';
import { useProgress } from '@/features/progress/useProgress';
import { Card } from '@/shared/ui/atoms/Card';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { TopBar } from '@/shared/ui/organisms/TopBar';
import { ROUND, buildRound } from './buildRound';
import { GameResult } from './GameResult';
import { QuestionCard } from './QuestionCard';

/** Trạng thái một lượt chơi. Gom vào một hook để màn hình chỉ còn phần bày biện. */
function useGameRound(day, onMiss) {
  const [round, setRound] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [missed, setMissed] = useState([]);

  const start = useCallback(() => {
    setRound(buildRound(day.vocabulary, day.quiz));
    setIdx(0);
    setPicked(null);
    setScore({ right: 0, wrong: 0 });
    setMissed([]);
  }, [day.vocabulary, day.quiz]);

  const question = round[idx];

  const pick = (option) => {
    if (picked || !question) return;
    setPicked(option);

    const right = option.id === question.word.id;
    setScore((s) => ({ right: s.right + (right ? 1 : 0), wrong: s.wrong + (right ? 0 : 1) }));
    if (right) return;

    onMiss(question.word);
    setMissed((m) => (m.some((w) => w.id === question.word.id) ? m : [...m, question.word]));
  };

  const next = () => {
    setPicked(null);
    setIdx((i) => i + 1);
  };

  return {
    round,
    idx,
    question,
    picked,
    score,
    missed,
    finished: round.length > 0 && idx >= round.length,
    start,
    pick,
    next,
  };
}

export function GameScreen({ slug, day }) {
  const { ready, setVocab } = useProgress(slug);

  // Sai thì đẩy từ về nhóm chưa học — thẻ từ vựng hiện lại ngay.
  const game = useGameRound(day, (word) => setVocab(word.id, 'unknown'));

  // Câu hỏi sinh ngẫu nhiên nên chỉ dựng được ở client, không render trên server.
  useEffect(() => {
    if (ready && game.round.length === 0) game.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const crumbs = lessonCrumbs(slug, day.title, 'Game từ vựng');
  if (!ready) return <TopBar crumbs={crumbs} />;

  return (
    <>
      <TopBar crumbs={crumbs} />

      <PageHeader
        eyebrow={day.title}
        title="Game từ vựng"
        subtitle={`${ROUND} câu mỗi lượt · trộn cả hai chiều Anh ↔ Việt · đáp án nhiễu bốc từ chính ${day.vocabulary.length} từ của buổi học`}
      />

      {game.finished ? (
        <GameResult
          score={game.score}
          total={game.round.length}
          missed={game.missed}
          onReplay={game.start}
        />
      ) : game.question ? (
        <QuestionCard
          question={game.question}
          index={game.idx}
          total={game.round.length}
          score={game.score}
          picked={game.picked}
          onPick={game.pick}
          onNext={game.next}
        />
      ) : (
        <Card>Đang tạo câu hỏi…</Card>
      )}
    </>
  );
}
