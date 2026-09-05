'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Progress } from '@/shared/ui/atoms/Progress';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { Speak } from '@/shared/ui/molecules/Speak';
import { TopBar } from '@/shared/ui/organisms/TopBar';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUND = 20;

/**
 * Một lượt = 20 câu bốc từ kho gồm cả hai chiều Anh→Việt và Việt→Anh trộn lẫn,
 * nên không đoán trước được câu sau hỏi chiều nào.
 *
 * Đáp án nhiễu bốc từ chính bộ từ vựng của buổi — luôn đúng nghĩa, không bịa.
 * Nếu có `quiz.json` (ngân hàng câu hỏi do skill toeic-quiz sinh) thì trộn thêm
 * câu dạng điền vào câu ví dụ.
 */
function buildRound(vocab, bank) {
  const questions = vocab.flatMap((word) => {
    const distractors = () => shuffle(vocab.filter((v) => v.id !== word.id)).slice(0, 3);
    return [
      {
        key: `${word.id}-en-vi`,
        word,
        dir: 'en-vi',
        prompt: word.word,
        sub: [word.ipa.uk, word.ipa.us !== word.ipa.uk ? word.ipa.us : null]
          .filter(Boolean)
          .join(' · '),
        options: shuffle([word, ...distractors()]),
        label: (v) => v.meaningVi,
      },
      {
        key: `${word.id}-vi-en`,
        word,
        dir: 'vi-en',
        prompt: word.meaningVi,
        sub: null,
        options: shuffle([word, ...distractors()]),
        label: (v) => v.word,
      },
    ];
  });

  // Câu từ ngân hàng: điền từ vào chỗ trống trong câu ví dụ.
  const extra = (bank || [])
    .filter((q) => vocab.some((v) => v.id === q.wordId))
    .map((q) => {
      const word = vocab.find((v) => v.id === q.wordId);
      return {
        key: q.id,
        word,
        dir: 'cloze',
        prompt: q.sentence,
        sub: q.hintVi || null,
        options: shuffle([word, ...shuffle(vocab.filter((v) => v.id !== word.id)).slice(0, 3)]),
        label: (v) => v.word,
      };
    });

  return shuffle([...questions, ...extra]).slice(0, ROUND);
}

const DIR_LABEL = {
  'en-vi': 'Anh → Việt',
  'vi-en': 'Việt → Anh',
  cloze: 'Điền vào câu',
};

function GameScreen({ slug, day }) {
  const { day: state, ready, setVocab } = useProgress(slug);
  const [round, setRound] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [missed, setMissed] = useState([]);

  const start = useCallback(
    () => {
      setRound(buildRound(day.vocabulary, day.quiz));
      setIdx(0);
      setPicked(null);
      setScore({ right: 0, wrong: 0 });
      setMissed([]);
    },
    [day.vocabulary, day.quiz],
  );

  // Câu hỏi sinh ngẫu nhiên nên chỉ dựng được ở client, không render trên server.
  useEffect(() => {
    if (ready && round.length === 0) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const q = round[idx];
  const finished = round.length > 0 && idx >= round.length;

  const pick = (option) => {
    if (picked) return;
    setPicked(option);
    const right = option.id === q.word.id;
    setScore((s) => ({ right: s.right + (right ? 1 : 0), wrong: s.wrong + (right ? 0 : 1) }));
    if (!right) {
      // Sai thì đẩy từ về nhóm chưa học — thẻ từ vựng hiện lại ngay.
      setVocab(q.word.id, 'unknown');
      setMissed((m) => (m.some((w) => w.id === q.word.id) ? m : [...m, q.word]));
    }
  };

  const crumbs = [
    { label: 'Trang chủ', href: '/' },
    { label: day.title, href: `/day/${slug}` },
    { label: 'Game từ vựng' },
  ];

  if (!ready) return <TopBar crumbs={crumbs} />;

  return (
    <>
      <TopBar crumbs={crumbs} />

      <PageHeader
        eyebrow={day.title}
        title="Game từ vựng"
        subtitle={`${ROUND} câu mỗi lượt · trộn cả hai chiều Anh ↔ Việt · đáp án nhiễu bốc từ chính ${day.vocabulary.length} từ của buổi học`}
      />

      {finished ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-3) 0 var(--space-5)' }}>
            <div style={{ fontSize: 'var(--text-4xl)' }}>{score.wrong === 0 ? '🏆' : '📊'}</div>
            <h2 style={{ margin: 'var(--space-3) 0 var(--space-1)' }}>
              {score.right} / {round.length} đúng
            </h2>
            <p className="section-lead" style={{ margin: '0 auto' }}>
              {score.wrong === 0
                ? 'Đúng hết. Không từ nào bị đẩy về nhóm chưa học.'
                : `${missed.length} từ đã quay lại nhóm chưa học ở thẻ từ vựng.`}
            </p>
          </div>

          {missed.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Từ sai</th>
                    <th>Nghĩa</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {missed.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.word}</strong> <span className="ipa">{m.ipa.us}</span>
                      </td>
                      <td>{m.meaningVi}</td>
                      <td>
                        <Speak text={m.word} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="row row-end" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="primary" onClick={start}>
              Chơi lại
            </Button>
          </div>
        </Card>
      ) : q ? (
        <Card>
          <div className="quiz-head">
            <span>
              Câu {idx + 1} / {round.length}
            </span>
            <span className="row" style={{ gap: 'var(--space-3)' }}>
              <Badge tone={q.dir === 'en-vi' ? 'brand' : q.dir === 'vi-en' ? 'accent' : 'warning'}>
                {DIR_LABEL[q.dir]}
              </Badge>
              <span>
                ✅ {score.right} &nbsp; ❌ {score.wrong}
              </span>
            </span>
          </div>

          <Progress percent={(idx / round.length) * 100} />

          <div
            className="quiz-prompt"
            style={q.dir === 'cloze' ? { fontSize: 'var(--text-2xl)' } : undefined}
          >
            {q.prompt}
            {q.sub && <span className="ipa">{q.sub}</span>}
          </div>

          <div className="options">
            {q.options.map((opt, i) => {
              let cls = '';
              if (picked) {
                if (opt.id === q.word.id) cls = 'is-correct';
                else if (opt.id === picked.id) cls = 'is-wrong';
              }
              return (
                <button
                  key={opt.id}
                  className={`option ${cls}`}
                  onClick={() => pick(opt)}
                  type="button"
                  disabled={!!picked}
                >
                  <span className="key">{'ABCD'[i]}</span>
                  {q.label(opt)}
                </button>
              );
            })}
          </div>

          {picked && picked.id !== q.word.id && (
            <div className="feedback feedback-error">
              ❌ Sai rồi. <strong>{q.word.word}</strong> = {q.word.meaningVi}
              <br />
              Từ này đã được đẩy về nhóm <strong>chưa học</strong> ở thẻ và bảng từ vựng.
            </div>
          )}

          {picked && (
            <div className="row row-end" style={{ marginTop: 'var(--space-4)' }}>
              <Speak text={q.word.word} />
              <Button
                variant="primary"
                onClick={() => {
                  setPicked(null);
                  setIdx((i) => i + 1);
                }}
              >
                Câu tiếp →
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Card>Đang tạo câu hỏi…</Card>
      )}
    </>
  );
}

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} crumbLabel={'Game từ vựng'}>
      {(day) => <GameScreen slug={slug} day={day} />}
    </DayGate>
  );
}
