// Dựng một lượt thi từ một đề. Không React — có test riêng: npm run test:exam.

// Đuôi .js là BẮT BUỘC và đường dẫn phải tương đối: file này còn được `node`
// chạy thẳng trong scripts/test-exam.mjs, mà Node ESM không hiểu alias `@/`.
import { PARTS, READING_SECONDS_PER_QUESTION, SECTIONS, partSpec, partTitle } from './rules.js';

/**
 * Mọi câu của đề theo đúng thứ tự đề, mỗi câu mang theo thứ nó cần để hiện ra
 * mà không phải tra ngược về bộ của nó:
 *   - audio: file của chính câu (Part 1-2) hoặc của cả bài nói (Part 3-4)
 *   - graphic: hình minh hoạ của bài nói (Part 3-4, "Look at the graphic")
 *   - passage: đoạn văn của bộ (Part 6-7)
 *   - choices: Part 2 chỉ có A-C, các Part khác A-D
 */
export function formQuestions(form) {
  const out = [];
  for (const set of form?.sets || []) {
    for (const q of set.questions || []) {
      out.push({
        id: q.id,
        no: q.no,
        part: q.part,
        answer: q.answer,
        stem: q.stem ?? null,
        options: q.options ?? null,
        choices: set.choices || (q.options ? Object.keys(q.options) : ['A', 'B', 'C', 'D']),
        image: q.image ?? null,
        audio: q.audio || set.audio || null,
        audioSeconds: q.audio ? q.audioSeconds : set.audioSeconds,
        graphic: set.graphic ?? null,
        passage: set.passage ?? null,
        script: q.script || set.script || null,
      });
    }
  }
  return out;
}

/**
 * Các đoạn băng của một chặng, theo thứ tự phát: mỗi đoạn kèm câu đầu và câu
 * cuối nó phủ. Part 3-4 một đoạn phủ ba câu.
 */
export function tapeOf(questions) {
  const units = [];
  questions.forEach((q, i) => {
    if (!q.audio) return;
    const last = units[units.length - 1];
    if (last && last.src === q.audio) last.to = i;
    else units.push({ src: q.audio, seconds: q.audioSeconds || 0, from: i, to: i });
  });
  return units;
}

/** Giờ của một chặng: Listening dài đúng bằng băng, Reading 45 giây một câu. */
function sectionSeconds(kind, questions) {
  if (kind === 'listening') return Math.ceil(tapeOf(questions).reduce((n, u) => n + u.seconds, 0));
  return questions.length * READING_SECONDS_PER_QUESTION;
}

/**
 * Dựng một lượt thi.
 *
 * `only` = null thi cả đề: Listening rồi vào thẳng Reading, đúng đề thật — hai
 * chặng, hai đồng hồ, sang Reading rồi không quay lại Listening.
 *
 * `only` = số Part (1-7) để luyện riêng một Part, vẫn giữ nguyên luật của
 * Part đó: Part nghe chạy theo băng, Part đọc tự chia giờ.
 */
export function buildPaper(form, only = null) {
  const all = formQuestions(form);
  if (!all.length) return null;

  const sections = [];
  if (only) {
    const spec = partSpec(only);
    const questions = all.filter((q) => q.part === only);
    if (!spec || !questions.length) return null;
    sections.push({
      kind: spec.section,
      label: partTitle(only),
      seconds: sectionSeconds(spec.section, questions),
      questions,
    });
  } else {
    for (const s of SECTIONS) {
      const questions = all.filter((q) => partSpec(q.part)?.section === s.kind);
      if (!questions.length) continue;
      sections.push({ kind: s.kind, label: s.label, seconds: sectionSeconds(s.kind, questions), questions });
    }
  }

  const total = sections.reduce((n, s) => n + s.questions.length, 0);
  const title = `Test ${form.no}`;
  return {
    id: form.form,
    no: form.no,
    only,
    // Mốc riêng cho MỖI lần dựng, kể cả dựng lại cùng một đề: màn thi dùng nó
    // làm `key` để "Thi lại" là làm lại từ đầu thật.
    startedAt: new Date().toISOString(),
    label: only ? `${title} · ${partTitle(only)}` : title,
    sections,
    total,
    seconds: sections.reduce((n, s) => n + s.seconds, 0),
  };
}

/** Tóm tắt một đề cho màn chọn đề: số câu và giờ của cả đề và từng Part. */
export function paperSummary(form) {
  const all = formQuestions(form);
  const parts = PARTS.map((p) => {
    const questions = all.filter((q) => q.part === p.part);
    return { ...p, count: questions.length, seconds: sectionSeconds(p.section, questions) };
  }).filter((p) => p.count > 0);
  return {
    id: form.form,
    no: form.no,
    title: `Test ${form.no}`,
    total: all.length,
    seconds: SECTIONS.reduce(
      (n, s) => n + sectionSeconds(s.kind, all.filter((q) => partSpec(q.part)?.section === s.kind)),
      0,
    ),
    parts,
  };
}

/**
 * Một lượt thi để lưu lại. Id là thời điểm bắt đầu theo ISO: hai máy gần như
 * không thể trùng mili-giây, nên gộp hai máy chỉ là hợp hai tập id.
 */
export function newAttempt(paper, learner = null) {
  const questions = paper.sections.flatMap((s) => s.questions);
  return {
    id: new Date().toISOString(),
    // Đề nào, thi cả đề hay một Part — để "Thi lại" dựng đúng bài cũ, và
    // "Lần gần nhất" ở màn chọn đề khớp đúng dòng.
    paperId: paper.id,
    only: paper.only ?? null,
    label: paper.label,
    // Tên lưu cùng lượt thi: đổi tên tài khoản sau này thì bảng điểm cũ vẫn
    // đúng tên lúc thi.
    learner,
    total: questions.length,
    sections: paper.sections.map((s) => ({ kind: s.kind, label: s.label, count: s.questions.length })),
    answers: questions.map((q) => ({ id: q.id, no: q.no, part: q.part, answer: q.answer, picked: null })),
  };
}
