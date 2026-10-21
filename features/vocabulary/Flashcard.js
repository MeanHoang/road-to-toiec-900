'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { Badge } from '@/shared/ui/atoms/Badge';
import { StarToggle } from '@/shared/ui/atoms/StarToggle';
import { Speak } from '@/shared/ui/molecules/Speak';

/** Một dòng phiên âm: nhãn giọng, IPA, nút đọc. */
function IpaLine({ label, ipa, word, lang, voice, src }) {
  const t = useTranslation();
  if (!ipa) return null;
  return (
    <div className="ipa-line">
      <span className="ipa-label">{label}</span>
      <span className="ipa">{ipa}</span>
      <Speak text={word} lang={lang} src={src} label={t('Pronounce {0} ({1} English)', [word, t(voice)])} />
    </div>
  );
}

function StarCorner({ word, starred, onToggle }) {
  const t = useTranslation();
  return (
    <StarToggle
      className="card-star"
      on={starred}
      onClick={onToggle}
      label={starred ? t('Unstar {0}', [word]) : t('Star {0} for spelling review', [word])}
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
  const t = useTranslation();
  return (
    <div
      className={`flashcard ${flipped ? 'is-flipped' : ''} ${card.word.length > 26 ? 'has-long-word' : ''}`}
      onClick={(e) => {
        if (!e.target.closest('.icon-btn')) onFlip();
      }}
    >
      <button className="flashcard-flip" type="button" onClick={(event) => { event.stopPropagation(); onFlip(); }} aria-label={t('Flip card')} />
      <div className="flashcard-inner">
        <div className="flashcard-face" inert={flipped} aria-hidden={flipped}>
          <StarCorner word={card.word} starred={starred} onToggle={onToggleStar} />
          <Badge eyebrow>{card.group}</Badge>
          <div className="word">{card.word}</div>
          {/* Mỗi giọng một dòng, nhãn và phiên âm thẳng cột nhau. Trước đây
              cả bốn thứ nằm trong một flex-wrap nên khi hết chỗ nó ngắt bừa,
              nút loa Anh rơi xuống nằm cạnh phiên âm Mỹ. */}
          <div className="ipa-row">
            <IpaLine
              label="UK"
              ipa={card.ipa.uk}
              word={card.word}
              lang="en-GB"
              voice="British"
              src={card.voice?.uk}
            />
            <IpaLine
              label="US"
              ipa={card.ipa.us}
              word={card.word}
              lang="en-US"
              voice="American"
              src={card.voice?.us}
            />
          </div>
          <div className="hint">{t('recall the meaning · click to flip')}</div>
        </div>

        <div className="flashcard-face back" inert={!flipped} aria-hidden={!flipped}>
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
