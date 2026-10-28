'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Button } from '@/shared/ui/atoms/Button';
import { Notice } from '@/shared/ui/atoms/Notice';
import { Switch } from '@/shared/ui/atoms/Switch';
import { AudioPlayer } from '@/shared/ui/molecules/AudioPlayer';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { StepList } from '@/shared/ui/molecules/StepList';
import { ChoicePanel } from './ChoicePanel';
import { DictationPanel } from './DictationPanel';
import { choicesOf, hasPhoto } from './rules';

/**
 * Một bộ bài nghe. Màn này chỉ lo ĐIỀU HƯỚNG giữa các câu và bày bố cục;
 * các dạng bài nằm ở panel riêng, vì luật của chúng khác hẳn nhau.
 *
 * Bộ homework (có đáp án chính thức) chạy được HAI chế độ trên cùng một bộ đề:
 * nghe rồi chọn A–D, hoặc nghe rồi chép lại cả bốn phương án. Cùng một audio,
 * hai cách luyện — nên là một nút gạt chứ không phải hai bộ bài riêng.
 */
export function ListenSetScreen({ slug, setId, day }) {
  const t = useTranslation();
  const set = day.listening.find((s) => s.code === setId);
  const { day: state, ready, answer, setDictation } = useProgress(slug);
  const [idx, setIdx] = useState(0);
  // Bộ khai mode 'dictation' mở ở chế độ chép; nút gạt vẫn cho chuyển sang chọn
  // khi bộ có đáp án.
  const [writing, setWriting] = useState(set?.mode === 'dictation');

  // Guard phải đứng TRƯỚC mọi chỗ đụng tới `set` — ngay dưới đây đã là
  // `set.questions[idx]`. Đẩy nó xuống sau là gõ sai setId trên URL thành
  // trắng màn hình, chứ không phải hiện thông báo này.
  if (!set) {
    return (
      <>
        <Notice>{t('Listening set not found: “')}{setId}&rdquo;.</Notice>
      </>
    );
  }

  const item = set.questions[idx];
  const saved = ready ? state.listen[item.id] : null;

  // Hết câu cuối thì đi thẳng sang bộ kế tiếp, không bắt quay ra danh sách rồi
  // bấm vào lại. Thứ tự bộ bài chính là thứ tự trong day.listening — cùng thứ
  // tự màn danh sách đang bày ra, nên không có chuyện nhảy lung tung.
  const lastQuestion = idx === set.questions.length - 1;
  const nextSet = day.listening[day.listening.findIndex((s) => s.code === setId) + 1];

  // Chép được ở gần như mọi bộ — audio nào cũng có lời để mà chép lại. Ngoại lệ
  // duy nhất là bộ CÓ đáp án chính thức và đang ở chế độ chọn A–D.
  //
  // Bộ KHÔNG có đáp án thì luôn chép: chọn A–D ở đó không chấm được (tài liệu
  // không phát key), nên bày ra bốn ô để bấm là bày ra một việc vô nghĩa. Chép
  // lại thì chấm được thật, vì đối chiếu với lời thoại chứ không cần key.
  const chepLai = !set.hasKey || writing;

  const letters = choicesOf(set);
  const lettersLabel = `${letters[0]}–${letters[letters.length - 1]}`;

  const goto = (i) => setIdx(Math.max(0, Math.min(i, set.questions.length - 1)));

  const lines = (ready && state.dictation[item.id]) || [];

  return (
    <>
      <PageHeader eyebrow={day.title} title={set.title} subtitle={set.subtitle} />

      <StepList
        items={set.questions}
        currentIndex={idx}
        isDone={(q) => ready && state.listen[q.id]?.correct}
        onPick={goto}
        labelOf={(q) => q.no}
      />

      <div
        className={hasPhoto(set) ? 'listening-workspace grid grid-2' : 'listening-workspace stack'}
        // Không có tranh thì một cột; giới hạn bề ngang để câu trả lời dài vẫn dễ đọc.
        style={
          hasPhoto(set)
            ? { marginTop: 'var(--space-5)', alignItems: 'start' }
            : { marginTop: 'var(--space-5)' }
        }
      >
        {hasPhoto(set) &&
          (item.image ? (
            <img className="photo" src={item.image} alt={t('Image for question {0}', [item.no])} />
          ) : (
            <div className="photo-placeholder">{t('🖼 No image available for this question')}</div>
          ))}

        <div className={`stack stack-lg listening-panel ${!hasPhoto(set) ? 'listening-panel-wide' : ''}`}>
          <div className="listening-controls stack">
          <AudioPlayer src={item.audio} />

          {set.fullAudio && (
            <p className="caption">{t('A full-length audio track is also available for this set.')}</p>
          )}

          {/* Part 3: lời hội thoại đã có bộ chép riêng, không gạt sang chép ở bộ câu hỏi. */}
          {set.hasKey && set.part !== 3 && (
            <Switch checked={writing} onChange={() => setWriting((w) => !w)}>
              {t('Dictation mode — transcribe the audio instead of choosing')} {lettersLabel}
            </Switch>
          )}

          </div>
          <div className="listening-response stack">
          {chepLai ? (
            <DictationPanel
              key={item.id}
              item={item}
              slug={slug}
              value={lines[0] || ''}
              onChange={(value) => setDictation(item.id, [value])}
            />
          ) : (
            <ChoicePanel
              key={item.id}
              item={item}
              letters={letters}
              saved={saved}
              onAnswer={(letter, correct) => answer(item.id, letter, correct)}
              onSkip={() => goto(idx + 1)}
            />
          )}

          </div>
          <div className="row row-between listening-actions">
            <Button variant="quiet" disabled={idx === 0} onClick={() => goto(idx - 1)}>
              {t('← Previous question')}
            </Button>

            {!lastQuestion ? (
              <Button variant="primary" onClick={() => goto(idx + 1)}>
                {t('Next question →')}
              </Button>
            ) : nextSet ? (
              <Button variant="primary" href={`/day/${slug}/listen/${nextSet.code}`}>
                {t(nextSet.title)} →
              </Button>
            ) : (
              <Button variant="primary" href={`/day/${slug}/listen`}>
                {t('All sets complete — back to list →')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
