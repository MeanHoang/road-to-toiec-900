'use client';

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
export function RevealAnswer({ questionId, label = 'Xem đáp án', title, onReveal, children }) {
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
        title={step === 'asking' ? 'Chắc chưa?' : title || label}
      >
        {step === 'asking' ? (
          <>
            <p>
              Xem rồi thì không tự nghe ra được nữa — thử nghe thêm một lượt đã.
            </p>
            <div className="row row-end" style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="quiet" onClick={() => setStep('hidden')}>
                Để tôi nghe lại
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setStep('shown');
                  onReveal?.();
                }}
              >
                Vẫn xem đáp án
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
