'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { Badge } from '@/shared/ui/atoms/Badge';
import { StarToggle } from '@/shared/ui/atoms/StarToggle';
import { Speak } from '@/shared/ui/molecules/Speak';

/** Một dòng trong bảng tra cứu. Bấm vào nhãn trạng thái để đổi đã biết / chưa học. */
export function VocabRow({ word, known, starred, onToggleKnown, onToggleStar }) {
  const t = useTranslation();
  return (
    <tr className={starred ? 'is-starred' : ''}>
      <td className="col-star">
        <StarToggle
          on={starred}
          onClick={onToggleStar}
          label={starred ? t('Unstar {0}', [word.word]) : t('Star {0}', [word.word])}
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
          aria-label={t('Mark {0} as {1}', [word.word, t(known ? 'To learn' : 'Known')])}
        >
          <Badge tone={known ? 'success' : 'warning'}>{known ? t('Known') : t('To learn')}</Badge>
        </button>
      </td>
      <td>
        {/* Bảng tra cứu chỉ có một nút, lấy giọng Mỹ — cột IPA ở đây không
            tách UK/US nên bày hai nút là bày thêm việc phải chọn. */}
        <Speak text={word.word} src={word.voice?.us} />
      </td>
    </tr>
  );
}
