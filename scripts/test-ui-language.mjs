import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { englishLabel, englishMetadata } from '../shared/lib/englishLabels.js';
import { buildPaper, paperSummary } from '../features/exam/buildExam.js';

const vietnamese = /[àáảãạăâđèéẻẽẹêìíỉĩịòóỏõọôơùúủũụưỳýỷỹỵ]/i;
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
let lessons = 0;

for (const slug of readdirSync('content').filter((name) => /^day-\d+$/.test(name))) {
  const files = Object.fromEntries(
    readdirSync(`content/${slug}`).filter((name) => name.endsWith('.json'))
      .map((name) => [name.slice(0, -5), read(`content/${slug}/${name}`)]),
  );
  const original = JSON.stringify(files);
  const day = assemble(slug, files);

  for (const item of [day, ...day.listening, ...day.exercises, ...day.pictures, ...day.theory, ...day.vocabulary]) {
    const metadata = englishMetadata(item);
    for (const key of ['title', 'subtitle', 'group']) {
      if (typeof metadata[key] === 'string') {
        assert.ok(!vietnamese.test(metadata[key]), `${slug}: untranslated ${key}: ${metadata[key]}`);
      }
    }
  }
  for (const block of day.theory) {
    for (const label of [...(block.columns || []), ...(block.items || []).map((item) => item.title), ...Object.keys(block.groups || {})]) {
      assert.ok(!vietnamese.test(englishLabel(label)), `${slug}: untranslated theory label: ${label}`);
    }
  }
  // Display labels must not mutate source content or translate learning material.
  assert.equal(JSON.stringify(files), original);
  for (const name of day.collections) {
    if (!files[name]) continue;
    const expected = files[name].items.map(englishMetadata);
    assert.deepEqual(day[name], expected);
  }
  lessons++;
}

for (const file of readdirSync('content/exam').filter((name) => name.endsWith('.json'))) {
  const form = read(`content/exam/${file}`);
  assert.equal(paperSummary(form).title, `Test ${form.no}`);
  assert.equal(buildPaper(form).label, `Test ${form.no}`);
  for (let part = 1; part <= 7; part++) {
    assert.ok(!vietnamese.test(buildPaper(form, part).label));
  }
}
assert.equal(englishLabel('New English heading'), 'New English heading');
console.log(`✓ English display labels for ${lessons} lessons and exam papers; learning material unchanged`);
