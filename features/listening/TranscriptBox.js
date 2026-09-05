import { transcriptText } from './transcript';

/** Lời thoại máy chép. Luôn kèm cảnh báo — whisper sai từ là chuyện thường. */
export function TranscriptBox({ transcript }) {
  return (
    <div className="feedback">
      <strong>Lời thoại nghe được:</strong>
      <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-base)' }}>
        {transcriptText(transcript)}
      </p>
      <p className="caption" style={{ marginTop: 'var(--space-3)' }}>
        Do máy chép lại từ audio (whisper) nên có thể sai vài từ — nghe lại để tự xác nhận.
      </p>
    </div>
  );
}
