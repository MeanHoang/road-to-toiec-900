'use client';

import { use, useState } from 'react';
import { useProgress } from '@/lib/progress';
import { Badge, Button, Callout, Input, Notice, Textarea } from '@/components/primitives';
import { TopBar, PageHeader, AudioPlayer, StepList } from '@/components/patterns';
import { DayGate } from '@/components/DayGate';

const CHOICES = ['A', 'B', 'C', 'D'];

/**
 * Xem đáp án phải hỏi lại một lần.
 * Nhìn thấy đáp án là mất luôn cơ hội tự nghe ra, bấm nhầm thì không lấy lại được.
 * Dùng khối xác nhận ngay trong trang chứ không dùng confirm() của trình duyệt.
 */
function RevealAnswer({ children, label = 'Xem đáp án', onReveal }) {
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

function TranscriptBox({ text }) {
  return (
    <div className="feedback">
      <strong>Lời thoại nghe được:</strong>
      <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-base)' }}>{text}</p>
      <p className="caption" style={{ marginTop: 'var(--space-3)' }}>
        Do máy chép lại từ audio (whisper) nên có thể sai vài từ — nghe lại để tự xác nhận.
      </p>
    </div>
  );
}

function ListenSetScreen({ slug, setId, day }) {
  const set = day.listening.find((s) => s.code === setId);

  const { day: state, ready, answer, setDictation } = useProgress(slug);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showSubs, setShowSubs] = useState(false);

  const item = set?.questions[idx];
  const saved = ready ? state.listen[item.id] : null;
  const tries = saved?.tries || 0;
  const solved = saved?.correct;

  // Chỉ khoá khi bộ bài có đáp án chính thức — không có đáp án thì khoá là vô nghĩa.
  const locked =
    set.mode === 'choice' &&
    set.hasKey &&
    idx > 0 &&
    !state.listen[set.questions[idx - 1].id]?.correct;

  const goto = (i) => {
    setIdx(i);
    setPicked(null);
    setShowSubs(false);
  };

  if (!set) return <Notice>Không tìm thấy bộ bài &ldquo;{setId}&rdquo;.</Notice>;

  return (
    <>
      <TopBar
        crumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: day.title, href: `/day/${slug}` },
          { label: 'Luyện nghe', href: `/day/${slug}/listen` },
          { label: set.title },
        ]}
      />

      <PageHeader eyebrow={day.title} title={set.title} subtitle={set.subtitle} />

      <StepList
        items={set.questions}
        currentIndex={idx}
        isDone={(q) => ready && state.listen[q.id]?.correct}
        onPick={goto}
        labelOf={(q) => q.no}
      />

      <div className="grid grid-2" style={{ marginTop: 'var(--space-5)', alignItems: 'start' }}>
        {item.image ? (
          <img className="photo" src={item.image} alt={`Tranh câu ${item.no}`} />
        ) : (
          <div className="photo-placeholder">🖼 Câu này chưa có ảnh đề bài</div>
        )}

        <div className="stack stack-lg">
          <AudioPlayer src={item.audio} />

          {set.fullAudio && (
            <p className="caption">Bộ này có cả bản audio liền mạch để nghe một mạch cả bài.</p>
          )}

          {set.mode === 'dictation' ? (
            <>
              <p className="section-lead" style={{ margin: 0 }}>
                Nghe rồi <strong>chép nốt câu tiếng Anh</strong> mô tả bức tranh. Tài liệu cho sẵn
                phần đầu mỗi câu — bạn viết tiếp phần còn lại.
              </p>

              <div className="stack">
                {item.prompts.map((line, i) => (
                  <label className="dictation-line" key={i}>
                    <span className="dictation-prefix">{line.prefix}</span>
                    <Input
                      placeholder="…"
                      value={(ready && state.dictation[item.id]?.[i]) || ''}
                      onChange={(e) => {
                        const lines = [...(state.dictation[item.id] || [])];
                        lines[i] = e.target.value;
                        setDictation(item.id, lines);
                      }}
                    />
                    {line.suffix && <span className="dictation-suffix">{line.suffix}</span>}
                  </label>
                ))}
              </div>

              <p className="caption">Bài chép tự lưu — đóng trang mở lại vẫn còn nguyên.</p>

              {item.transcript ? (
                <RevealAnswer>
                  <TranscriptBox text={item.transcript} />
                </RevealAnswer>
              ) : (
                <Notice>
                  Câu này chưa có lời thoại — chạy <code>npm run transcribe {slug}</code> ở máy.
                </Notice>
              )}
            </>
          ) : !set.hasKey ? (
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
                value={(ready && state.dictation[item.id]?.[0]) || ''}
                onChange={(e) => setDictation(item.id, [e.target.value])}
              />
              <p className="caption">Tự lưu trên máy — đóng trang mở lại vẫn còn nguyên.</p>

              {item.transcript && (
                <RevealAnswer>
                  <TranscriptBox
                    text={
                      typeof item.transcript === 'string'
                        ? item.transcript
                        : CHOICES.filter((l) => item.transcript[l])
                            .map((l) => `(${l}) ${item.transcript[l]}`)
                            .join('   ')
                    }
                  />
                </RevealAnswer>
              )}
            </>
          ) : locked ? (
            <Notice>🔒 Trả lời đúng câu {set.questions[idx - 1].no} thì câu này mới mở</Notice>
          ) : (
            <>
              <Badge tone="brand">Nghe rồi chọn đáp án</Badge>

              <div className="options options-stacked">
                {CHOICES.map((letter) => {
                  const revealed = solved || (picked && picked !== item.answer);
                  let cls = '';
                  if (revealed && letter === item.answer) cls = 'is-correct';
                  else if (picked === letter && letter !== item.answer) cls = 'is-wrong';

                  return (
                    <button
                      key={letter}
                      className={`option ${cls}`}
                      type="button"
                      disabled={solved}
                      onClick={() => {
                        if (solved) return;
                        setPicked(letter);
                        answer(item.id, letter, letter === item.answer);
                      }}
                    >
                      <span className="key">{letter}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {showSubs || solved
                          ? item.transcript?.[letter] || '— chưa có lời thoại'
                          : 'Nghe audio rồi chọn'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {solved && (
                <div className="feedback feedback-success">
                  ✅ Đúng — đáp án <strong>{item.answer}</strong>. Bốn câu trên là đúng nguyên văn
                  audio đọc. Câu tiếp đã mở khoá.
                </div>
              )}

              {!solved && !showSubs && item.transcript && (
                <RevealAnswer label="Xem lời thoại 4 phương án" onReveal={() => setShowSubs(true)}>
                  <p className="caption">
                    Đang hiện nguyên văn 4 câu audio đọc. Part 1 không có lời dẫn nào khác — audio
                    chỉ đọc đúng bốn câu này.
                  </p>
                </RevealAnswer>
              )}

              {picked && !solved && (
                <div className="feedback feedback-error">
                  ❌ Chưa đúng — bạn đã sai <strong>{tries}</strong> lần.
                  <div className="row" style={{ marginTop: 'var(--space-3)' }}>
                    <Button size="sm" onClick={() => setPicked(null)}>
                      🔁 Nghe lại
                    </Button>
                    {tries >= 3 && (
                      <Button
                        variant="quiet"
                        size="sm"
                        onClick={() => goto(Math.min(idx + 1, set.questions.length - 1))}
                      >
                        Bỏ qua câu này
                      </Button>
                    )}
                  </div>
                  {tries < 3 && (
                    <p className="caption" style={{ marginTop: 'var(--space-2)' }}>
                      Sai 3 lần sẽ hiện thêm nút bỏ qua — tránh bị kẹt cứng ở một câu.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="row row-between">
            <Button variant="quiet" disabled={idx === 0} onClick={() => goto(idx - 1)}>
              ← Câu trước
            </Button>
            <Button
              variant="primary"
              disabled={idx === set.questions.length - 1 || (set.hasKey && !solved)}
              onClick={() => goto(idx + 1)}
            >
              Câu tiếp →
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page({ params }) {
  const { slug, setId } = use(params);
  return (
    <DayGate slug={slug} crumbLabel="Luyện nghe">
      {(day) => <ListenSetScreen slug={slug} setId={setId} day={day} />}
    </DayGate>
  );
}
