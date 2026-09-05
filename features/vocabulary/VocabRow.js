'use client';

import { Badge } from '@/shared/ui/atoms/Badge';
import { StarToggle } from '@/shared/ui/atoms/StarToggle';
import { Speak } from '@/shared/ui/molecules/Speak';

/** Một dòng trong bảng tra cứu. Bấm vào nhãn trạng thái để đổi đã biết / chưa học. */
export function VocabRow({ word, known, starred, onToggleKnown, onToggleStar }) {
  return (
    <tr className={starred ? 'is-starred' : ''}>
      <td className="col-star">
        <StarToggle
          on={starred}
          onClick={onToggleStar}
          label={starred ? `Bỏ sao ${word.word}` : `Gắn sao ${word.word}`}
        />
      </td>
      <td className="caption">{word.no}</td>
      <td>
        <strong>{word.word}</strong>
        <br />
        <span className="caption">{word.pos}</span>
      </td>
      <td className="ipa">{word.ipa.uk}</td>
      <td className="ipa">{word.ipa.us}</td>
      <td>{word.meaningVi}</td>
      <td>
        <button
          type="button"
          onClick={onToggleKnown}
          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
          aria-label={`Đánh dấu ${word.word} là ${known ? 'chưa học' : 'đã biết'}`}
        >
          <Badge tone={known ? 'success' : 'warning'}>{known ? 'đã biết' : 'chưa học'}</Badge>
        </button>
      </td>
      <td>
        <Speak text={word.word} />
      </td>
    </tr>
  );
}
