'use client';

import { Notice } from '@/shared/ui/atoms/Notice';
import { Textarea } from '@/shared/ui/atoms/Textarea';
import { RevealAnswer } from './RevealAnswer';
import { TranscriptBox } from './TranscriptBox';

/**
 * Bộ bài KHÔNG có đáp án chính thức — phần chữa trên lớp.
 *
 * Không chấm, và cũng không giả vờ chấm: người học chép lại những gì nghe được
 * để đối chiếu khi thầy cô chữa. Nói thẳng chuyện đó ra còn hơn để họ tưởng
 * mình đang được máy chấm.
 */
export function ClassNotesPanel({ item, note, onNoteChange }) {
  return (
    <>
      <Notice>
        Bộ này <strong>không có đáp án chính thức</strong> — đây là phần chữa trên lớp.
      </Notice>

      <p className="section-lead" style={{ margin: 0 }}>
        Nghe rồi chép lại những gì bạn nghe được và đáp án bạn chọn.{' '}
        <strong>Giữ nguyên bài này để đối chiếu khi thầy cô chữa trên lớp.</strong>
      </p>

      <Textarea
        rows={5}
        placeholder={'Ví dụ:\nA. She\'s opening up a bag\nB. …\nMình chọn: D'}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
      />
      <p className="caption">Tự lưu trên máy — đóng trang mở lại vẫn còn nguyên.</p>

      {item.transcript && (
        <RevealAnswer questionId={item.id} title={`Lời thoại câu ${item.no}`}>
          <TranscriptBox transcript={item.transcript} />
        </RevealAnswer>
      )}
    </>
  );
}
