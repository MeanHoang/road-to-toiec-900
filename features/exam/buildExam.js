// Rút một đề thi từ kho câu. Không React — có test riêng: npm run test:exam.

// Đuôi .js là BẮT BUỘC và đường dẫn phải tương đối, không phải thừa: file này
// còn được `node` chạy thẳng trong scripts/test-exam.mjs, mà Node ESM không
// hiểu alias `@/` và cũng không tự đoán đuôi như webpack. Giống dictation.js.
//
// KHÔNG trộn ngẫu nhiên gì ở đây nữa: một đề phải cố định thì hai lần thi mới
// so được điểm với nhau.
import { PARTS, examPool, partSpec, READING_SECONDS_PER_QUESTION } from './rules.js';

/**
 * Các BỘ dùng được của một Part, mỗi bộ giữ nguyên thứ tự câu bên trong.
 *
 * Chỉ nhận bộ MỘT MÌNH ĐỦ số câu của Part đó. Ghép hai bộ thì số thứ tự gãy ở
 * chỗ nối: bốn câu đầu lấy từ bộ A (loa đọc 1-4), hai câu sau lấy từ bộ B (loa
 * đọc 1-2) nhưng màn hình đã đếm tới 5-6. Đã gặp thật: màn hình ghi Câu 1 mà
 * loa đọc "number ten".
 */
export function partSets(days, part) {
  const spec = partSpec(part);
  if (!spec) return [];

  const bySet = new Map();
  for (const q of examPool(days).filter((x) => x.part === part)) {
    if (!bySet.has(q.setId)) bySet.set(q.setId, []);
    bySet.get(q.setId).push(q);
  }

  // Sắp theo id bộ để thứ tự ỔN ĐỊNH: "Đề số 2" hôm nay và hôm sau phải là
  // cùng một bộ câu, không thì không so được điểm hai lần thi.
  return [...bySet.entries()]
    .filter(([, qs]) => qs.length >= spec.questions)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, qs]) => qs.slice(0, spec.questions));
}

/**
 * Rút đề thứ `nth` (đếm từ 0) cho một Part. CỐ ĐỊNH, không ngẫu nhiên.
 *
 * Trước đây chỗ này bốc ngẫu nhiên mỗi lần vào, nên "Đề số 1" lần nào cũng là
 * một bộ câu khác — tên gọi nói một đằng, nội dung một nẻo, và hai lần thi
 * không so được với nhau. Muốn câu khác thì chọn đề khác, đó mới là ý nghĩa
 * của việc đánh số đề.
 */
export function buildExam(days, part, nth = 0) {
  const spec = partSpec(part);
  const sets = partSets(days, part);
  if (!spec || !sets.length) return null;

  return {
    kind: 'listening',
    part,
    label: spec.label,
    // Tổng thời gian = số câu × giây mỗi câu. Đề thật đo theo từng câu, nhưng
    // một đồng hồ tổng cho cả bài thì người thi tự phân bổ được, giống hệt lúc
    // ngồi phòng thi với một đồng hồ trên tường.
    seconds: spec.questions * spec.seconds,
    questions: sets[nth % sets.length],
  };
}

/**
 * Đề ĐỌC: giữ nguyên thứ tự và nguyên bộ, KHÔNG trộn.
 *
 * Khác hẳn phần Nghe. Câu Part 6 và Part 7 bám vào một đoạn văn — trộn lên thì
 * câu 149 rơi ra khỏi bài báo của nó và thành một câu hỏi không có ngữ cảnh.
 * Và vì đây là một đề mẫu có sẵn, thi đúng thứ tự của nó mới là tái hiện.
 *
 * Mỗi câu mang theo đoạn văn của bộ mình, để màn làm bài không phải tra ngược.
 */
export function buildReadingExam(form) {
  const questions = [];
  for (const set of form.sets || []) {
    for (const q of set.questions || []) {
      if (!q.answer || Object.keys(q.options || {}).length !== 4) continue;
      questions.push({ ...q, passage: set.passage, setId: set.id });
    }
  }
  if (!questions.length) return null;

  return {
    kind: 'reading',
    formId: form.form,
    label: form.title,
    seconds: questions.length * READING_SECONDS_PER_QUESTION,
    questions,
  };
}

/**
 * Một lượt thi để lưu lại. Id là thời điểm bắt đầu theo ISO.
 *
 * Dùng thời điểm làm id là cố ý: hai máy thi cùng lúc gần như không thể trùng
 * mili-giây, mà nếu trùng thật thì hai bản ghi giống hệt nhau nên gộp vào một
 * cũng không mất gì. Nhờ vậy gộp hai máy chỉ là hợp hai tập id, không cần luật
 * gộp riêng nào.
 */
