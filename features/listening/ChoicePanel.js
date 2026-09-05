'use client';

import { useState } from 'react';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { RevealAnswer } from './RevealAnswer';
import { CHOICES, SKIP_AFTER_TRIES } from './rules';
import { choiceText } from './transcript';

/** Bốn câu audio đọc, bày trong hộp thoại — không chiếm chỗ trong trang. */
function ChoiceScript({ item }) {
  return (
    <>
      <div className="script-list">
        {CHOICES.map((letter) => (
          <p key={letter}>
            <span className="key">{letter}</span>
            {choiceText(item.transcript, letter) || '— chưa có lời thoại'}
          </p>
        ))}
      </div>
      <p className="caption" style={{ marginTop: 'var(--space-4)' }}>
        Đây là nguyên văn 4 câu audio đọc. Part 1 không có lời dẫn nào khác — nghe được câu nào thì
        đối chiếu câu đó, đừng đọc trước rồi mới nghe.
      </p>
    </>
  );
}

/**
 * Bài trắc nghiệm có đáp án chính thức.
 *
 * Lời thoại chỉ hiện thẳng trong bốn ô phương án khi đã trả lời ĐÚNG — lúc đó
 * nó là phần chữa bài. Còn muốn xem trước thì phải mở hộp thoại và qua một lần
 * hỏi lại, và hộp thoại đóng lại ngay khi sang câu khác.
 */
export function ChoicePanel({ item, saved, onAnswer, onSkip }) {
  const [picked, setPicked] = useState(null);

  const solved = Boolean(saved?.correct);
  const tries = saved?.tries || 0;

  return (
    <>
      <Badge tone="brand">Nghe rồi chọn đáp án</Badge>

      <div className="options options-stacked">
        {CHOICES.map((letter) => {
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
                {solved ? choiceText(item.transcript, letter) || '— chưa có lời thoại' : 'Nghe audio rồi chọn'}
              </span>
            </button>
          );
        })}
      </div>

      {solved && (
        <div className="feedback feedback-success">
          ✅ Đúng — đáp án <strong>{item.answer}</strong>. Bốn câu trên là đúng nguyên văn audio
          đọc. Câu tiếp đã mở khoá.
        </div>
      )}

      {!solved && item.transcript && (
        <RevealAnswer
          questionId={item.id}
          label="Xem lời thoại 4 phương án"
          title={`Lời thoại câu ${item.no}`}
        >
          <ChoiceScript item={item} />
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
