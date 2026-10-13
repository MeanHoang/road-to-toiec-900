'use client';

// Trạng thái MỘT lượt thi đang chạy.
//
// Một đề có HAI CHẶNG — Listening rồi Reading — và hai chặng có luật khác
// nhau, nên không gộp thành một đồng hồ duy nhất:
//   - Listening chạy theo BĂNG: audio phát nối liền từ đầu tới cuối, người thi
//     không điều khiển nhịp. Hết băng là sang Reading.
//   - Reading 75 phút riêng, tự chia giờ. Hết giờ là nộp.
//
// Tách khỏi màn hình vì đây là chỗ dễ sai nhất: đồng hồ phải chạy tiếp khi đổi
// câu, phải tự chuyển chặng, và không được chạy lại từ đầu mỗi lần render.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tapeOf } from './buildExam';

/**
 * @param paper  { sections: [{ kind, label, seconds, questions }] }
 * @param onDone gọi đúng một lần khi nộp cả đề, nhận mảng lựa chọn theo thứ tự
 *               câu của cả đề
 */
export function useExamRun(paper, onDone) {
  // Danh sách phẳng, kèm chặng của từng câu — màn hình chỉ cần một chỉ số.
  const flat = useMemo(
    () =>
      paper.sections.flatMap((s, si) =>
        s.questions.map((q) => ({ question: q, sectionIndex: si })),
      ),
    [paper],
  );
  const firstOf = useMemo(() => {
    const out = [];
    let n = 0;
    for (const s of paper.sections) {
      out.push(n);
      n += s.questions.length;
    }
    return out;
  }, [paper]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(() => flat.map(() => null));
  const [left, setLeft] = useState(paper.sections[0].seconds);
  const [done, setDone] = useState(false);

  const sectionIndex = flat[index].sectionIndex;
  const section = paper.sections[sectionIndex];
  const last = sectionIndex === paper.sections.length - 1;

  // Giữ bản mới nhất trong ref: đồng hồ nằm trong effect chạy mỗi khi đổi
  // chặng, nên nó không đọc được state của lần render sau.
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  const doneRef = useRef(false);

  const submit = useCallback(() => {
    if (doneRef.current) return; // hết giờ và bấm nộp cùng lúc thì chỉ tính một
    doneRef.current = true;
    setDone(true);
    onDone(pickedRef.current);
  }, [onDone]);

  /** Sang chặng sau; đang ở chặng cuối thì nộp cả đề. */
  const nextSection = useCallback(() => {
    if (last) return submit();
    setIndex(firstOf[sectionIndex + 1]);
  }, [last, submit, firstOf, sectionIndex]);

  // BĂNG của chặng Listening: các đoạn audio theo thứ tự đề, phát nối nhau.
  //
  // Băng tách khỏi câu đang xem. Người thi được quay lại câu trước để sửa đáp
  // án — phiếu trả lời nằm trên bàn — nhưng băng vẫn chạy tiếp, không dừng,
  // không phát lại. Hết một đoạn thì màn hình nhảy tới câu đầu của đoạn sau,
  // như loa đọc "Number 8" là ai cũng lật sang câu 8.
  const tape = useMemo(
    () => (section.kind === 'listening' ? tapeOf(section.questions) : []),
    [section],
  );
  const [tapePos, setTapePos] = useState(0);
  useEffect(() => setTapePos(0), [sectionIndex]);

  const tapeEnded = useCallback(() => {
    const next = tapePos + 1;
    if (next >= tape.length) return nextSection(); // hết băng là hết phần nghe
    setTapePos(next);
    setIndex(firstOf[sectionIndex] + tape[next].from);
  }, [tapePos, tape, nextSection, firstOf, sectionIndex]);

  // Đồng hồ của CHẶNG đang chạy. Đếm theo mốc thời gian thật chứ không trừ dần
  // mỗi giây: tab bị ẩn thì trình duyệt bóp nhịp setInterval, trừ dần sẽ cho
  // người thi thêm giờ.
  //
  // Chặng Listening: đồng hồ chỉ để XEM. Nó dài đúng bằng băng, nhưng mỗi đoạn
  // băng tải mất vài phần mười giây, cộng dồn 50 đoạn thì đồng hồ về 0 trước
  // khi băng hết — cắt ngang khoảng nghỉ của câu cuối. Băng mới là thứ quyết
  // định hết phần nghe (`tapeEnded`).
  useEffect(() => {
    if (doneRef.current) return undefined;
    const current = paper.sections[sectionIndex];
    const end = Date.now() + current.seconds * 1000;
    const t = setInterval(() => {
      const remain = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        clearInterval(t);
        if (current.kind !== 'listening') nextSection();
      }
    }, 250);
    return () => clearInterval(t);
    // Chỉ chạy lại khi ĐỔI CHẶNG, không phải khi đổi câu — nếu không thì mỗi
    // lần bấm "Câu sau" là đồng hồ được đặt lại từ đầu.
  }, [sectionIndex, paper.sections, nextSection]);

  const choose = useCallback(
    (letter) =>
      setPicked((prev) => {
        const next = [...prev];
        next[index] = letter;
        return next;
      }),
    [index],
  );

  /**
   * Đi tới câu khác, TRONG chặng đang thi.
   *
   * Không bao giờ nhảy sang chặng khác. Handbook của ETS xếp việc đó vào hành
   * vi vi phạm: "Referring to, looking through, or working on any test or test
   * section when not authorized to do so".
   *
   * TRONG một chặng thì đi lại tự do, kể cả chặng Listening. Giống phòng thi
   * thật: phiếu trả lời nằm trên bàn, muốn tô lại ô nào trong phần đang thi
   * cũng được. Thứ không quay lại được là BĂNG, không phải tờ phiếu — băng
   * chạy riêng, đi lại giữa các câu không làm nó dừng hay phát lại.
   *
   * Và chính ETS khuyên làm vậy ở phần Đọc: "if you do not know the answer to
   * a question, come back to it later".
   */
  const go = useCallback(
    (to) => {
      const from = firstOf[sectionIndex];
      const until = from + paper.sections[sectionIndex].questions.length - 1;
      setIndex(Math.min(Math.max(to, from), until));
    },
    [firstOf, sectionIndex, paper.sections],
  );


  const inSection = index - firstOf[sectionIndex];
  const sectionTotal = section.questions.length;

  return {
    index,
    question: flat[index].question,
    section,
    /** Đoạn băng đang phát (chặng Listening), và báo khi nó phát xong. */
    tape: tape[tapePos] ? { src: tape[tapePos].src, key: `${sectionIndex}-${tapePos}` } : null,
    tapeEnded,
    /** Trạng thái từng câu TRONG chặng, cho ô chọn câu. */
    // `no` là số câu IN TRONG ĐỀ (Part 3 bắt đầu từ 32), không đếm lại từ 1:
    // loa đọc "Number 32" thì ô phải ghi 32. `at` là vị trí trong chặng.
    marks: section.questions.map((q, i) => ({
      no: q.no,
      at: i,
      picked: Boolean(picked[firstOf[sectionIndex] + i]),
      current: i === index - firstOf[sectionIndex],
    })),
    goInSection: (i) => go(firstOf[sectionIndex] + i),
    atSectionStart: index === firstOf[sectionIndex],
    sectionIndex,
    isLastSection: last,
    noInSection: inSection + 1,
    sectionTotal,
    atSectionEnd: inSection === sectionTotal - 1,
    picked,
    pickedHere: picked[index],
    answered: picked.filter(Boolean).length,
    total: flat.length,
    left,
    done,
    choose,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    nextSection,
    submit,
  };
}

/**
 * "02:34" — phút:giây, luôn hai chữ số để con số không nhảy qua nhảy lại.
 * Từ một tiếng trở lên thì "1:56:51": cả đề dài gần hai tiếng, "116:51" phải
 * nhẩm mới ra.
 */
export function clock(s) {
  const pad = (n) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}
