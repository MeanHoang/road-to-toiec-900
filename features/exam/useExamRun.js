'use client';

// Trạng thái MỘT lượt thi đang chạy.
//
// Một đề có HAI CHẶNG — Nghe rồi Đọc — và hai chặng có luật khác nhau, nên
// không gộp thành một đồng hồ duy nhất:
//   - Nghe 45 phút, hết giờ là mất phần đó, không quay lại được.
//   - Đọc 75 phút riêng, tự chia giờ.
// Hết giờ chặng Nghe thì nhảy thẳng sang chặng Đọc, đúng như phòng thi thật.
//
// Tách khỏi màn hình vì đây là chỗ dễ sai nhất: đồng hồ phải chạy tiếp khi đổi
// câu, phải tự chuyển chặng, và không được chạy lại từ đầu mỗi lần render.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

  // Đồng hồ của CHẶNG đang chạy. Đếm theo mốc thời gian thật chứ không trừ dần
  // mỗi giây: tab bị ẩn thì trình duyệt bóp nhịp setInterval, trừ dần sẽ cho
  // người thi thêm giờ.
  useEffect(() => {
    if (doneRef.current) return undefined;
    const end = Date.now() + paper.sections[sectionIndex].seconds * 1000;
    const t = setInterval(() => {
      const remain = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(remain);
      if (remain === 0) {
        clearInterval(t);
        nextSection();
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
   * TRONG một chặng thì đi lại tự do, kể cả chặng Nghe. Giống phòng thi thật:
   * phiếu trả lời nằm trên bàn, muốn tô lại ô nào trong phần đang thi cũng
   * được. Thứ không quay lại được là BĂNG, không phải tờ phiếu — nên quay lại
   * câu cũ thì audio KHÔNG phát lại (xem `played` bên dưới).
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

  /**
   * Câu đang mở có phải lần ĐẦU đi tới không. Quay lại câu cũ thì xem lại tranh
   * và đổi đáp án được, nhưng audio không phát lại — băng trong phòng thi
   * không chạy ngược.
   *
   * Suy từ CÂU XA NHẤT đã tới, chứ không ghi dấu "đã nghe" vào một Set: ghi
   * dấu thì phải sửa dữ liệu ngay trong lúc render, mà React ở chế độ dev
   * render hai lần — lần thứ hai đọc thấy dấu vừa ghi và kết luận câu đầu tiên
   * "đã nghe rồi", nên audio không bao giờ phát. Đã dính đúng lỗi đó.
   */
  const [furthest, setFurthest] = useState(-1);
  useEffect(() => setFurthest((m) => Math.max(m, index)), [index]);

  // `index > furthest`: chỉ phát khi đi XA HƠN chỗ đã tới. Lùi lại hay nhảy
  // về câu cũ đều im.
  //
  // Hai lần sửa hụt trước đó, ghi ra để đừng lặp lại:
  //   - `>=` thì riêng câu xa nhất cứ quay về là phát lại, các câu trước thì
  //     không — đo được: 1→2→3, lùi 2 (im, đúng), tiến lại 3 thì PHÁT (sai).
  //   - Chốt kết quả theo TỪNG CÂU vào một Map thì sai kiểu khác: câu nào cũng
  //     được chốt "true" ở lần đầu tới, nên quay lại là phát lại hết.
  // Thứ cần chốt là LẦN ĐẾN, không phải câu — và chốt ở chỗ phát (PlayOnce giữ
  // giá trị lúc nó được dựng), không phải ở đây.
  const firstListen = index > furthest;

  const inSection = index - firstOf[sectionIndex];
  const sectionTotal = section.questions.length;

  return {
    index,
    question: flat[index].question,
    section,
    /** Câu đang mở đã nghe lần nào chưa — chưa thì mới cho audio tự phát. */
    firstListen,
    /** Trạng thái từng câu TRONG chặng, cho ô chọn câu. */
    marks: section.questions.map((_, i) => ({
      no: i + 1,
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

/** "02:34" — phút:giây, luôn hai chữ số để con số không nhảy qua nhảy lại. */
export const clock = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
