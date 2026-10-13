'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Phòng thi. Ba chặng trong một màn: chọn đề → làm bài → kết quả.
//
// Một màn chứ không phải ba route: giữa chừng mà đổi URL thì bấm Back là mất
// bài đang làm, và đồng hồ thì không quay lại được.
//
// KHÔNG thuộc buổi học nào. Mỗi đề là một đề TOEIC trọn vẹn 200 câu lấy
// nguyên từ một bộ đề (content/exam/), nên nó nằm ở /exam chứ không nằm dưới
// /day/[slug].

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Callout } from '@/shared/ui/atoms/Callout';
import { LoadingBlock } from '@/shared/ui/molecules/LoadingBlock';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { Modal } from '@/shared/ui/organisms/Modal';
import { useAuth } from '@/features/auth/AuthProvider';
import { useProgress } from '@/features/progress/useProgress';
import { ExamPicker } from './ExamPicker';
import { ExamQuestion, Tape } from './ExamQuestion';
import { ExamResult } from './ExamResult';
import { QuestionPalette } from './QuestionPalette';
import { buildPaper, newAttempt, paperSummary } from './buildExam';
import { useExamContent } from './useExamContent';
import { clock, useExamRun } from './useExamRun';

// Kết quả thi lưu dưới khoá riêng, không phải một buổi học. Tầng tiến độ vốn
// khoá theo buổi, dùng lại nó thì không phải viết thêm đường đồng bộ nào — đổi
// lại document trên Firestore nằm cạnh các buổi, nên tên phải nói rõ nó không
// phải buổi học.
const EXAM_SLUG = 'exam-room';

export function ExamScreen() {
  const t = useTranslation();
  const { day: progress, ready, saveAttempt } = useProgress(EXAM_SLUG);
  const { name: learner } = useAuth();
  const { forms } = useExamContent();

  const [paper, setPaper] = useState(null); // đề đang làm
  const [attempt, setAttempt] = useState(null); // lượt vừa nộp
  const [reviewQuestions, setReviewQuestions] = useState([]);

  // Mỗi đề là một file đề trọn vẹn, nên "Đề số 1" giống nhau với mọi người học
  // và không đổi khi thêm đề mới — so điểm giữa các lần thi mới có nghĩa.
  const papers = useMemo(() => forms.map(paperSummary), [forms]);

  const history = useMemo(() => Object.values(progress.exams || {}), [progress.exams]);

  /** `only` = null thi cả đề, hoặc số Part để thi riêng Part đó. */
  const start = (paperId, only) => {
    const form = forms.find((f) => f.form === paperId);
    const built = form ? buildPaper(form, only) : null;
    if (built) {
      setAttempt(null);
      setPaper(built);
    }
  };

  const finish = useCallback(
    (picked) => {
      const a = newAttempt(paper, learner);
      a.answers = a.answers.map((x, i) => ({ ...x, picked: picked[i] }));
      a.correct = a.answers.filter((x) => x.picked === x.answer).length;
      saveAttempt(a);
      setReviewQuestions(paper.sections.flatMap((s) => s.questions));
      setAttempt(a);
      setPaper(null);
    },
    [paper, saveAttempt, learner],
  );

  if (!ready) {
    return (
      <LoadingBlock label={t('Preparing the exam room')}>
        <div />
      </LoadingBlock>
    );
  }

  // `key` theo thời điểm bắt đầu: bấm "Thi lại" thì Running phải dựng LẠI TỪ
  // ĐẦU. Không có key thì React tái dùng component cũ, giữ nguyên trạng thái
  // "đã nghe tới câu mấy" của lượt trước — và lượt thi mới sẽ câm từ đầu.
  if (paper) return <Running key={paper.startedAt} paper={paper} onDone={finish} />;

  if (attempt) {
    return (
      <>
        <PageHeader eyebrow={t('Exam room')} title={t('Results')} />
        <ExamResult
          attempt={attempt}
          questions={reviewQuestions}
          onAgain={() => start(attempt.paperId, attempt.only ?? null)}
          onBack={() => setAttempt(null)}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t('Exam room')}
        title={t('Practice test')}
        subtitle={
          learner
            ? t('{0} — your results are saved to your account across devices.', [learner])
            : t('A full TOEIC test with 200 questions across 7 parts. Listening follows the audio; Reading is self-paced within the time limit.')
        }
      />
      <ExamPicker papers={papers} history={history} onStart={start} />
      <Callout style={{ marginTop: 'var(--space-5)' }}>
        {t('Questions, images, and answers come from an official ETS practice test. Listening audio uses computer-generated speech from the test script. Results show correct-answer counts because ETS does not publish a conversion table for the 10–990 score scale.')}
      </Callout>
    </>
  );
}

