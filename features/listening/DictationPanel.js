'use client';

import { Notice } from '@/shared/ui/atoms/Notice';
import { AnswerNote } from './AnswerNote';
import { DictationField } from './DictationField';
import { canGrade, spokenText } from './dictation';

/**
 * Bài chép: nghe rồi chép lại ĐÚNG NHỮNG GÌ NGHE ĐƯỢC, vào một ô duy nhất.
 *
 * Dùng cho cả hai chỗ, vì luật giống hệt nhau — chỉ khác câu dẫn:
 *   bộ chép      audio đọc ba câu tả tranh
 *   bộ homework  audio đọc liền bốn phương án A–D
 *
 * MỘT ô chứ không phải mỗi câu một ô. Chia nhỏ ra thì phải bấm chấm từng ô,
 * màn hình dài ngoằng, và quan trọng hơn: ranh giới giữa các câu chính là thứ
 * phải tự nghe ra. Chia sẵn ô là làm hộ mất phần đó.
 */
export function DictationPanel({ item, slug, value, onChange }) {
  if (!canGrade(item)) {
    return (
      <Notice>
        Câu này chưa có lời thoại nên chưa chấm được — chạy <code>npm run transcribe {slug}</code> ở
        máy.
      </Notice>
    );
  }

  const nhieuPhuongAn = typeof item.transcript === 'object';

  return (
    <>
      <p className="section-lead" style={{ margin: 0 }}>
        {nhieuPhuongAn ? (
          <>
            Nghe rồi <strong>chép lại cả bốn phương án, liền một mạch</strong>. Không cần nhập các
            nội dung hướng dẫn làm bài và các từ cố định như A, B, C.
          </>
        ) : (
          <>
            Nghe rồi <strong>chép lại toàn bộ những gì bạn nghe được</strong>. Bấm{' '}
            <strong>Chấm</strong> để soát — mỗi lần chấm chỉ mở thêm đúng một từ, không lộ cả câu.
          </>
        )}
      </p>

      <DictationField
        answer={spokenText(item.transcript)}
        value={value}
        onChange={onChange}
        minHeight={nhieuPhuongAn ? 132 : 96}
      />

      <AnswerNote />
    </>
  );
}
