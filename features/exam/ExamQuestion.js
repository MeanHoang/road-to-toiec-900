'use client';

// Một câu trong phòng thi. Nghe và Đọc dùng chung component này vì khung của
// chúng giống hệt nhau — chỉ phần trên là khác: một bên nghe, một bên đọc.
//
// Khác hẳn màn Luyện nghe, và khác có chủ đích:
//   - audio phát MỘT lần, không có thanh tua, không đổi tốc độ
//   - không có nút "xem đáp án"
//   - chọn xong không báo đúng sai
// Ba thứ đó là cái làm nên phòng thi. Thiếu một là nó lại thành bài luyện.

import { useEffect, useRef, useState } from 'react';
import { choicesOf } from '@/features/listening/rules';

export function ExamQuestion({ question, picked, onPick, firstListen = true }) {
  const letters = question.options
    ? Object.keys(question.options)
    : choicesOf({ part: question.part });

  return (
    <div className="exam-q">
      {question.audio && <PlayOnce src={question.audio} firstListen={firstListen} />}

      {question.passage && <Passage passage={question.passage} />}

      {question.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="exam-photo" src={question.image} alt="" />
      )}

      {question.stem && <p className="exam-stem">{question.stem}</p>}

      <div className="exam-options">
        {letters.map((letter) => (
          <button
            key={letter}
            type="button"
            className={`exam-option ${picked === letter ? 'is-picked' : ''}`}
            aria-pressed={picked === letter}
            onClick={() => onPick(letter)}
          >
            <span className="exam-option-letter">{letter}</span>
            {/* Part 1 và Part 2 KHÔNG in lời thoại ra giấy — thí sinh chỉ được
                nghe. In ra là biến bài nghe thành bài đọc. */}
            {question.options && <span>{question.options[letter]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Phát đúng một lần khi câu hiện ra, rồi thôi.
 *
 * `key` theo id câu ở bên gọi, nên đổi câu là component này dựng lại từ đầu và
 * tự phát. Không `controls`, không `loop`: trong phòng thi không có nút tua.
 *
 * Trình duyệt chặn tự phát khi trang chưa được bấm vào. Ở đây không sao: muốn
 * vào được màn này thì phải bấm "Vào thi" ở màn chọn đề, và chính cú bấm đó
 * đã mở khoá âm thanh cho cả lượt thi.
 */
function PlayOnce({ src, firstListen }) {
  const ref = useRef(null);

  // CHỐT lúc dựng. Component này mang `key` là id câu nên mỗi lần tới một câu
  // là một lần dựng mới — đúng bằng "lần đến".
  //
  // Phải chốt vì `firstListen` LẬT ngay trong cùng một câu: lúc vừa tới là
  // true nên audio chạy, rồi hiệu ứng cập nhật "câu xa nhất" xong thì thành
  // false. Đọc thẳng nó thì dòng chữ đổi sang "đã nghe rồi" trong khi loa vẫn
  // đang phát — người thi tưởng máy hỏng.
  const [shouldPlay] = useState(firstListen);

  useEffect(() => {
    const el = ref.current;
    // Quay lại câu đã nghe: xem lại tranh và đổi đáp án thì được, nghe lại thì
    // không. Băng trong phòng thi không chạy ngược.
    if (!el || !shouldPlay) return;
    el.currentTime = 0;
    el.play().catch(() => {
      // Vẫn bị chặn thì im lặng bỏ qua. KHÔNG bày nút phát lại ra: trong phòng
      // thi mỗi câu chỉ được nghe một lần, có nút là hỏng luật.
    });
  }, [src, shouldPlay]);

  return (
    <div className="exam-audio">
      <audio ref={ref} src={src} preload="auto" />
      <span className="caption">
        {shouldPlay ? 'Đang phát — mỗi câu chỉ nghe một lần' : 'Câu này đã nghe rồi, không phát lại'}
      </span>
    </div>
  );
}

/** Đoạn văn của Part 6 và 7. Có khi là chữ, có khi là ảnh chụp từ đề. */
function Passage({ passage }) {
  return (
    <div className="exam-passage">
      {passage.kind && <span className="eyebrow">{passage.kind}</span>}
      {passage.text && <p>{passage.text}</p>}
      {passage.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={passage.image} alt="" />
      )}
    </div>
  );
}
