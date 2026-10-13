// Luật của phòng thi. Không React, không fetch — có test riêng:
//   npm run test:exam
//
// Phòng thi KHÔNG thuộc buổi học nào. Nó rút câu từ mọi buổi, xếp theo Part của
// đề thi thật, rồi chạy đúng nhịp thi: phát một lần, không tua, khoá đáp án.
// Vì vậy nó là feature riêng chứ không phải một nút trong màn Luyện nghe.

/**
 * Cấu trúc đề thi thật, phần Listening.
 * Nguồn: trang cấu trúc đề của IIBC (đơn vị tổ chức TOEIC), đối chiếu ETS.
 * 45 phút cho 100 câu nghe: Part 1 sáu câu, Part 2 hai lăm, Part 3 ba chín,
 * Part 4 ba mươi.
 *
 * `seconds` là giây cho MỖI câu, gồm CẢ thời gian phát audio chứ không chỉ
 * khoảng lặng để chọn đáp án. Tính thiếu phần audio thì Part 1 ra 30 giây cho
 * cả bài 6 câu — trong khi riêng một file audio đã hơn 20 giây.
 *
 * Số đo từ chính audio khoá học (ffprobe, toàn bộ câu dùng được):
 *   Part 1: audio trung vị 25,2s (40 câu) → 25 + 5 = 30
 *   Part 2: audio trung vị 19,3s (32 câu) → 19 + 5 = 24
 *   Part 3: audio trung vị 77,5s (24 câu), nhưng một đoạn hội thoại dùng cho
 *           3 câu → 77,5/3 ≈ 26 + 5 = 31
 *   Part 4: CHƯA có nội dung để đo. 28 là suy từ tổng 45 phút của đề thật sau
 *           khi trừ ba Part trên. Đo lại khi có nội dung.
 *
 * Năm giây là khoảng lặng của đề thật sau mỗi câu Part 1 và Part 2.
 *
 * KHÔNG khai Part 5-7: đó là phần Đọc, không có audio, và được xử lý riêng ở
 * cuối file này.
 */
export const PARTS = [
  { part: 1, label: 'Part 1 — Tả tranh', questions: 6, seconds: 30 },
  { part: 2, label: 'Part 2 — Hỏi đáp', questions: 25, seconds: 24 },
  { part: 3, label: 'Part 3 — Hội thoại', questions: 39, seconds: 31 },
  { part: 4, label: 'Part 4 — Bài nói', questions: 30, seconds: 28 },
];

export const partSpec = (part) => PARTS.find((p) => p.part === part) || null;

/**
 * Bộ bài này thuộc Part mấy. Giống `hasPhoto` bên listening/rules.js: bộ cũ
 * không khai `part` đều là Part 1, vì buổi 1 và 2 của khoá đều là tả tranh.
 */
export const partOfSet = (set) => set?.part || 1;

/**
 * Câu này có dùng được trong phòng thi không.
 *
 * Bốn điều kiện, và cả bốn đều là điều kiện CỨNG chứ không phải sở thích:
 *   - bộ phải là trắc nghiệm: chép chính tả không phải dạng thi
 *   - bộ phải có đáp án chính thức (`hasKey`): không chấm được thì không thi được
 *   - bản thân câu phải có đáp án: trong một bộ có đáp án vẫn có câu bỏ trống
 *   - phải có audio: thi nghe mà không có tiếng thì không còn là thi nghe
 *
 * Hôm nay luật này loại 24 câu chép chính tả và 20 câu practice thiếu đáp án
 * của buổi 1 và 2. Đó là loại đúng, không phải mất mát.
 */
export function isExamReady(set, question) {
  if (set?.mode !== 'choice') return false;
  if (!set?.hasKey) return false;
  if (!question?.answer) return false;
  return Boolean(question?.audio);
}

/**
 * Mọi câu dùng được, gom từ danh sách buổi, kèm Part của nó.
 *
 * Nhận đúng thứ `useDayList()` trả về, nên phòng thi không cần tầng nạp dữ
 * liệu riêng — trang chủ đã tải sẵn nội dung mọi buổi rồi.
 */
