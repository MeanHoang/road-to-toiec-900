'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Switch } from '@/shared/ui/atoms/Switch';
import { checkLine, fullLine } from './dictation';

/**
 * Ô chép có chấm.
 *
 * Gạch chân từ sai NGAY TRONG Ô NHẬP, không phải ở dòng thông báo bên dưới:
 * chỗ cần sửa và chỗ đang gõ phải là một, nếu không thì vừa đọc vừa dò lại.
 * <textarea> không tô được từng chữ, nên chữ thật để trong suốt và một lớp
 * "gương" phía dưới vẽ lại đúng nội dung đó, có gạch chân. Gương nằm trong
 * luồng nên nó quyết định chiều cao — gõ dài thì ô tự cao lên theo.
 *
 * Gõ tiếp là gạch chân biến mất (nó nói về bản đã chấm, không phải bản đang
 * gõ), nhưng đáp án đã lộ thì giữ nguyên — đang cần nó để gõ nốt.
 */
export function DictationField({ answer, value, onChange, minHeight }) {
  const [checked, setChecked] = useState(null); // { text, result } | null
  const [gaveUp, setGaveUp] = useState(false);

  const stale = !checked || checked.text !== value;
  const result = checked?.result;

  const check = () => setChecked({ text: value, result: checkLine(value, answer) });

  const typed = value.trim().split(/\s+/).filter(Boolean);
  const marks = stale ? typed.map((w) => ({ text: w, ok: true })) : result.typed;
  const reveal = gaveUp ? fullLine(answer) : result?.reveal;
  const done = !stale && result.status === 'correct';

  // Mở cả câu là CÔNG TẮC, không phải cửa một chiều: lỡ tay bật thì tắt lại
  // được, và tắt xong quay về đúng mức lộ dần đang có chứ không mất sạch.
  // Chỉ hiện sau khi đã chấm ít nhất một lần — chưa thử mà đã cho xem thì
  // không ai thử nữa. Bám vào `checked` chứ không phải `stale`, để gõ tiếp
  // thì công tắc vẫn nằm đó thay vì nhấp nháy biến mất.
  const canReveal = Boolean(checked) && result.status !== 'correct';

  return (
    <div className="dictation-line">
      <div className="dictation-row">
        <div className={`dictation-field ${done ? 'is-correct' : ''}`}>
          <div className="dictation-mirror" aria-hidden="true" style={{ minHeight }}>
            {marks.map((w, i) => (
              <span key={i} className={w.ok ? '' : 'dictation-bad'}>
                {w.text}{' '}
              </span>
            ))}
          </div>
          <textarea
            className="dictation-entry"
            rows={1}
            spellCheck={false}
            autoComplete="off"
            placeholder="Gõ lại câu bạn nghe được…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // Enter chấm luôn; xuống dòng thì Shift+Enter. Chấm là việc làm
              // liên tục nhất ở màn này nên nó được phím dễ bấm hơn.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                check();
              }
            }}
          />
        </div>
      </div>

      <div className="dictation-actions">
        <Button size="sm" variant="primary" disabled={!value.trim()} onClick={check}>
          Chấm
        </Button>

        {done && <span className="dictation-verdict is-ok">✓ Đúng rồi</span>}
        {!stale && result.status === 'wrong' && (
          <span className="dictation-verdict is-bad">⚠ Chưa đúng</span>
        )}

        {canReveal && (
          <Switch checked={gaveUp} onChange={() => setGaveUp((g) => !g)}>
            Xem cả câu
          </Switch>
        )}
      </div>

      {reveal && (
        <p className="dictation-reveal">
          {reveal.map((w, i) => (
            <span key={i} className={w.shown ? 'is-shown' : 'is-hidden'}>
              {w.text}{' '}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
