#!/usr/bin/env node
// Test luật gộp tiến độ (features/progress/merge.js) — chỗ dễ mất dữ liệu nhất trong app.
//   npm run test:merge

import assert from 'node:assert/strict';
import { mergeDay } from '../features/progress/merge.js';

const OLD = '2026-09-01T00:00:00.000Z';
const NEW = '2026-09-02T00:00:00.000Z';
const base = { vocab:{}, star:{}, listen:{}, trans:{}, picture:{}, dictation:{} };

// 1. Hợp nhất id chỉ có ở một bên — kịch bản 2 máy học 2 phần khác nhau
{
  const laptop  = { ...base, vocab:{ 'd1-v01':'known' }, updatedAt: NEW };
  const desktop = { ...base, vocab:{ 'd1-v02':'known' }, updatedAt: OLD };
  const m = mergeDay(desktop, laptop);
  assert.deepEqual(m.vocab, { 'd1-v01':'known', 'd1-v02':'known' });
  console.log('✓ union: máy cũ hơn không đè mất máy mới');
}

// 2. Cùng id, bản mới hơn thắng
{
  const a = { ...base, vocab:{ 'd1-v01':'unknown' }, updatedAt: NEW };
  const b = { ...base, vocab:{ 'd1-v01':'known'   }, updatedAt: OLD };
  assert.equal(mergeDay(a,b).vocab['d1-v01'], 'unknown');
  console.log('✓ conflict: bản updatedAt mới hơn thắng');
}

// 3. listen: correct dính, tries lấy max
{
  const a = { ...base, listen:{ q:{ picked:'A', correct:true,  tries:3 } }, updatedAt: OLD };
  const b = { ...base, listen:{ q:{ picked:'B', correct:false, tries:1 } }, updatedAt: NEW };
  const m = mergeDay(a,b).listen.q;
  assert.equal(m.correct, true, 'đã đúng thì không bị gỡ xuống');
  assert.equal(m.tries, 3);
  assert.equal(m.picked, 'B', 'picked lấy của bản mới hơn');
  console.log('✓ listen: correct dính, tries=max, picked theo bản mới');
}

// 4. trans: done/correct dính
{
  const a = { ...base, trans:{ t:{ done:true, correct:true, draft:'xong' } }, updatedAt: OLD };
  const b = { ...base, trans:{ t:{ done:false, correct:false, draft:'dở' } }, updatedAt: NEW };
  const m = mergeDay(a,b).trans.t;
  assert.equal(m.done, true);
  assert.equal(m.correct, true);
  assert.equal(m.draft, 'dở');
  console.log('✓ trans: done/correct dính, draft theo bản mới');
}

// 5. bia mộ: reset ở bản mới hơn phải xóa được ở bản cũ
{
  const cloud = { ...base, vocab:{ 'd1-v01':'known', 'd1-v02':'known' }, updatedAt: OLD };
  const reset = { ...base, vocab:{ 'd1-v01':null,    'd1-v02':null    }, updatedAt: NEW };
  const m = mergeDay(cloud, reset);
  assert.deepEqual(m.vocab, { 'd1-v01':null, 'd1-v02':null });
  assert.equal(Object.values(m.vocab).filter(s=>s==='known').length, 0);
  console.log('✓ tombstone: reset truyền được sang máy khác');
}

// 6. bia mộ cũ KHÔNG xóa cái vừa học lại
{
  const reset = { ...base, vocab:{ 'd1-v01':null }, updatedAt: OLD };
  const again = { ...base, vocab:{ 'd1-v01':'known' }, updatedAt: NEW };
  assert.equal(mergeDay(reset, again).vocab['d1-v01'], 'known');
  console.log('✓ tombstone cũ không đè lên lần học lại');
}

// 7. trans có thể là null (setTrans xóa) — không được nổ
{
  const a = { ...base, trans:{ t:null }, updatedAt: NEW };
  const b = { ...base, trans:{ t:{ done:true, correct:true } }, updatedAt: OLD };
  assert.equal(mergeDay(a,b).trans.t, null);
  console.log('✓ trans null không làm vỡ merge');
}

// 8. gộp với bản rỗng (tài khoản Google lần đầu) — giữ nguyên tất cả
{
  const local = { ...base, vocab:{ 'd1-v01':'known' }, listen:{ q:{picked:'A',correct:true,tries:1} }, updatedAt: NEW };
  const m = mergeDay(local, { vocab:{}, listen:{}, trans:{}, picture:{}, dictation:{} });
  assert.deepEqual(m.vocab, { 'd1-v01':'known' });
  assert.equal(m.listen.q.correct, true);
  console.log('✓ gộp vào tài khoản trống: không mất gì');
}

// 9. đối xứng — đổi thứ tự tham số cho kết quả như nhau
{
  const a = { ...base, vocab:{x:'known'}, listen:{q:{picked:'A',correct:true,tries:2}}, updatedAt: NEW };
  const b = { ...base, vocab:{y:'unknown'}, listen:{q:{picked:'B',correct:false,tries:5}}, updatedAt: OLD };
  assert.deepEqual(mergeDay(a,b), mergeDay(b,a));
  console.log('✓ đối xứng: mergeDay(a,b) === mergeDay(b,a)');
}

// 10. sao KHÔNG dính: gỡ sao ở máy này thì máy kia cũng phải mất sao
{
  const cu  = { ...base, star:{ 'd1-v01':true  }, updatedAt: OLD };
  const moi = { ...base, star:{ 'd1-v01':false }, updatedAt: NEW };
  assert.equal(mergeDay(cu, moi).star['d1-v01'], false);
  assert.equal(mergeDay(moi, cu).star['d1-v01'], false, 'đổi thứ tự vẫn thế');
  console.log('✓ star: bỏ sao truyền được sang máy khác');
}

// 11. sao độc lập với known/unknown — đúng cái ca dùng: nhớ nghĩa rồi vẫn gắn sao
{
  const a = { ...base, vocab:{ 'd1-v01':'known' }, star:{ 'd1-v01':true }, updatedAt: NEW };
  const b = { ...base, vocab:{ 'd1-v01':'known' }, updatedAt: OLD };
  const m = mergeDay(a, b);
  assert.equal(m.vocab['d1-v01'], 'known');
  assert.equal(m.star['d1-v01'], true);
  console.log('✓ star sống độc lập với trạng thái đã biết');
}

// 12. bản cũ không có bucket star (dữ liệu ghi trước khi có tính năng)
{
  const cu = { vocab:{ 'd1-v01':'known' }, listen:{}, trans:{}, picture:{}, dictation:{}, updatedAt: OLD };
  const moi = { ...base, star:{ 'd1-v01':true }, updatedAt: NEW };
  const m = mergeDay(cu, moi);
  assert.equal(m.star['d1-v01'], true);
  assert.equal(m.vocab['d1-v01'], 'known', 'không được nuốt mất vocab của bản cũ');
  console.log('✓ doc cũ chưa có bucket star vẫn gộp được');
}

console.log('\n12/12 pass');
