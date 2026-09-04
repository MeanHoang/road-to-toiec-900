---
name: toeic-import
description: Nhập một buổi học TOEIC từ link Google Drive folder vào app Road to TOEIC 900 — tải PDF/audio, bóc ảnh và text, rồi dựng thành các file content/<day>/*.json đúng schema. Dùng khi user đưa link Drive của một buổi mới, hoặc muốn bổ sung dữ liệu còn thiếu cho buổi đã có (transcript, đáp án ảnh, gán ảnh vào câu nghe).
---

# Nhập một buổi học TOEIC từ Google Drive

## Vì sao việc này cần skill chứ không chỉ cần script

Script làm được phần cơ học: crawl Drive, tải file, bóc ảnh, đọc text từ PDF.

Nhưng phần còn lại là **phán đoán**, script không làm được:

- Cắt text thô thành grammar / vocabulary / translation — bố cục mỗi buổi mỗi khác
- Dịch nghĩa tiếng Việt (tài liệu **cố ý bỏ trống** cột Nghĩa để học viên tự điền trên lớp)
- Nhìn ảnh để đọc bảng đáp án, gán nhãn ảnh từ vựng, ghép ảnh đề bài vào đúng câu nghe
- Quyết định cụm nào là S / V / O trong bài dịch

Nên: script lo phần cơ học, skill này lo phần phán đoán, và có validator để không tự lừa mình.

## Nguyên tắc bất di bất dịch

**Không bịa.** Mọi field đều phải khai `source` trung thực:

| `source` | Nghĩa | Phải soát lại? |
|---|---|---|
| `pdf` | Nguyên văn từ PDF của buổi học | Không |
| `drive` | Từ file khác trong Drive (bảng đáp án…) | Không |
| `ai` | Bạn tự bổ sung vì tài liệu bỏ trống | **Có** |
| `whisper` | Máy chép từ audio | **Có** |

Không chắc thì để `null` và báo cho user, **tuyệt đối không đoán bừa rồi khai là `pdf`**.

**Không commit tài liệu nguồn.** PDF và ảnh rời (bảng đáp án) đã nằm trong `.gitignore`. Đừng gỡ ra.

**Không lưu link Drive hay tên tác giả vào bất kỳ file nào.** Chỉ lấy nội dung, không lấy nguồn.

---

## Quy trình

### Bước 1 — Chạy script import

```bash
node scripts/import-day.mjs "<link-drive-folder>" [--slug day-2]
```

Script sẽ:
- Crawl folder Drive đệ quy (không cần API key, parse HTML trang folder)
- Tải PDF vào `.cache/<slug>/` (không commit)
- Tải audio vào `public/assets/<slug>/audio/`
- Tải **ảnh rời** vào `public/assets/<slug>/extra/` và **in cảnh báo bắt xem** — ở DAY 1 chính đây là bảng đáp án, lần đầu suýt bỏ sót
- Bóc ảnh trong PDF ra `public/assets/<slug>/images/<tên-pdf>/pNN-i.jpg`
- Ghi text từng trang vào `content/<slug>.raw.json`

### Bước 2 — Đọc file thô và xem ảnh rời

Đọc `content/<slug>.raw.json` để nắm bố cục buổi học.

**Bắt buộc xem mọi ảnh trong `public/assets/<slug>/extra/`** bằng công cụ Read. Ảnh trông như rác thường lại là bảng đáp án.

### Bước 3 — Dựng từng file collection

Tạo `content/<slug>/` rồi viết các file. Khuôn chung của mọi file:

```json
{ "collection": "<tên>", "day": "<slug>", "title": "…", "schemaVersion": 1, "items": [] }
```

Quy tắc đặt `id` — **cố định, không được đổi về sau** vì tiến độ học của user neo vào đây:

| Loại | Mẫu | Ví dụ |
|---|---|---|
| Từ vựng | `d<n>-v<2 chữ số>` | `d1-v06` |
| Ngữ pháp | `d<n>-g<số>` | `d1-g1` |
| Khối lý thuyết | `d<n>-t-<tên>` | `d1-t-prep` |
| Bài dịch | `d<n>-tr<2 chữ số>` | `d1-tr01` |
| Bộ bài nghe | `d<n>-<code>` | `d1-hw1` |
| Câu nghe | `d<n>-<code>-<2 chữ số>` | `d1-hw1-03` |
| Ảnh | `d<n>-pic-<nhóm>-<2 chữ số>` | `d1-pic-clothes-01` |

Xem `content/day-1/*.json` làm mẫu. Chi tiết từng field: `English/Road to TOEIC 900/02 - Thiết kế dữ liệu.md` trong vault của user.

Điểm dễ sai:

- `listening` có **hai tầng**: `items` là bộ bài, trong mỗi bộ có `questions`.
- `hasKey: false` khi tài liệu không kèm đáp án. **Nói thật**, đừng bịa đáp án để app trông đầy đủ. App có sẵn giao diện báo "bộ này không có đáp án".
- `set.code` dùng làm URL (`/listen/hw1`), phải ngắn và không dấu.
- `translation`: `tokens` và `key` phải **cùng độ dài**, khớp 1-1 theo vị trí. `null` = cụm không thuộc S/V/O.
- `theory`: nội dung không đồng dạng, mỗi khối mang `type`. Hiện hỗ trợ `aspects`, `pairs`, `wordGroups`, `compare`. Cần kiểu mới thì thêm nhánh trong `app/day/[slug]/theory/page.js`, đừng bóp nội dung cho vừa kiểu cũ.
- `day.json` liệt kê `collections` mà buổi này **thật sự có**. Thiếu loại nào thì bỏ khỏi mảng, app tự ẩn hoạt động đó.

### Bước 4 — Gán ảnh (cần nhìn ảnh)

Ba việc, đều phải mở ảnh ra xem bằng Read:

1. **Ảnh đề bài → câu nghe.** Ảnh nằm trong `images/day-N/pNN-i.jpg` theo số trang. Đối chiếu số trang với text trong `.raw.json` để biết ảnh nào thuộc câu nào, rồi điền vào `question.image`.
2. **Đáp án ảnh từ vựng.** Với `pictures.json`, xem từng ảnh rồi điền `answer` + `accept` (các cách viết khác cũng tính đúng, vd `cap` chấp nhận `baseball cap`).
3. **Ảnh cho mặt sau thẻ từ vựng.** Từ nào có ảnh khớp thì điền vào `vocabulary[].image`.

Từ trừu tượng (`relax`, `adjust`, `sort out`) thì **để `null`** — ảnh không giúp gì, và không được đi tải ảnh từ Internet về commit vào repo.

### Bước 5 — Đăng ký buổi mới vào app

Hai chỗ, thiếu một là app không thấy buổi mới:

1. `content/days.json` — thêm slug vào mảng `days`
2. `lib/days.js` — thêm import tĩnh và một entry trong `REGISTRY` (Next.js cần import tĩnh mới bundle được JSON)

### Bước 6 — Soát lại, rồi báo cáo trung thực

```bash
node scripts/validate-content.mjs <slug>
npm run build
```

Validator kiểm: schemaVersion, `day` khớp folder, `id` trùng lặp, đường dẫn asset có thật, `tokens`/`key` lệch nhau, `hasKey` mâu thuẫn với `answer`, và đếm field còn `source: ai/whisper`.

**Lỗi phải sửa hết.** Cảnh báo thì không bắt buộc, nhưng **phải nói cho user biết còn thiếu gì** — đừng báo "xong rồi" khi còn 46 nghĩa tiếng Việt chưa ai soát.

Báo cáo cuối cần nêu rõ:
- Nhập được gì (số từ, số câu nghe, số ảnh)
- Chỗ nào là `source: ai` cần user soát lại
- Chỗ nào còn `null` và vì sao

---

## Bước 7 — Chép lời audio để có đáp án đối chiếu

```bash
npm run transcribe <slug>              # chép mọi câu chưa có transcript
npm run transcribe <slug> -- --set hw1 # chỉ một bộ
npm run transcribe <slug> -- --force   # chép lại cả câu đã có
```

Chạy `whisper.cpp` hoàn toàn ở máy, không gọi API, không tốn tiền. Cần cài một lần:

```bash
brew install whisper-cpp ffmpeg
curl -L -o .cache/models/ggml-small.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
```

Script ghi vào `question.transcript`:
- bộ `dictation` → một chuỗi, là cả câu nghe được
- bộ `choice` → object `{ A, B, C, D }`

**Bạn phải làm nốt phần script không tự làm được:**

1. **Câu không tách được A/B/C/D** — script để nguyên ở dạng `{ raw: "…" }` và in ra danh sách cuối lần chạy. Đọc `raw` rồi cắt tay. Hai nguyên nhân đã gặp ở DAY 1:
   - Bộ chỉ có **2 phương án** A và B, không phải 4 (Practice 2.2 câu 3, 4). Đối chiếu với chỗ trống trong PDF để biết bộ đó có mấy phương án.
   - File mp3 chứa cả **phần đọc hướng dẫn đầu đề thi** (Homework 1 câu 1). Bốn câu thật nằm ở cuối đoạn.

2. **Đối chiếu chéo với PDF trước khi tin.** Chỗ trống trong PDF thường lộ vài từ, dùng để kiểm transcript có khớp không. Ví dụ Homework 1 câu 1 có `B. She's ______ a farm.` → transcript B phải kết thúc bằng "a farm". Khớp thì yên tâm, không khớp thì cắt sai thứ tự.

3. **Đối chiếu chéo với bảng đáp án.** Đáp án chính thức nói câu nào đúng, transcript nói câu đó viết gì — hai cái phải hợp lý với nhau. Lệch nhau là một trong hai sai.

**Whisper không biết đáp án nào đúng.** Nó chép được cả 4 phương án nhưng phương án nào mô tả đúng bức tranh thì nằm ở **ảnh**, không nằm trong âm thanh. Đáp án phải lấy từ bảng đáp án trong Drive, hoặc nhìn ảnh mà suy — và khai `source` cho đúng (`drive` vs `ai`).

Mọi field script ghi ra đều mang `source.transcript: "whisper"` = **bản nháp**. Bạn tự tay sửa chỗ nào thì để nguyên `whisper` nếu chỉ cắt lại chữ của máy; chỉ đổi sang `pdf` khi đã đối chiếu với tài liệu gốc và xác nhận đúng.
