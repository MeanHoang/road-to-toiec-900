'use client';

import { useState } from 'react';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { RevealAnswer } from './RevealAnswer';
import { SKIP_AFTER_TRIES } from './rules';
import { choiceText } from './transcript';

/** Các câu audio đọc, bày trong hộp thoại — không chiếm chỗ trong trang. */
function ChoiceScript({ item, letters }) {
  return (
    <>
      <div className="script-list">
        {item.transcript?.Q && (
          <p>
            <span className="key">Q</span>
            {item.transcript.Q}
          </p>
        )}
        {letters.map((letter) => (
          <p key={letter}>
            <span className="key">{letter}</span>
            {choiceText(item.transcript, letter) || '— chưa có lời thoại'}
          </p>
        ))}
      </div>
      <p className="caption" style={{ marginTop: 'var(--space-4)' }}>
        Đây là nguyên văn những gì audio đọc — nghe được câu nào thì đối chiếu câu đó, đừng đọc
        trước rồi mới nghe.
      </p>
    </>
  );
}

/**
 * Bài trắc nghiệm có đáp án chính thức.
 *
 * `letters` là các phương án của bộ: A–D, hoặc A–C ở Part 2.
 *
 * Phương án IN SẴN trong tài liệu (`item.options`) thì hiện ngay từ đầu — đề
 * vốn cho đọc. Còn lời thoại chỉ hiện thẳng trong các ô phương án khi đã trả lời ĐÚNG — lúc đó
 * nó là phần chữa bài. Còn muốn xem trước thì phải mở hộp thoại và qua một lần
 * hỏi lại, và hộp thoại đóng lại ngay khi sang câu khác.
 */
export function ChoicePanel({ item, letters, saved, onAnswer, onSkip }) {
  const [picked, setPicked] = useState(null);

  const solved = Boolean(saved?.correct);
  const tries = saved?.tries || 0;

  return (
    <>
      <Badge tone="brand">Nghe rồi chọn đáp án</Badge>

      {item.question && <p className="section-lead" style={{ margin: 0 }}>{item.question}</p>}

      <div className="options options-stacked">
        {letters.map((letter) => {
          const revealed = solved || (picked && picked !== item.answer);
          let cls = '';
          if (revealed && letter === item.answer) cls = 'is-correct';
          else if (picked === letter && letter !== item.answer) cls = 'is-wrong';

          return (
            <button
              key={letter}
              className={`option ${cls}`}
              type="button"
              disabled={solved}
              onClick={() => {
                if (solved) return;
                setPicked(letter);
                onAnswer(letter, letter === item.answer);
              }}
            >
              <span className="key">{letter}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {item.options?.[letter] ||
                  (solved
                    ? choiceText(item.transcript, letter) || '— chưa có lời thoại'
                    : 'Nghe audio rồi chọn')}
              </span>
            </button>
          );
        })}
      </div>

      {solved && (
        <div className="feedback feedback-success">
          ✅ Đúng — đáp án <strong>{item.answer}</strong>.
        </div>
      )}

      {item.source?.answer === 'ai' && (
        <p className="caption">
          Đáp án câu này do AI giải — tài liệu không kèm đáp án chính thức.
        </p>
      )}

      {!solved && item.transcript && (
        <RevealAnswer
          questionId={item.id}
          label="Xem lời thoại"
          title={`Lời thoại câu ${item.no}`}
        >
          <ChoiceScript item={item} letters={letters} />
        </RevealAnswer>
      )}

      {picked && !solved && (
        <div className="feedback feedback-error">
          ❌ Chưa đúng — bạn đã sai <strong>{tries}</strong> lần.
          <div className="row" style={{ marginTop: 'var(--space-3)' }}>
            <Button size="sm" onClick={() => setPicked(null)}>
              🔁 Nghe lại
            </Button>
            {tries >= SKIP_AFTER_TRIES && (
              <Button variant="quiet" size="sm" onClick={onSkip}>
                Bỏ qua câu này
              </Button>
            )}
          </div>
          {tries < SKIP_AFTER_TRIES && (
            <p className="caption" style={{ marginTop: 'var(--space-2)' }}>
              Sai {SKIP_AFTER_TRIES} lần sẽ hiện thêm nút bỏ qua — tránh bị kẹt cứng ở một câu.
            </p>
          )}
        </div>
      )}
    </>
  );
}
