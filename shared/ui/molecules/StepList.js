/**
 * Dãy số thứ tự câu — dùng chung cho bài nghe và bài dịch.
 * `isWrong` để câu đã làm nhưng sai KHÔNG hiện xanh giống câu đúng.
 *
 * Thuần trình bày: mọi thứ "câu nào đúng / câu nào sai" do màn gọi truyền vào.
 */
export function StepList({ items, currentIndex, isDone, isWrong, onPick, labelOf }) {
  return (
    <div className="steps">
      {items.map((it, i) => {
        const wrong = isWrong?.(it);
        const state =
          i === currentIndex ? 'is-current' : wrong ? 'is-wrong' : isDone(it) ? 'is-done' : '';
        return (
          <button
            key={it.id}
            type="button"
            className={`step ${state}`}
            onClick={() => onPick(i)}
            aria-label={`Question ${labelOf ? labelOf(it) : i + 1}${wrong ? ' — answered incorrectly' : isDone(it) ? ' — answered correctly' : ''}`}
          >
            {labelOf ? labelOf(it) : i + 1}
          </button>
        );
      })}
    </div>
  );
}
