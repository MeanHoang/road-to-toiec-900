'use client';

import { Input } from '@/shared/ui/atoms/Input';
import { Notice } from '@/shared/ui/atoms/Notice';
import { RevealAnswer } from './RevealAnswer';
import { TranscriptBox } from './TranscriptBox';

/**
 * Bài chép chính tả: tài liệu cho sẵn phần đầu mỗi câu, người học viết tiếp.
 * Ô nào cũng tự lưu ngay theo từng phím gõ — không có nút "lưu" nào cả.
 */
export function DictationPanel({ item, slug, lines, onChangeLine }) {
  return (
    <>
      <p className="section-lead" style={{ margin: 0 }}>
        Nghe rồi <strong>chép nốt câu tiếng Anh</strong> mô tả bức tranh. Tài liệu cho sẵn phần đầu
        mỗi câu — bạn viết tiếp phần còn lại.
      </p>

      <div className="stack">
        {item.prompts.map((line, i) => (
          <label className="dictation-line" key={i}>
            <span className="dictation-prefix">{line.prefix}</span>
            <Input placeholder="…" value={lines[i] || ''} onChange={(e) => onChangeLine(i, e.target.value)} />
            {line.suffix && <span className="dictation-suffix">{line.suffix}</span>}
          </label>
        ))}
      </div>

      <p className="caption">Bài chép tự lưu — đóng trang mở lại vẫn còn nguyên.</p>

      {item.transcript ? (
        <RevealAnswer>
          <TranscriptBox transcript={item.transcript} />
        </RevealAnswer>
      ) : (
        <Notice>
          Câu này chưa có lời thoại — chạy <code>npm run transcribe {slug}</code> ở máy.
        </Notice>
      )}
    </>
  );
}
