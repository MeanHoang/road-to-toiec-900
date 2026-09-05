'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Callout } from '@/shared/ui/atoms/Callout';

/**
 * Xem đáp án phải hỏi lại một lần.
 * Nhìn thấy đáp án là mất luôn cơ hội tự nghe ra, bấm nhầm thì không lấy lại được.
 * Dùng khối xác nhận ngay trong trang chứ không dùng confirm() của trình duyệt.
 */
export function RevealAnswer({ children, label = 'Xem đáp án', onReveal }) {
  const [step, setStep] = useState('hidden'); // hidden → asking → shown

  if (step === 'shown') {
    return (
      <>
        <div className="row row-end">
          <Button variant="quiet" onClick={() => setStep('hidden')}>
            Ẩn đáp án
          </Button>
        </div>
        {children}
      </>
    );
  }

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
    <div className="row row-end">
      <Button variant="primary" onClick={() => setStep('asking')}>
        {label}
      </Button>
    </div>
  );
}