export function newAttempt(paper, learner = null) {
  const sections = paper.sections || [{ kind: paper.kind, label: paper.label, questions: paper.questions }];
  const questions = sections.flatMap((s) => s.questions);

  return {
    id: new Date().toISOString(),
    label: paper.label ?? null,
    only: paper.only ?? null,
    // Số đề, để "Thi lại" dựng đúng đề cũ chứ không nhảy sang đề khác.
    nth: paper.nth ?? 0,
    // Tên người thi lưu cùng lượt thi, không tra ngược từ tài khoản lúc hiện
    // kết quả: đổi tên Google sau này thì bảng điểm cũ vẫn đúng tên lúc đó.
    learner,
    total: questions.length,
    // Ranh giới từng chặng, để màn kết quả chấm riêng Nghe và Đọc — đề thật
    // cũng trả hai điểm riêng chứ không trả một điểm gộp.
    sections: sections.map((s) => ({ kind: s.kind, label: s.label, count: s.questions.length })),
    answers: questions.map((q) => ({ id: q.id, answer: q.answer, picked: null })),
  };
}

/**
 * Dựng MỘT ĐỀ THI từ định nghĩa đề, gồm cả hai kỹ năng — đúng hình dạng đề thật.
 *
 * Một đề TOEIC Listening & Reading là 200 câu làm liền một mạch trong 2 tiếng:
 * 100 câu Nghe trong 45 phút, rồi vào thẳng 100 câu Đọc trong 75 phút. Không
 * phải hai bài thi rời nhau — nên phòng thi cũng không bày chúng thành hai mục.
 *
 * Hai phần có luật khác nhau nên mỗi phần là một chặng riêng, đồng hồ riêng:
 *   - Nghe: băng chạy, người thi không điều khiển nhịp, hết giờ là sang Đọc.
 *   - Đọc: tự chia giờ, lật qua lật lại thoải mái.
 *
 * `def` là một mục trong content/exam/papers.json — nó quyết định đề này gồm
 * BỘ NÀO. Nhờ vậy "Đề số 1" giống nhau với mọi người học và không đổi khi nhập
 * thêm buổi mới. Trước đây chỗ này tự bốc từ kho câu, nên mỗi lần vào là một
 * đề khác.
 *
 * `only` = 'listening' | 'reading' để thi riêng một phần. Đề thật không cho
 * chọn như vậy, nhưng đây là app luyện: ngồi đủ 2 tiếng mỗi lần thì không ai
 * luyện nổi. Thi riêng một phần vẫn giữ nguyên luật của phần đó.
 */
export function buildPaper(days, forms, def, only = null) {
  if (!def) return null;
  const sections = [];
  const shortfall = {};

  const wantListening = def.sections.find((s) => s.kind === 'listening');
  const wantReading = def.sections.find((s) => s.kind === 'reading');

  // --- Phần Nghe: đúng những bộ đề đã khai, theo thứ tự Part --------------
  if (wantListening && only !== 'reading') {
    const questions = [];
    let seconds = 0;
    for (const want of [...wantListening.sets].sort((a, b) => a.part - b.part)) {
      const spec = partSpec(want.part);
      if (!spec) continue;
      const got = examPool(days).filter((q) => q.setId === want.setId && q.part === want.part);
      if (got.length < spec.questions) {
        // Bộ biến mất hoặc bị sửa ngắn đi: BỎ Part đó và nói ra, chứ không
        // lặng lẽ lấy bộ khác thay — làm thế là đề đổi nội dung sau lưng.
        shortfall[`Part ${want.part}`] = spec.questions;
        continue;
      }
      questions.push(...got.slice(0, spec.questions));
      seconds += spec.questions * spec.seconds;
    }
    for (const spec of PARTS) {
      if (!wantListening.sets.some((x) => x.part === spec.part)) {
        shortfall[`Part ${spec.part}`] = spec.questions;
      }
    }
    if (questions.length) {
      sections.push({
        kind: 'listening',
        label: 'Phần Nghe',
        note: 'Audio phát một lần, không tua. Hết giờ là sang phần Đọc.',
        seconds,
        questions,
      });
    }
  }

  // --- Phần Đọc: đúng đề mẫu đã khai ---------------------------------------
  if (wantReading && only !== 'listening') {
    const form = (forms || []).find((f) => f.form === wantReading.formId);
    const built = form ? buildReadingExam(form) : null;
    if (built) {
      sections.push({
        kind: 'reading',
        label: 'Phần Đọc',
        note: 'Tự chia giờ, quay lại câu trước được.',
        seconds: built.seconds,
        questions: built.questions,
      });
    }
  }

  if (!sections.length) return null;

  const total = sections.reduce((n, s) => n + s.questions.length, 0);
  return {
    kind: 'paper',
    id: def.id,
    nth: def.no - 1,
    only,
    reuses: def.reuses || [],
    // Mốc duy nhất cho MỖI lần dựng đề, kể cả dựng lại cùng một đề. Màn thi
    // dùng nó làm `key` để thi lại là làm lại từ đầu thật.
    startedAt: new Date().toISOString(),
    label:
      only === 'listening'
        ? `${def.title} — phần Nghe`
        : only === 'reading'
          ? `${def.title} — phần Đọc`
          : def.title,
    sections,
    total,
    seconds: sections.reduce((n, s) => n + s.seconds, 0),
    // 200 là số câu của đề thật; chênh lệch là phần nội dung còn thiếu.
    shortfall,
    full: total === 200,
  };
}

