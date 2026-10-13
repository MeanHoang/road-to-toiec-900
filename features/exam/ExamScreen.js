'use client';

// Phòng thi. Ba chặng trong một màn: chọn đề → làm bài → kết quả.
//
// Một màn chứ không phải ba route: giữa chừng mà đổi URL thì bấm Back là mất
// bài đang làm, và đồng hồ thì không quay lại được.
//
// KHÔNG thuộc buổi học nào. Đề rút câu nghe từ mọi buổi và câu đọc từ đề mẫu
// ETS, nên nó nằm ở /exam chứ không nằm dưới /day/[slug].

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { Callout } from '@/shared/ui/atoms/Callout';
import { LoadingBlock } from '@/shared/ui/molecules/LoadingBlock';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { Progress } from '@/shared/ui/atoms/Progress';
import { Modal } from '@/shared/ui/organisms/Modal';
import { useAuth } from '@/features/auth/AuthProvider';
import { useDayList } from '@/features/lesson/useDayList';
import { useProgress } from '@/features/progress/useProgress';
import { ExamPicker } from './ExamPicker';
import { ExamQuestion } from './ExamQuestion';
import { ExamResult } from './ExamResult';
import { QuestionPalette } from './QuestionPalette';
import { buildPaper, newAttempt } from './buildExam';
import { useExamContent } from './useExamContent';
import { clock, useExamRun } from './useExamRun';

// Kết quả thi lưu dưới khoá riêng, không phải một buổi học. Tầng tiến độ vốn
// khoá theo buổi, dùng lại nó thì không phải viết thêm đường đồng bộ nào — đổi
// lại document trên Firestore nằm cạnh các buổi, nên tên phải nói rõ nó không
// phải buổi học.
const EXAM_SLUG = 'exam-room';

export function ExamScreen() {
  const { days, loading } = useDayList();
  const { day: progress, ready, saveAttempt } = useProgress(EXAM_SLUG);
  const { name: learner } = useAuth();
  const { papers: paperDefs, forms } = useExamContent();

  const [paper, setPaper] = useState(null); // đề đang làm
  const [attempt, setAttempt] = useState(null); // lượt vừa nộp

  // Danh sách đề đọc từ DỮ LIỆU (content/exam/papers.json), không tự tính.
  // "Đề số 1" vì thế giống nhau với mọi người học và không đổi khi nhập thêm
  // buổi mới — có vậy mới so điểm giữa các lần thi và giữa các người thi.
  const papers = useMemo(
    () => paperDefs.map((def) => buildPaper(days, forms, def)).filter(Boolean),
    [days, paperDefs, forms],
  );

  const history = useMemo(() => Object.values(progress.exams || {}), [progress.exams]);

  const start = (nth, only) => {
    const def = paperDefs.find((d) => d.no - 1 === nth);
    const built = buildPaper(days, forms, def, only);
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
      setAttempt(a);
      setPaper(null);
    },
    [paper, saveAttempt, learner],
  );

  if (loading || !ready) {
    return (
      <LoadingBlock label="Đang chuẩn bị phòng thi">
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
        <PageHeader eyebrow="Phòng thi" title="Kết quả" />
        <ExamResult
          attempt={attempt}
          onAgain={() => start(attempt.nth ?? 0, attempt.only ?? null)}
          onBack={() => setAttempt(null)}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Phòng thi"
        title="Thi thử"
        subtitle={
          learner
            ? `${learner} — kết quả lưu vào tài khoản, đổi máy vẫn còn.`
            : 'Chạy đúng nhịp đề thật: hai phần, hai đồng hồ riêng, audio nghe một lần.'
        }
      />
      <ExamPicker papers={papers} history={history} onStart={start} />
      <Callout style={{ marginTop: 'var(--space-5)' }}>
        Câu nghe lấy từ chính tài liệu khoá học. Câu đọc lấy từ đề mẫu chính thức ETS phát hành
        miễn phí. Kết quả chỉ tính số câu đúng — ETS không công khai bảng quy đổi ra thang
        10–990, nên app không bịa ra một con số điểm.
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
  const run = useExamRun(paper, onDone);
  const [confirming, setConfirming] = useState(false);

  // Cảnh báo khi đóng tab giữa lúc đang thi — mất bài thì không lấy lại được.
  useEffect(() => {
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const blank = run.marks.filter((m) => !m.picked).length;
  const endLabel = run.isLastSection ? 'Nộp bài' : `Kết thúc ${run.section.label}`;

  return (
    <div className="exam-run">
      <div className="exam-bar">
        {/* Thi riêng một phần thì tên đề đã chứa tên phần rồi — ghép nữa ra
            "Đề số 1 — phần Đọc · Phần Đọc". */}
        <span className="exam-bar-label">
          {paper.only ? paper.label : `${paper.label} · ${run.section.label}`}
        </span>
        <b className={`exam-clock ${run.left <= 30 ? 'is-low' : ''}`}>{clock(run.left)}</b>
        <span className="caption">
          Câu {run.noInSection}/{run.sectionTotal} · đã chọn {run.answered}/{run.total}
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
            Câu trước
          </Button>
          <Button variant="primary" onClick={run.next} disabled={run.atSectionEnd}>
            Câu sau
          </Button>
        </div>
        <Button variant="quiet" onClick={() => setConfirming(true)}>
          {endLabel}
        </Button>
      </aside>

      {/* `key` đổi theo câu để component dựng lại — nhờ đó audio chạy đúng một
          lần cho mỗi câu, không phát lại khi bấm chọn đáp án. */}
      <div className="exam-main">
        <ExamQuestion
          key={run.question.id}
          question={run.question}
          picked={run.pickedHere}
          onPick={run.choose}
          firstListen={run.firstListen}
        />
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title={`${endLabel}?`}>
        <p>
          {run.isLastSection
            ? 'Nộp rồi là chấm luôn, không sửa lại được.'
            : `Sang ${nextLabel(paper, run.sectionIndex)} rồi thì không quay lại ${run.section.label} được nữa.`}
        </p>
        {blank > 0 && (
          <p className="caption">
            Còn <b>{blank} câu chưa làm</b> trong phần này. Bỏ trống tính như trả lời sai.
          </p>
        )}
        <div className="exam-actions" style={{ marginTop: 'var(--space-4)' }}>
          <Button onClick={() => setConfirming(false)}>Quay lại làm tiếp</Button>
          <Button
            variant="primary"
            onClick={() => {
              setConfirming(false);
              run.nextSection();
            }}
          >
            {endLabel}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const nextLabel = (paper, i) => paper.sections[i + 1]?.label ?? 'phần sau';