export function examPool(days) {
  const out = [];
  for (const day of days || []) {
    for (const set of day.listening || []) {
      const part = partOfSet(set);
      for (const q of set.questions || []) {
        if (isExamReady(set, q)) out.push({ ...q, part, setId: set.id, daySlug: day.slug });
      }
    }
  }
  return out;
}

/** Đếm số câu dùng được theo từng Part: { 1: 40, 2: 0, ... } */
export function poolByPart(days) {
  const n = {};
  for (const p of PARTS) n[p.part] = 0;
  for (const q of examPool(days)) n[q.part] = (n[q.part] || 0) + 1;
  return n;
}

/**
 * Part này thi được chưa, và nếu chưa thì vì sao.
 *
 * Cho thi khi kho có ÍT NHẤT đủ số câu của đề thật. Không cho thi "Part 2 với
 * 8 câu" rồi gọi đó là Part 2: nhịp 25 câu liên tục chính là cái khó của Part
 * 2, thi 8 câu thì không tái hiện được gì.
 */
export function partStatus(days, part) {
  const spec = partSpec(part);
  if (!spec) return { ready: false, have: 0, need: 0, reason: 'Part không có trong phần nghe' };

  const have = poolByPart(days)[part] || 0;
  if (have >= spec.questions) return { ready: true, have, need: spec.questions, reason: null };

  return {
    ready: false,
    have,
    need: spec.questions,
    reason: have === 0 ? 'Chưa có câu nào' : `Mới có ${have}/${spec.questions} câu`,
  };
}

/** Số câu đúng trong một lượt thi đã nộp. */
export const countCorrect = (attempt) =>
  (attempt?.answers || []).filter((a) => a.picked && a.picked === a.answer).length;

/* ========================================================================= */
/* PHẦN ĐỌC                                                                  */
/* ========================================================================= */

/**
 * Đề mẫu ETS cho 30 câu Đọc — nhưng RIÊNG Part 5 của đề thật đã cần 30 câu,
 * Part 6 cần 16, Part 7 cần 54. Nghĩa là không Part Đọc nào đủ câu để chạy
 * đúng chuẩn.
 *
 * Nên phần Đọc KHÔNG chia theo Part như phần Nghe. Mỗi đề mẫu là một bài thi
 * riêng, đúng số câu nó có. Gọi nó là "Part 5" rồi cho thi 5 câu là nói sai về
 * thứ người học đang làm.
 *
 * Thời gian tính theo nhịp thật: đề thật cho 75 phút làm 100 câu Đọc, tức 45
 * giây một câu. Giữ đúng tỉ lệ đó thì sức ép thời gian giống hệt, dù bài ngắn
 * hơn.
 */
export const READING_SECONDS_PER_QUESTION = 45;

/** Các bộ của một đề đọc, kèm số câu. `forms` là thứ examContent trả về. */
export function readingExams(forms) {
  return (forms || [])
    .map((form) => {
      const questions = (form.sets || []).flatMap((s) => s.questions || []);
      const usable = questions.filter((q) => q.answer && Object.keys(q.options || {}).length === 4);
      return {
        id: form.form,
        label: form.title,
        note: form.note || null,
        sets: form.sets || [],
        total: usable.length,
        seconds: usable.length * READING_SECONDS_PER_QUESTION,
      };
    })
    .filter((e) => e.total > 0);
}

/**
 * Mọi bài thi chạy được ngay, cả Nghe lẫn Đọc, theo thứ tự của đề thật.
 *
 * Một chỗ duy nhất trả lời "hôm nay thi được những gì" — màn chọn đề và nút ở
 * trang chủ đều đọc từ đây, nên thêm nội dung mới là tự hiện ra, không phải
 * sửa hai nơi.
 */
export function availableExams(days, forms) {
  const listening = PARTS.map((p) => {
    const st = partStatus(days, p.part);
    return {
      kind: 'listening',
      id: `part-${p.part}`,
      part: p.part,
      label: p.label,
      total: p.questions,
      ready: st.ready,
      reason: st.reason,
      have: st.have,
    };
  });

  const reading = readingExams(forms).map((e) => ({
    kind: 'reading',
    id: e.id,
    part: null,
    label: e.label,
    total: e.total,
    seconds: e.seconds,
    ready: true,
    reason: null,
    have: e.total,
    sets: e.sets,
  }));

  return [...listening, ...reading];
}
