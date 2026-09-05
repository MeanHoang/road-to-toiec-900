'use client';

import { Badge } from '@/shared/ui/atoms/Badge';
import { StarToggle } from '@/shared/ui/atoms/StarToggle';
import { Speak } from '@/shared/ui/molecules/Speak';

/** Một dòng phiên âm: nhãn giọng, IPA, nút đọc. */
function IpaLine({ label, ipa, word, lang, voice }) {
  if (!ipa) return null;
  return (
    <div className="ipa-line">
      <span className="ipa-label">{label}</span>
      <span className="ipa">{ipa}</span>
      <Speak text={word} lang={lang} label={`Đọc ${word} giọng ${voice}`} />
    </div>
  );
}

function StarCorner({ word, starred, onToggle }) {
  return (
    <StarToggle
      className="card-star"
      on={starred}
      onClick={onToggle}
      label={starred ? `Bỏ sao ${word}` : `Gắn sao ${word} để xem lại mặt chữ`}
    />
  );
}

/**
 * Mặt trước chỉ có từ và IPA — phải tự nhớ nghĩa. Ảnh nằm ở mặt sau, để mặt
 * trước là lộ đáp án.
 *
 * Bấm vào thẻ thì lật, TRỪ khi bấm trúng thứ gì đó trong `.icon-btn` — nút sao
 * và nút loa nằm ngay trên mặt thẻ, bấm chúng mà thẻ lật theo thì rất khó chịu.
 */
export function Flashcard({ card, flipped, starred, onFlip, onToggleStar }) {
  return (
    <div
      className={`flashcard ${flipped ? 'is-flipped' : ''}`}
      onClick={(e) => {
        if (!e.target.closest('.icon-btn')) onFlip();
      }}
    >
      <div className="flashcard-inner">
        <div className="flashcard-face">
          <StarCorner word={card.word} starred={starred} onToggle={onToggleStar} />
          <Badge eyebrow>{card.group}</Badge>
          <div className="word">{card.word}</div>
          {/* Mỗi giọng một dòng, nhãn và phiên âm thẳng cột nhau. Trước đây
              cả bốn thứ nằm trong một flex-wrap nên khi hết chỗ nó ngắt bừa,
              nút loa Anh rơi xuống nằm cạnh phiên âm Mỹ. */}
          <div className="ipa-row">
            <IpaLine label="UK" ipa={card.ipa.uk} word={card.word} lang="en-GB" voice="Anh" />
            <IpaLine label="US" ipa={card.ipa.us} word={card.word} lang="en-US" voice="Mỹ" />
          </div>
          <div className="hint">tự nhớ nghĩa trước · bấm để lật</div>
        </div>

        <div className="flashcard-face back">
          <StarCorner word={card.word} starred={starred} onToggle={onToggleStar} />
          {card.image && <img src={card.image} alt="" />}
          <Badge>{card.pos}</Badge>
          <div className="meaning">{card.meaningVi}</div>
          {card.example && <div className="example-vi">{card.example.en}</div>}
        </div>
      </div>
    </div>
  );
}