/**
 * Chặng làm bài. Tách ra để hook đồng hồ chỉ sống đúng lúc đang thi.
 *
 * Bố cục MỘT MÀN HÌNH, không cuộn trang: thanh giờ trên cùng, ô chọn câu cột
 * trái, câu hỏi bên phải. Đang tính giờ mà phải cuộn xuống mới thấy ô chọn câu
 * thì nó vô dụng — người thi cần nhìn một phát ra cả ba thứ: còn bao lâu, còn
 * câu nào trống, câu đang làm.
 *
 * Màn hẹp thì xếp dọc: ô chọn câu thành một dải cuộn ngang nằm ngay dưới thanh
 * giờ, phần câu hỏi chiếm chỗ còn lại.
 */
function Running({ paper, onDone }) {
  const t = useTranslation();
  const run = useExamRun(paper, onDone);
  const [confirming, setConfirming] = useState(false);

  // Cảnh báo khi đóng tab giữa lúc đang thi — mất bài thì không lấy lại được.
  useEffect(() => {
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const blank = run.marks.filter((m) => !m.picked).length;
  const endLabel = run.isLastSection ? t('Submit test') : t('Finish {0}', [t(run.section.label)]);

  return (
    <div className="exam-run">
      <div className="exam-bar">
        {/* Thi riêng một phần thì tên đề đã chứa tên phần rồi — ghép nữa ra
            "Đề số 1 — phần Đọc · Phần Đọc". */}
        <span className="exam-bar-label">
          {t(paper.only ? paper.label : `${paper.label} · ${run.section.label}`)}
        </span>
        <b className={`exam-clock ${run.left <= 30 ? 'is-low' : ''}`}>{clock(run.left)}</b>
        <span className="caption">
          {t('Question')} {run.noInSection}/{run.sectionTotal} {t('· answered')} {run.answered}/{run.total}
        </span>
      </div>

      <aside className="exam-side">
        <QuestionPalette marks={run.marks} onGo={run.goInSection} />

        {/* Câu trước / Câu sau CHỈ đi lại giữa các câu, không bao giờ kết thúc
            phần thi. Kết thúc là một nút riêng, vì nó không thể hoàn tác: sang
            phần sau rồi thì không quay lại được. Bấm nhầm "Câu sau" ở câu cuối
            mà mất cả phần thi thì quá đắt. */}
        <div className="exam-actions">
          <Button onClick={run.prev} disabled={run.atSectionStart}>
            {t('Previous question')}
          </Button>
          <Button variant="primary" onClick={run.next} disabled={run.atSectionEnd}>
            {t('Next question')}
          </Button>
        </div>
        <Button variant="quiet" onClick={() => setConfirming(true)}>
          {t(endLabel)}
        </Button>
      </aside>

      <div className="exam-main">
        {/* Băng nằm NGOÀI câu hỏi: đổi câu không làm băng dừng hay phát lại.
            `key` theo đoạn băng — sang đoạn mới mới dựng lại và phát. */}
        {run.tape && <Tape key={run.tape.key} src={run.tape.src} onEnded={run.tapeEnded} />}
        <ExamQuestion
          key={run.question.id}
          question={run.question}
          picked={run.pickedHere}
          onPick={run.choose}
        />
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title={`${t(endLabel)}?`}>
        <p>
          {run.isLastSection
            ? t('Your test will be graded immediately. You cannot change your answers after submitting.')
            : t('Once you start {0}, you cannot return to {1}.', [t(nextLabel(paper, run.sectionIndex)), t(run.section.label)])}
        </p>
        {blank > 0 && (
          <p className="caption">
            {t('There are')} <b>{blank} {t('unanswered questions')}</b> {t('in this section. Unanswered questions count as incorrect.')}
          </p>
        )}
        <div className="exam-actions" style={{ marginTop: 'var(--space-4)' }}>
          <Button onClick={() => setConfirming(false)}>{t('Continue test')}</Button>
          <Button
            variant="primary"
            onClick={() => {
              setConfirming(false);
              run.nextSection();
            }}
          >
            {t(endLabel)}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const nextLabel = (paper, i) => paper.sections[i + 1]?.label ?? 'the next section';
