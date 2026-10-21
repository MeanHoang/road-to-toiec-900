'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Một câu trong phòng thi. Mọi Part dùng chung component này vì khung của
// chúng giống hệt nhau — chỉ phần trên là khác: tranh, hình minh hoạ, đoạn văn.
//
// Khác hẳn màn Luyện nghe, và khác có chủ đích:
//   - audio phát MỘT lần, không có thanh tua, không đổi tốc độ
//   - không có nút "xem đáp án"
//   - chọn xong không báo đúng sai
// Ba thứ đó là cái làm nên phòng thi. Thiếu một là nó lại thành bài luyện.

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Badge } from '@/shared/ui/atoms/Badge';
import { partTitle } from './rules';

export function ExamQuestion({ question, picked, onPick, review = false }) {
  const t = useTranslation();
  return (
    <div className="exam-q">
      <span className="eyebrow">
        {t('Question')} {question.no} · {t(partTitle(question.part))}
      </span>

      {question.passage && <Passage passage={question.passage} />}

      {question.graphic && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="exam-graphic" src={question.graphic} alt={t('Illustration for the listening passage')} />
      )}

      {question.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="exam-photo" src={question.image} alt="" />
      )}

      {question.stem && <p className="exam-stem">{question.stem}</p>}

      <div className={`exam-options ${!question.options && !review ? 'exam-options-letters' : ''}`}>
        {question.choices.map((letter) => review ? (
          <div
            key={letter}
            className={`exam-option exam-option-review ${letter === question.answer ? 'is-correct' : picked === letter ? 'is-wrong' : ''}`}
          >
            <span className="exam-option-letter">{letter}</span>
            <span>
              {question.options?.[letter] || question.script?.find((line) => line.text.startsWith(`${letter}. `))?.text.slice(3)}
            </span>
            {letter === question.answer && <Badge tone="success">{t('Correct answer')}</Badge>}
            {picked === letter && <Badge tone="danger">{t('Your answer')}</Badge>}
          </div>
        ) : (
          <button
            key={letter}
            type="button"
            className={`exam-option ${picked === letter ? 'is-picked' : ''}`}
            aria-pressed={picked === letter}
            onClick={() => onPick(letter)}
          >
            <span className="exam-option-letter">{letter}</span>
            {/* Part 1 và Part 2 KHÔNG in lời ra đề — thí sinh chỉ được nghe.
                In ra là biến bài nghe thành bài đọc. */}
            {question.options && <span>{question.options[letter]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Băng của phần Listening: phát đúng một đoạn, một lần, rồi báo `onEnded`.
 *
 * Bên gọi đặt `key` theo đoạn băng, nên sang đoạn mới là component dựng lại
 * và tự phát. Không `controls`, không `loop`: phòng thi không có nút tua.
 *
 * Trình duyệt chặn tự phát khi trang chưa được bấm vào. Thường không xảy ra —
 * muốn vào màn này phải bấm "Thi" — nhưng nếu vẫn bị chặn thì hiện MỘT nút
 * "Bắt đầu phát". Đó là nút bắt đầu, không phải nút nghe lại: phát xong rồi
 * thì nút không bao giờ hiện lại.
 */
export function Tape({ src, onEnded }) {
  const t = useTranslation();
  const ref = useRef(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    ref.current?.play().catch(() => setBlocked(true));
  }, [src]);

  const start = () => {
    setBlocked(false);
    ref.current?.play().catch(() => setBlocked(true));
  };

  return (
    <div className="exam-audio">
      <audio ref={ref} src={src} preload="auto" onEnded={onEnded} />
      {blocked ? (
        <Button size="sm" variant="primary" onClick={start}>
          {t('Start audio')}
        </Button>
      ) : (
        <span className="caption">{t('Audio is playing — listen once, no seeking')}</span>
      )}
    </div>
  );
}

/** Đoạn văn Part 6-7: ảnh cắt từ đề. Bộ nhiều đoạn có nhiều ảnh. */
function Passage({ passage }) {
  const images = passage.images || (passage.image ? [passage.image] : []);
  return (
    <div className="exam-passage">
      {passage.kind && <span className="eyebrow">{passage.kind}</span>}
      {passage.text && <p>{passage.text}</p>}
      {images.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" />
      ))}
    </div>
  );
}
