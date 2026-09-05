'use client';

import { useState } from 'react';
import { lessonCrumbs } from '@/features/lesson/crumbs';
import { useProgress } from '@/features/progress/useProgress';
import { Button } from '@/shared/ui/atoms/Button';
import { Notice } from '@/shared/ui/atoms/Notice';
import { AudioPlayer } from '@/shared/ui/molecules/AudioPlayer';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { StepList } from '@/shared/ui/molecules/StepList';
import { TopBar } from '@/shared/ui/organisms/TopBar';
import { ChoicePanel } from './ChoicePanel';
import { ClassNotesPanel } from './ClassNotesPanel';
import { DictationPanel } from './DictationPanel';
import { isLocked } from './rules';

/**
 * Một bộ bài nghe. Màn này chỉ lo ĐIỀU HƯỚNG giữa các câu và bày bố cục;
 * ba dạng bài nằm ở ba panel riêng, vì luật của chúng khác hẳn nhau.
 */
export function ListenSetScreen({ slug, setId, day }) {
  const set = day.listening.find((s) => s.code === setId);
  const { day: state, ready, answer, setDictation } = useProgress(slug);
  const [idx, setIdx] = useState(0);

  const crumbs = lessonCrumbs(
    slug,
    day.title,
    { label: 'Luyện nghe', href: `/day/${slug}/listen` },
    set?.title || setId,
  );

  // Guard phải đứng TRƯỚC mọi chỗ đụng tới `set` — trước đây nó nằm sau đoạn
  // tính khoá câu, nên gõ sai setId trên URL là trắng màn hình chứ không phải
  // hiện thông báo này.
  if (!set) {
    return (
      <>
        <TopBar crumbs={crumbs} />
        <Notice>Không tìm thấy bộ bài &ldquo;{setId}&rdquo;.</Notice>
      </>
    );
  }

  const item = set.questions[idx];
  const saved = ready ? state.listen[item.id] : null;
  const solved = Boolean(saved?.correct);
  const locked = ready && isLocked(set, idx, state.listen);

  const goto = (i) => setIdx(Math.max(0, Math.min(i, set.questions.length - 1)));

  const writeDictationLine = (i, value) => {
    const lines = [...(state.dictation[item.id] || [])];
    lines[i] = value;
    setDictation(item.id, lines);
  };

  return (
    <>
      <TopBar crumbs={crumbs} />

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
            <DictationPanel
              key={item.id}
              item={item}
              slug={slug}
              lines={(ready && state.dictation[item.id]) || []}
              onChangeLine={writeDictationLine}
            />
          ) : !set.hasKey ? (
            <ClassNotesPanel
              key={item.id}
              item={item}
              note={(ready && state.dictation[item.id]?.[0]) || ''}
              onNoteChange={(value) => setDictation(item.id, [value])}
            />
          ) : locked ? (
            <Notice>🔒 Trả lời đúng câu {set.questions[idx - 1].no} thì câu này mới mở</Notice>
          ) : (
            <ChoicePanel
              key={item.id}
              item={item}
              saved={saved}
              onAnswer={(letter, correct) => answer(item.id, letter, correct)}
              onSkip={() => goto(idx + 1)}
            />
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
