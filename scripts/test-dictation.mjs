#!/usr/bin/env node
// Test luật chấm bài chép (features/listening/dictation.js) — chỗ dễ báo sai oan nhất.
//   npm run test:dictation

import assert from 'node:assert/strict';
import { checkLine, fullLine, canGrade, spokenText } from '../features/listening/dictation.js';

const ANS = 'has been placed in the corner of a room';
const shown = (r) => r.reveal.filter((w) => w.shown).map((w) => w.text).join(' ');
const masked = (r) => r.reveal.filter((w) => !w.shown).map((w) => w.text).join(' ');

// 1. Gõ đúng y hệt
{
  const r = checkLine(ANS, ANS);
  assert.equal(r.status, 'correct');
  assert.equal(r.firstWrong, -1);
  assert.ok(r.typed.every((w) => w.ok));
  assert.equal(masked(r), '', 'đúng rồi thì không che gì nữa');
  console.log('✓ gõ đúng nguyên dòng → correct, lộ hết');
}

// 2. Hoa thường và dấu câu không tính là sai — người học chép nghe, không chép chính tả dấu
{
  const r = checkLine('Has Been Placed in the corner of a Room.', ANS);
  assert.equal(r.status, 'correct');
  console.log('✓ khác hoa thường và dấu chấm cuối vẫn tính đúng');
}

// 3. Sai một từ → chỉ từ đó bị đánh dấu, các từ khác không
{
  const r = checkLine('has been placd in the corner of a room', ANS);
  assert.equal(r.status, 'wrong');
  assert.equal(r.firstWrong, 2);
  assert.deepEqual(
    r.typed.map((w) => w.ok),
    [true, true, false, true, true, true, true, true, true],
  );
  console.log('✓ sai 1 từ: đúng vị trí, không vạ lây từ bên cạnh');
}

// 4. Lộ dần: hiện tới từ sai đầu tiên, phần sau che bằng sao đúng độ dài
{
  const r = checkLine('has been placd', ANS);
  assert.equal(shown(r), 'has been placed', 'mở thêm đúng một từ — từ đang sai');
  assert.equal(masked(r), '** *** ****** ** * ****');
  console.log('✓ lộ dần: mở tới từ sai đầu tiên, còn lại che theo đúng độ dài');
}

// 5. Sửa đúng từ đó rồi chấm lại thì mở tiếp từ sau — vòng lặp học phải tiến được
{
  const a = checkLine('has been placd', ANS);
  const b = checkLine('has been placed', ANS);
  assert.equal(shown(a), 'has been placed');
  assert.equal(shown(b), 'has been placed in', 'gõ đúng thêm thì phải mở thêm');
  console.log('✓ sửa xong chấm lại → mở thêm một từ nữa');
}

// 6. Gõ thiếu ở cuối vẫn là sai. Đúng 3/9 từ không phải là xong.
{
  const r = checkLine('has been placed', ANS);
  assert.equal(r.status, 'wrong');
  assert.equal(r.firstWrong, 3, 'sai bắt đầu từ chỗ bỏ trống');
  assert.ok(r.typed.every((w) => w.ok), 'nhưng 3 từ đã gõ thì không bị gạch chân');
  console.log('✓ gõ thiếu từ cuối: vẫn wrong, mà không gạch oan từ đã đúng');
}

// 7. Gõ thừa từ
{
  const r = checkLine(`${ANS} today`, ANS);
  assert.equal(r.status, 'wrong');
  assert.equal(r.typed.at(-1).ok, false, 'từ thừa bị đánh dấu sai');
  console.log('✓ gõ thừa từ → wrong');
}

// 8. Khoảng trắng thừa không làm lệch vị trí từ
{
  const r = checkLine('  has   been    placed in the corner of a room ', ANS);
  assert.equal(r.status, 'correct');
  console.log('✓ khoảng trắng thừa không làm lệch chấm');
}

// 9. Nháy đơn cong và thẳng là một — bàn phím iOS tự đổi thành ’
{
  assert.equal(checkLine('he’s typing', "he's typing").status, 'correct');
  console.log('✓ nháy cong ’ và thẳng \' tính như nhau');
}

// 10. Chưa gõ gì thì KHÔNG phải là sai — đừng mắng người ta trước khi họ làm
{
  const r = checkLine('', ANS);
  assert.equal(r.status, 'empty');
  assert.equal(r.reveal.length, 0, 'chưa gõ mà đã lộ chữ thì hỏng cả bài');
  console.log('✓ ô trống → empty, không lộ gì');
}

// 11. Chưa có transcript thì im lặng, không giả vờ chấm
{
  const r = checkLine('bất kỳ thứ gì', null);
  assert.equal(r.status, 'empty');
  assert.equal(canGrade({ transcript: null }), false);
  assert.equal(canGrade({ transcript: 'He is typing.' }), true);
  console.log('✓ chưa có transcript → không chấm, không báo sai');
}

// 11b. Số hiệu bài ("Unit 3.") không phải thứ để chép — bỏ trước khi chấm,
// nếu không thì chép đúng cả câu vẫn bị báo sai ngay từ từ đầu tiên.
{
  assert.equal(spokenText('Unit 3. A small table has been placed.'), 'A small table has been placed.');
  assert.equal(spokenText("Unit 1 He's typing."), "He's typing.");
  assert.equal(spokenText('A woman is using a copier.'), 'A woman is using a copier.');
  console.log('✓ bỏ "Unit N" khỏi đáp án, câu không có thì để nguyên');
}

// 11c. Bài trắc nghiệm: audio đọc liền bốn phương án nên đáp án là bốn câu nối
// nhau, ĐÚNG THỨ TỰ A→D. Không chèn "(A)" vào giữa — bắt gõ ký hiệu phương án
// là bắt chép thứ không phải tiếng Anh.
{
  const t = { A: "She's cooking a meal.", B: "She's walking around a farm.", C: "She's shopping for food.", D: "She's eating a salad." };
  assert.equal(
    spokenText(t),
    "She's cooking a meal. She's walking around a farm. She's shopping for food. She's eating a salad.",
  );
  assert.equal(checkLine(spokenText(t), spokenText(t)).status, 'correct');
  assert.equal(spokenText({ B: 'chỉ có B.' }), 'chỉ có B.', 'thiếu phương án thì bỏ qua, không đẻ ra chỗ trống');
  assert.equal(spokenText(null), '');
  console.log('✓ transcript 4 phương án nối thành một chuỗi theo thứ tự A→D');
}

// 12. Chịu thua: mở hết, không còn dấu sao nào
{
  const f = fullLine(ANS);
  assert.ok(f.every((w) => w.shown));
  assert.equal(f.map((w) => w.text).join(' '), ANS);
  console.log('✓ xem cả câu → lộ hết, không còn sao');
}

console.log('\n14/14 pass');
