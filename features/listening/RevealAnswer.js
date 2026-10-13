'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/organisms/Modal';

/**
 * Xem đáp án: một hộp thoại, hai bước — hỏi lại, rồi mới mở đáp án.
 *
 * Hỏi lại vì nhìn thấy đáp án là mất luôn cơ hội tự nghe ra, bấm nhầm thì không
 * lấy lại được. Cả hai bước đều nằm trong hộp thoại, không cái nào chen vào
 * trang: chỉ cần đáp án còn nằm đó lúc chuyển câu là nó đập thẳng vào mắt.
 *
 * `questionId` là chốt an toàn: đổi câu thì đóng, không phụ thuộc vào việc
 * component có được dựng lại hay không.
 */
export function RevealAnswer({ questionId, label = 'Show answer', title, onReveal, children }) {
  const t = useTranslation();
  const [step, setStep] = useState('hidden'); // hidden → asking → shown

  useEffect(() => {
    setStep('hidden');
  }, [questionId]);

  return (
    <>
      <div className="row row-end">
        <Button variant="primary" onClick={() => setStep('asking')}>
          {label}
        </Button>
      </div>

      <Modal
        open={step !== 'hidden'}
        onClose={() => setStep('hidden')}
        title={step === 'asking' ? t('Reveal the answer?') : title || label}
      >
        {step === 'asking' ? (
          <>
            <p>
              {t('Revealing the answer ends this listening challenge. Try listening once more first.')}
            </p>
            <div className="row row-end" style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="quiet" onClick={() => setStep('hidden')}>
                {t('Listen again first')}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setStep('shown');
                  onReveal?.();
                }}
              >
                {t('Reveal answer')}
              </Button>
            </div>
          </>
        ) : (
          children
        )}
      </Modal>
    </>
  );
}
