import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { LANGUAGES, LANGUAGE_COOKIE, LANGUAGE_KEY, languageOf, translate } from '../features/language/translate.js';
import { assemble } from '../features/lesson/schema.js';
import { englishLabel } from '../shared/lib/englishLabels.js';

const messages = JSON.parse(readFileSync('features/language/messages.json', 'utf8'));
const placeholders = (text) => [...text.matchAll(/\{(\d+)\}/g)].map((match) => match[1]).sort();
const filesIn = (directory) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? filesIn(join(directory, entry.name)) : [join(directory, entry.name)]);

assert.deepEqual(LANGUAGES.map((language) => language.code), ['en', 'vi', 'zh', 'ko']);
for (const value of [undefined, null, '', 'fr', 'constructor']) assert.equal(languageOf(value), 'en');
for (const { code } of LANGUAGES) assert.equal(languageOf(code), code);
assert.equal(LANGUAGE_KEY, 'toeic900:language');
assert.equal(LANGUAGE_COOKIE, 'toeic900-language');

for (const [message, versions] of Object.entries(messages)) {
  for (const locale of ['vi', 'zh', 'ko']) {
    assert.equal(typeof versions[locale], 'string', `${message}: missing ${locale}`);
    assert.ok(versions[locale].trim(), `${message}: empty ${locale}`);
    assert.deepEqual(placeholders(versions[locale]), placeholders(message), `${message}: changed placeholders in ${locale}`);
  }
}

// Every literal passed to t() must have translations in all supported languages.
for (const file of [...filesIn('features'), ...filesIn('shared/ui')].filter((file) => file.endsWith('.js'))) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 't') {
      const argument = node.arguments[0];
      if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
        assert.ok(Object.hasOwn(messages, argument.text), `${file}: untranslated message ${JSON.stringify(argument.text)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

assert.equal(translate('en', 'Answer to question {0}', [12]), 'Answer to question 12');
assert.equal(translate('zh', 'Answer to question {0}', [12]), '第12题答案');
assert.equal(translate('ko', '{0} of {1}', ['00:10', '02:30']), '02:30 중 00:10');
assert.equal(translate('vi', 'Test 1 · Part 5 — Incomplete Sentences'), 'Đề số 1 · Part 5 — Điền vào câu');
assert.equal(translate('zh', 'Test 1 · Part 5 — Incomplete Sentences'), '试卷1 · 第5部分 — 句子填空');
assert.equal(translate('ko', '1 grammar structures · 10 words'), '문법 구조 1개 · 단어 10개');
assert.equal(translate('zh', 'Finish {0}', [translate('zh', 'Listening')]), '结束听力');
assert.equal(translate('ko', 'Question {0}{1}', [12, translate('ko', ', answered')]), '문제 12, 응답함');

// Check every bundled heading, set description, and category rather than a few sample labels.
const learningLabels = new Set(['wear vs put on', 'A2', 'B1', 'B2', 'C1']);
for (const slug of readdirSync('content').filter((name) => /^day-\d+$/.test(name))) {
  const lessonFiles = Object.fromEntries(readdirSync(`content/${slug}`).filter((name) => name.endsWith('.json'))
    .map((name) => [name.slice(0, -5), JSON.parse(readFileSync(`content/${slug}/${name}`, 'utf8'))]));
  const day = assemble(slug, lessonFiles);
  const items = [day, ...day.listening, ...day.exercises, ...day.pictures, ...day.theory, ...day.vocabulary];
  const labels = items.flatMap((item) => [item.title, item.subtitle, item.group]);
  for (const block of day.theory) {
    labels.push(...(block.columns || []).map(englishLabel), ...(block.items || []).map((item) => englishLabel(item.title)), ...Object.keys(block.groups || {}).map(englishLabel));
  }
  for (const label of labels.filter((label) => typeof label === 'string' && label.trim() && !learningLabels.has(label))) {
    for (const locale of ['vi', 'zh', 'ko']) {
      assert.notEqual(translate(locale, label), label, `${slug}: untranslated ${locale} metadata: ${label}`);
    }
  }
}
for (const locale of LANGUAGES.map((language) => language.code)) {
  assert.equal(translate(locale, 'Employees must let ______ supervisors know before taking time off work.'), 'Employees must let ______ supervisors know before taking time off work.');
  assert.equal(translate(locale, 'an unknown new label'), 'an unknown new label');
  assert.equal(translate(locale, 'constructor'), 'constructor');
  assert.equal(translate(locale, null), null);
  // Interpolation must preserve personal names and learning text even if they match a UI key.
  assert.ok(translate(locale, '{0} — your results are saved to your account across devices.', ['Known']).startsWith('Known'));
}
console.log(`✓ ${Object.keys(messages).length} messages in 4 languages; placeholders, UI coverage, numeric labels, and learning text verified`);
