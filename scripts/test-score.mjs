#!/usr/bin/env node
// Test cách tính điểm xếp hạng (features/leaderboard/score.js).
//   npm run test:score

import assert from 'node:assert/strict';
import { scoreOfDay, totalScore, displayNameOf } from '../features/leaderboard/score.js';

const empty = { vocab: {}, star: {}, listen: {}, trans: {}, picture: {}, dictation: {} };

// 1. Đếm đúng ba nguồn điểm
{
  const day = {
    ...empty,
    vocab: { a: 'known', b: 'known', c: 'unknown' },
    listen: { q1: { correct: true }, q2: { correct: false }, q3: { correct: true } },
    trans: { t1: { done: true }, t2: { done: false } },
  };
  assert.equal(scoreOfDay(day), 2 + 2 + 1);
  console.log('✓ đếm từ đã thuộc + câu nghe đúng + câu dịch đã làm');
}

// 2. Chỉ 'known' mới tính. 'unknown' và null là chưa thuộc, không phải trừ điểm.
{
  assert.equal(scoreOfDay({ ...empty, vocab: { a: 'unknown', b: null, c: 'known' } }), 1);
  console.log("✓ chỉ 'known' được tính, 'unknown' và null thì không");
}

// 3. Sao đánh dấu KHÔNG phải điểm — nó là công cụ của người học, không phải thành tích
{
  assert.equal(scoreOfDay({ ...empty, star: { a: true, b: true } }), 0);
  console.log('✓ gắn sao không đẻ ra điểm');
}

// 4. Bài chép và bài nhìn hình chưa tính điểm — chưa có khái niệm "xong"
{
  assert.equal(scoreOfDay({ ...empty, dictation: { x: ['abc'] }, picture: { y: 'cap' } }), 0);
  console.log('✓ bài chép và bài hình chưa vào điểm');
}

// 5. Cộng dồn qua nhiều buổi
{
  const all = {
    'day-1': { ...empty, vocab: { a: 'known', b: 'known' } },
    'day-2': { ...empty, listen: { q: { correct: true } } },
  };
  assert.equal(totalScore(all), 3);
  console.log('✓ cộng dồn qua mọi buổi');
}

// 6. Khoá lạ trong localStorage không được tính vào điểm
{
  const all = {
    'day-1': { ...empty, vocab: { a: 'known' } },
    'toeic900:owner': 'uid-nao-do',
    linh_tinh: { vocab: { z: 'known' } },
  };
  assert.equal(totalScore(all), 1, 'chỉ khoá bắt đầu bằng day- mới được tính');
  console.log('✓ bỏ qua khoá không phải buổi học');
}

// 7. Doc thiếu bucket (ghi từ bản cũ trước khi có tính năng) không làm vỡ
{
  assert.equal(scoreOfDay({ vocab: { a: 'known' } }), 1);
  assert.equal(scoreOfDay({}), 0);
  assert.equal(scoreOfDay(null), 0);
  assert.equal(totalScore(null), 0);
  assert.equal(totalScore({}), 0);
  console.log('✓ doc thiếu bucket hoặc rỗng vẫn tính được');
}

// 8. Tên hiển thị: có tên thì dùng tên, không thì lấy phần trước @
{
  assert.equal(displayNameOf({ name: 'Minh Hoàng Trịnh' }), 'Minh Hoàng Trịnh');
  assert.equal(displayNameOf({ name: '   ', email: 'abc@gmail.com' }), 'abc');
  assert.equal(displayNameOf({ email: 'abc@gmail.com' }), 'abc');
  assert.equal(displayNameOf({}), 'Người học ẩn danh');
  console.log('✓ tên hiển thị có đường lui khi thiếu tên');
}

console.log('\n8/8 pass');
