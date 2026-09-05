'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Callout } from '@/shared/ui/atoms/Callout';
import { Modal } from '@/shared/ui/organisms/Modal';

/**
 * Xem đáp án phải hỏi lại một lần, rồi mới mở ra trong hộp thoại.
 *
 * Hỏi lại vì nhìn thấy đáp án là mất luôn cơ hội tự nghe ra, bấm nhầm thì không
 * lấy lại được. Hộp thoại vì đáp án nằm thẳng trong trang thì nó CHIẾM CHỖ —
 * và chỉ cần nó còn đó lúc chuyển câu là đập thẳng vào mắt.
 *
 * `questionId` là chốt an toàn: đổi câu thì đóng, không phụ thuộc vào việc
 * component có được dựng lại hay không.
 */
export function RevealAnswer({ questionId, label = 'Xem đáp án', title, onReveal, children }) {
  const [step, setStep] = useState('hidden'); // hidden → asking → shown

  useEffect(() => {
    setStep('hidden');
  }, [questionId]);

  if (step === 'asking') {
    return (
      <Callout tone="warn">
        <strong>Chắc chưa?</strong> Xem rồi thì không tự nghe ra được nữa — thử nghe thêm một lượt
        đã.
        <div className="row row-end" style={{ marginTop: 'var(--space-3)' }}>
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
      </Callout>
    );
  }

  return (
    <>
      <div className="row row-end">
        <Button variant="primary" onClick={() => setStep('asking')}>
          {label}
        </Button>
      </div>

      <Modal open={step === 'shown'} onClose={() => setStep('hidden')} title={title || label}>
        {children}
      </Modal>
    </>
  );
}
