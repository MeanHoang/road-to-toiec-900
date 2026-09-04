---
name: toeic-import
description: Import one TOEIC class session from a Google Drive folder link into the Road to TOEIC 900 app — download the PDFs and audio, extract images and text, then build the content/<day>/*.json files against the schema. Use when the user hands over a Drive link for a new session, or wants to fill in data still missing from an existing one (transcripts, answer-key images, wiring images to listening questions).
---

# Import a TOEIC session from Google Drive

## Why this needs a skill and not just a script

A script handles the mechanical part: crawl Drive, download files, extract images, pull text out of PDFs.

What is left is **judgement**, which a script cannot do:

- Splitting raw text into grammar / vocabulary / translation — every session is laid out differently
- Writing the Vietnamese meanings (the source material **deliberately leaves** the Meaning column blank for students to fill in during class)
- Looking at an image to read an answer key, labelling vocabulary pictures, matching prompt images to the right listening question
- Deciding which phrase is S / V / O in a translation exercise

So: the script does the mechanical work, this skill does the judgement, and a validator keeps you from fooling yourself.

## Non-negotiable rules

**Do not invent anything.** Every field must declare an honest `source`:

| `source` | Meaning | Needs review? |
|---|---|---|
| `pdf` | Verbatim from the session's PDF | No |
| `drive` | From another file in Drive (answer key…) | No |
| `ai` | You filled it in because the material left it blank | **Yes** |
| `whisper` | Machine-transcribed from audio | **Yes** |

If you are not sure, leave it `null` and tell the user. **Never guess and then label it `pdf`.**

**Do not commit source material.** PDFs and loose images (answer keys) are already in `.gitignore`. Leave them there.

**Never store Drive links or author names in any file.** Take the content only, not its provenance.

---

## Process

### Step 1 — Run the import script

```bash
node scripts/import-day.mjs "<drive-folder-link>" [--slug day-2]
```

The script will:
- Crawl the Drive folder recursively (no API key needed — it parses the folder page's HTML)
- Download PDFs into `.cache/<slug>/` (not committed)
- Download audio into `public/assets/<slug>/audio/`
- Download **loose images** into `public/assets/<slug>/extra/` and **print a warning telling you to look at them** — on DAY 1 these turned out to be the answer key, and it was nearly missed the first time
- Extract images embedded in the PDFs to `public/assets/<slug>/images/<pdf-name>/pNN-i.jpg`
- Write per-page text into `content/<slug>.raw.json`

### Step 2 — Read the raw file and look at the loose images

Read `content/<slug>.raw.json` to understand how the session is laid out.

**You must look at every image in `public/assets/<slug>/extra/`** with the Read tool. Images that look like junk are often the answer key.

### Step 3 — Build each collection file

Create `content/<slug>/` and write the files. Every file shares this shape:

```json
{ "collection": "<name>", "day": "<slug>", "title": "…", "schemaVersion": 1, "items": [] }
```

`id` conventions — **fixed, never change them later**, because the user's study progress is anchored to them:

| Kind | Pattern | Example |
|---|---|---|
| Vocabulary | `d<n>-v<2 digits>` | `d1-v06` |
| Grammar | `d<n>-g<number>` | `d1-g1` |
| Theory block | `d<n>-t-<name>` | `d1-t-prep` |
| Translation | `d<n>-tr<2 digits>` | `d1-tr01` |
| Listening set | `d<n>-<code>` | `d1-hw1` |
| Listening question | `d<n>-<code>-<2 digits>` | `d1-hw1-03` |
| Picture | `d<n>-pic-<group>-<2 digits>` | `d1-pic-clothes-01` |

Use `content/day-1/*.json` as the reference. Field-by-field detail lives in `English/Road to TOEIC 900/02 - Thiết kế dữ liệu.md` in the user's vault.

Easy things to get wrong:

- `listening` has **two levels**: `items` are the sets, and each set contains `questions`.
- `hasKey: false` when the material ships no answer key. **Be honest** — do not invent answers so the app looks complete. The app already has a "this set has no answer key" state.
- `set.code` is used in the URL (`/listen/hw1`), so keep it short and free of diacritics.
- `translation`: `tokens` and `key` must be **the same length** and line up 1-to-1 by position. `null` = a phrase that is not S/V/O.
- `theory`: the content is not uniform, so each block carries a `type`. Currently supported: `aspects`, `pairs`, `wordGroups`, `compare`. If you need a new kind, add a branch in `app/day/[slug]/theory/page.js` — do not squeeze the content into an existing type.
- `day.json` lists the `collections` this session **actually has**. Drop anything missing from the array and the app hides that activity by itself.

### Step 4 — Wire up the images (you have to look at them)

Three jobs, all of which require opening the images with Read:

1. **Prompt image → listening question.** Images live in `images/day-N/pNN-i.jpg`, named by page number. Match the page number against the text in `.raw.json` to work out which image belongs to which question, then fill in `question.image`.
2. **Vocabulary picture answers.** For `pictures.json`, look at each image and fill in `answer` plus `accept` (alternative spellings that also count, e.g. `cap` accepts `baseball cap`).
3. **Images for the back of vocabulary cards.** Where a word has a matching image, put it in `vocabulary[].image`.

For abstract words (`relax`, `adjust`, `sort out`), **leave it `null`** — an image adds nothing, and you must not download images from the internet and commit them to the repo.

### Step 5 — Register the new session with the app

Two places; miss either one and the app will not see the new session:

1. `content/days.json` — add the slug to the `days` array
2. `lib/days.js` — add a static import and an entry in `REGISTRY` (Next.js needs a static import to bundle the JSON)

### Step 6 — Verify, then report honestly

```bash
node scripts/validate-content.mjs <slug>
npm run build
```

The validator checks: schemaVersion, `day` matching the folder, duplicate `id`s, asset paths that actually exist, `tokens`/`key` length mismatches, `hasKey` contradicting `answer`, and it counts fields still marked `source: ai/whisper`.

**Every error must be fixed.** Warnings are not blocking, but **you must tell the user what is still missing** — do not report "done" while 46 Vietnamese meanings are still unreviewed.

The final report must state:
- What was imported (word count, listening question count, image count)
- Which parts are `source: ai` and need the user's review
- What is still `null` and why

---

## Step 7 — Transcribe the audio for a cross-check

```bash
npm run transcribe <slug>              # transcribe every question without a transcript
npm run transcribe <slug> -- --set hw1 # one set only
npm run transcribe <slug> -- --force   # re-transcribe questions that already have one
```

This runs `whisper.cpp` entirely locally — no API calls, no cost. One-time setup:

```bash
brew install whisper-cpp ffmpeg
curl -L -o .cache/models/ggml-small.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
```

The script writes into `question.transcript`:
- `dictation` sets → a single string, the whole sentence heard
- `choice` sets → an object `{ A, B, C, D }`

**You have to finish what the script cannot do on its own:**

1. **Questions it could not split into A/B/C/D** — the script leaves those as `{ raw: "…" }` and prints a list at the end of the run. Read the `raw` text and split it by hand. Two causes seen on DAY 1:
   - The set only has **two options**, A and B, not four (Practice 2.2 questions 3 and 4). Check the blanks in the PDF to see how many options a set actually has.
   - The mp3 includes the **spoken test instructions** at the start (Homework 1 question 1). The four real options are at the end of the clip.

2. **Cross-check against the PDF before trusting it.** The blanks in the PDF usually reveal a few words, which you can use to check the transcript. For example Homework 1 question 1 has `B. She's ______ a farm.` → transcript B must end with "a farm". If it matches, you are fine; if not, the split came out in the wrong order.

3. **Cross-check against the answer key.** The official key says which option is correct, and the transcript says what that option contains — the two must be consistent. A mismatch means one of them is wrong.

**Whisper does not know which answer is correct.** It can transcribe all four options, but which one describes the picture correctly is in the **image**, not the audio. The answer must come from the answer key in Drive, or from looking at the picture — and declare the right `source` (`drive` vs `ai`).

Every field the script writes carries `source.transcript: "whisper"` = **a draft**. If you only re-split the machine's words, leave it as `whisper`; change it to `pdf` only once you have checked it against the original material and confirmed it.
