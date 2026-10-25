'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { Notice } from '@/shared/ui/atoms/Notice';
import { AnswerNote } from './AnswerNote';
import { DictationField } from './DictationField';
import { canGrade, spokenText } from './dictation';
import { CHOICES } from './rules';

/**
 * Bài chép: nghe rồi chép lại ĐÚNG NHỮNG GÌ NGHE ĐƯỢC, vào một ô duy nhất.
 *
 * Dùng cho cả hai chỗ, vì luật giống hệt nhau — chỉ khác câu dẫn:
 *   bộ chép      audio đọc ba câu tả tranh
 *   bộ homework  audio đọc liền bốn phương án A–D
 *   bộ Part 2    audio đọc câu hỏi rồi ba phương án A–C
 *
 * MỘT ô chứ không phải mỗi câu một ô. Chia nhỏ ra thì phải bấm chấm từng ô,
 * màn hình dài ngoằng, và quan trọng hơn: ranh giới giữa các câu chính là thứ
 * phải tự nghe ra. Chia sẵn ô là làm hộ mất phần đó.
 */
export function DictationPanel({ item, slug, value, onChange }) {
  const t = useTranslation();
  if (!canGrade(item)) {
    return (
      <Notice>
        {t('This question cannot be checked because its transcript is unavailable. Run')} <code>npm run transcribe {slug}</code> {t('locally to generate it.')}
      </Notice>
    );
  }

  const nhieuPhuongAn = typeof item.transcript === 'object';
  const soPhuongAn = nhieuPhuongAn ? CHOICES.filter((l) => item.transcript[l]).length : 0;
  const coCauHoi = nhieuPhuongAn && Boolean(item.transcript.Q);

  return (
    <>
      <p className="section-lead" style={{ margin: 0 }}>
        {nhieuPhuongAn ? (
          <>
            {t('Listen and')}{' '}
            <strong>
              {t('transcribe')} {coCauHoi ? t('the question and ') : ''}{t('all')} {soPhuongAn} {t('answer choices in one go')}
            </strong>
            {t('. Skip the test instructions and answer labels such as A, B, and C.')}
          </>
        ) : (
          <>
            {t('Listen and')} <strong>{t('transcribe everything you hear')}</strong>{t('. Click')}{' '}
            <strong>{t('Check')}</strong> {t('to review your answer. Each check reveals one more word.')}
          </>
        )}
      </p>

      <DictationField
        answer={spokenText(item.transcript)}
        value={value}
        onChange={onChange}
        minHeight={nhieuPhuongAn ? 132 : 96}
      />

      {item.source?.transcript !== 'drive' && <AnswerNote />}
    </>
  );
}
