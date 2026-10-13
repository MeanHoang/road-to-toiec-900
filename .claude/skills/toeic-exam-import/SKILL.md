---
name: toeic-exam-import
description: Add one complete TOEIC Listening & Reading test (200 questions, Parts 1-7) to the exam room ("phòng thi") — from a PDF test book (ETS format with answer key and listening script) or a Drive folder with real audio. Covers extracting questions/images/answer key, generating listening audio from the script when the source has none, verifying, and pushing to Firestore. Use when the user says "thêm đề", "gen đề", "import đề thi", or hands over a full-test PDF / Drive link for the exam room.
---

# Add a full test to the exam room

One file in `content/exam/` = one complete paper ("Đề số N"): 200 questions, Parts 1-7,
taken whole from ONE test. Never mix questions from two tests, never borrow from the
lesson exercises (`content/day-*`) — two papers must never share a question.

## Pipeline (what exists today)

| Step | Command | Output |
|---|---|---|
| 1. Extract | `npm run import-exam` (`scripts/import-exam-ets.mjs`) | `content/exam/<form>.json` + `public/assets/exam/<form>/images/` |
| 2. Audio | `npm run voice-exam -- <form>` (`scripts/voice-exam.mjs`) | `public/assets/exam/<form>/audio/*.mp3`, writes `audio` + `audioSeconds` back into the JSON |
| 3. Verify | `npm run test:exam` | asserts 200 q, 7 Parts, every file on disk, Part 3/4 = 13/10 talks of 3 |
| 4. Bundle | add the import line in `features/exam/examContent.js` → `BUNDLED` | paper shows offline / without Firebase |
| 5. Push | `npm run push-exam -- --dry`, then `npm run push-exam` | `exam/<form>` on Firestore; deletes docs no longer in the repo |

Re-running step 1 overwrites the JSON and drops `audio` fields → always re-run step 2
afterwards (it skips mp3 files that already exist, only re-measures).

## Step 1 — adapt the importer to the new PDF

`import-exam-ets.mjs` is written for the ETS "A Complete Practice Test" layout. For a
new test, copy it (e.g. `import-exam-<source>.mjs`) or edit the config block:

- `PDF_URL` / `PDF_PATH`, `FORM_ID` (e.g. `ets-full-2`), `PAPER_NO` (next free number —
  never renumber an existing paper; learners' scores are keyed by `form` id).
- Page ranges: `PHOTO_PAGES`, `LISTENING_PAGES`, `READING_PAGES`, `SCRIPT_PAGES`.
  Find them with `pdftotext -layout -f N -l N` per page and a thumbnail sheet.
- `KEY`: **transcribe the answer key from a RENDERED image of the key page**
  (`pdftoppm -r 110 -f N -l N -png`), not from the text layer. The 2017 ETS PDF has a
  hidden old text layer (Q107 text says B, the printed page says C). Then cross-check
  every number against the text layer and resolve each mismatch by zooming the image
  and, for listening items, against the script.

What the importer relies on (check these hold for the new PDF):
- Two-column question pages; column split is computed per page from the x of the
  right-column question numbers.
- A real question number has a word right after it on the same line AND an `(A)`
  just below in the same column. Part 6 blank markers ("140." under a blank) fail the
  first test — that is how they are told apart.
- Part 6/7 passages are cropped as images between the "Questions N-M refer to" line
  and the first question of that set; a passage running onto the next page becomes a
  second image.
- Part 1 photos come from `pdftohtml -xml` image positions (the photo directly below
  label "N."), not file order — on page 3 photo 2 is stored before photo 1.
- Part 3/4 graphics: talks whose intro says "… conversation **and** <graphic>" get the
  column region above their first question cropped.
- Script: lines tagged `(N)`, `(M-Au)`, `(W-Br)`…; `[8 seconds]` pauses are kept;
  `//` stress marks are dropped; `89.5 [eighty-nine point five]` reads the bracket.

## Step 2 — audio

- **Source has no audio** (free ETS PDF): `voice-exam` reads the script with macOS
  `say`. Voice per speaker tag is in `VOICES`; add a tag there if the script uses one
  that is missing (the script stops and names it).
  - Use only the Samantha / Daniel / Karen / Moira family. The "Eloquence" voices
    (Reed, Eddy, Shelley, Flo…) read word by word and were rejected by the user as
    choppy and unclear. Premium voices (System Settings → Accessibility → Spoken
    Content → Manage Voices) sound better if the user has downloaded them —
    check `say -v '?' | grep -i premium`, change the names, run with `--force`.
  - Speed: `WORDS_PER_MINUTE` per Part is MEASURED from the course's real audio
    (Part 2 = 155, Part 3 slowest = 164 words/min, speech only). Slowing is done with
    ffmpeg `atempo` on the spoken part only; `say -r` moves in steps (`-r 164` gives
    the same file as the default) — do not use it.
  - Output is normalised to −16 LUFS (`loudnorm`), 64 kbps mono.
  - After generating, re-measure words/min (speech seconds via `silencedetect`) and
    loudness (`ebur128`) and report the numbers, not an impression.
- **Source has real audio** (Drive, a bought book): do NOT run `voice-exam`. Put the
  mp3 files in `public/assets/exam/<form>/audio/`, set `audio` on each Part 1-2
  question and on each Part 3-4 set (one file per talk, covering its 3 questions),
  and fill `audioSeconds` with `ffprobe`. The listening clock is the sum of these.
- Never invent `audioSeconds`; the exam clock is built from it.

## Step 3 — verify by looking, not by trusting the script

1. `npm run test:exam` must pass.
2. Open every image in `public/assets/exam/<form>/images/` as a contact sheet
   (one look): photos clean (no "GO ON" arrow), passages not cut short, graphics present.
3. Spot-check ~15 questions across all Parts in the JSON: stem, 4 options, no page junk
   ("on your answer sheet", directions text) glued to option (D).
4. Transcribe 2-3 mp3 with `whisper-cli -m .cache/models/ggml-small.en.bin` and compare
   with the script. whisper skips chunks of long files — re-check a cut before calling
   audio "missing".
5. In the app (Orca browser first): picker shows the new paper with 7 Part rows; run one
   listening Part (tape plays, auto-advances, auto-submits at tape end) and one reading
   Part (passage images readable).

## Step 5 — Firestore

`push-exam` needs `.cache/firebase-admin.json`. Always `--dry` first and read the
"xoá" lines: it deletes `exam/*` docs that have no file in `content/exam/` and the
legacy `exam-papers/` collection. After the real run, read `exam/` back with a separate
query to confirm.

## Rules

- Copyright: ETS material is for private self-study. Keep source PDFs in `.cache/`
  (gitignored). Do not fetch pirated "ETS 2024 full test" Drive shares; use free official
  tests or material the user owns.
- Commit only when the user says "commit".
