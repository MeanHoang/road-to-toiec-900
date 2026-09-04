# Road to TOEIC 900

A personal web app that turns TOEIC course material into something you can actually
study from — searchable theory, flashcards with pronunciation, a vocabulary game, and
listening drills where the audio sits right next to the question.

The source material lives as PDFs and nested audio folders on Google Drive. That is fine
for handing files out, but useless for studying: you cannot fill in the blanks, cannot
look a word up, cannot tell which exercises you already did. This app fixes that.

## Table of contents

- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Design system](#design-system)
- [Deploying](#deploying)
- [Known gaps](#known-gaps)
- [A note on the material](#a-note-on-the-material)

## How it works

Three layers, deliberately kept apart:

```
Google Drive folder
      │
      │  IMPORT — run locally, once per lesson, slow and messy
      ▼
  scripts/import-day.mjs      crawl Drive, download PDFs + audio, extract images and text
  scripts/transcribe.mjs      whisper.cpp → transcripts of every audio clip
      │
      ▼
  content/<day>/*.json        source of truth — plain JSON, readable, hand-editable
  public/assets/<day>/        images extracted from the PDFs + audio files
      │
      │  PUSH — upload content to Firestore
      ▼
  Firestore                   content + per-user progress
      │
      ▼
  Next.js app on Vercel       reads content, writes progress
```

The import step is slow and imprecise: it scrapes Drive's HTML, and whisper misspells rare
words. The rendering step has to be fast and correct. Keeping the messy part in a JSON file
you can review means the app never has to care about Drive again.

**Content is static; progress is not.** Lesson content is the same for everybody and barely
changes, so it is committed to the repo and mirrored to Firestore. Progress changes every
few seconds and belongs to one person, so it lives in `localStorage` (written instantly,
works offline) and syncs to Firestore in the background.

**Progress follows the account, not the browser.** A visitor is signed in anonymously so they
can start studying without an account, but an anonymous uid is stored per browser profile and
per origin — so `localhost:3000`, the deployed site, a second Chrome profile and a second
machine are four different learners. Signing in with Google fixes that. When the anonymous
session is the account's first, `linkWithPopup` upgrades it in place and the uid is unchanged,
so the progress document carries over untouched. When the Google account already has a uid
(a second device), the uid changes and `mergeLocalIntoAccount` merges what is on this machine
into the account instead of dropping it.

Two progress documents are merged per id, never document-wide — see `lib/merge.js`, tested by
`npm run test:merge`. Document-wide last-write-wins meant studying on a laptop and then opening
a desktop that had an older copy silently destroyed the laptop's work.

## Getting started

Requirements: Node 20+, and for the import pipeline `poppler`, `ffmpeg` and `whisper-cpp`.

```bash
npm install
cp .env.example .env.local     # fill in your Firebase web config
npm run dev
```

`.env.local` is optional. With no Firebase configuration the app falls back to the JSON
bundled in the repo and stores progress in `localStorage` only — useful for local work.

Two switches in Firebase Console → Authentication → Sign-in method have to be on: **Anonymous**,
so a visitor can study without an account, and **Google**, so progress can follow a person
across devices. Google cannot be enabled from the Admin SDK — it needs an OAuth client, which
the Console creates for you when you toggle it. Add every domain you serve from to
Authentication → Settings → Authorized domains; `localhost` is there by default.

For the import and transcription scripts:

```bash
brew install poppler ffmpeg whisper-cpp
mkdir -p .cache/models
curl -L -o .cache/models/ggml-small.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
```

To push content to Firestore you also need a service account key. Firebase Console →
Project settings → Service accounts → Generate new private key, saved as
`.cache/firebase-admin.json`. That path is gitignored — never commit it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run import <drive-url>` | Crawl a Drive folder, download audio, extract images and text |
| `npm run transcribe <day>` | Transcribe every audio clip with whisper.cpp |
| `npm run validate [day]` | Check content files for structural errors and unreviewed fields |
| `npm run test:merge` | Check the progress merge rules in `lib/merge.js` |
| `npm run push-content [day]` | Upload `content/<day>/*.json` to Firestore (`--dry` to preview) |

`npm run validate` is the important one. It catches duplicate ids, asset paths pointing at
files that do not exist, `tokens`/`key` arrays of different lengths, and answer keys that
contradict the `hasKey` flag. It also counts how many fields are still machine-generated
and therefore unverified.

## Project structure

```
app/                    routes only — screens compose components, no data logic
components/
  primitives/           Button, Badge, Card, Progress, Input … — know nothing about TOEIC
  patterns/             TopBar, NavCard, AudioPlayer, Speak … — know about lessons
lib/
  firebase.js           client init, anonymous + Google auth
  content.js            fetch lessons from Firestore, fall back to bundled JSON
  days.js               bundled fallback content and shared helpers
  progress.js           the useProgress hook — reads local, merges cloud, syncs back
  store.js              localStorage helpers + pushing local progress into an account
  merge.js              how two copies of one day are merged (no imports, so node can test it)
content/<day>/*.json    lesson content
public/assets/<day>/    images and audio
scripts/                import, transcribe, validate, push
styles/                 tokens → base → components
.claude/skills/         Claude Code skill for importing a new lesson
```

The boundary between `primitives` and `patterns` is worth keeping: if a primitive ever needs
to import from `lib/days`, it belongs in `patterns` instead.

## Data model

One folder per lesson, one JSON file per content type. Every file has the same envelope:

```json
{
  "collection": "vocabulary",
  "day": "day-1",
  "title": "Từ vựng",
  "schemaVersion": 1,
  "items": []
}
```

The loader verifies `schemaVersion` and that `day` matches the folder name, so a file copied
from the wrong lesson fails loudly instead of rendering the wrong content.

Every item carries an `id` and a `source`:

| `source` | Meaning | Needs review |
| --- | --- | --- |
| `pdf` | Verbatim from the lesson PDF | No |
| `drive` | From another file in the Drive folder, e.g. an answer key | No |
| `ai` | Filled in because the material left it blank | **Yes** |
| `whisper` | Machine transcription of audio | **Yes** |

`source` can be per field: `{ "word": "pdf", "ipa": "pdf", "meaningVi": "ai" }`. This is how
you tell, months later, which parts of the data you can trust.

Ids are stable and never reused — progress is keyed on them. `d1-v06` is vocabulary word 6
of day 1; `d1-hw1-03` is question 3 of homework 1.

In Firestore:

```
meta/days                          { days: ["day-1"] }
days/<slug>                        lesson metadata
days/<slug>/collections/<name>     one document per content file
progress/<uid>/days/<slug>         per-user progress
```

Two Firestore constraints shaped the schema: documents are capped at 1 MB (content files are
far below that), and **arrays cannot be nested**, which is why paired data is stored as
`[{ left, right }]` rather than `[[left, right]]`.

## Design system

Tokens are layered. Primitives hold raw values and are never used directly; semantic
aliases carry meaning and are the only thing components read. Swapping a theme means editing
the alias table, not the components.

- Spacing follows a 4/8 grid, widening at the top of the scale
- Type sizes are a fixed, hand-picked set rather than a computed ratio
- Exactly three font weights
- Emphasis comes from de-emphasising secondary elements, not from bolding primary ones
- One primary button per screen
- Visible `:focus-visible` rings, 40px minimum touch targets, `prefers-reduced-motion` honoured

## Deploying

The app is a standard Next.js project and deploys to Vercel with no extra configuration.
Add the six `NEXT_PUBLIC_FIREBASE_*` variables in the Vercel project settings.

Firestore rules live in `firestore.rules`. Content is world-readable and not writable from
the browser — only the Admin SDK used by `push-content` can write it. Progress is readable
and writable only by the user who owns it.

Because content is served from Firestore, editing a lesson does not require a redeploy.
Adding a whole new lesson does, since its images and audio ship with the repo.

## Known gaps

Run `npm run validate` for the current list. As of the last import:

- Vietnamese meanings for all 46 words are AI-generated and unverified
- Picture-vocabulary exercises have no answers yet
- Two listening sets have no official answer key — the material does not include one, and
  the app says so rather than pretending to grade them
- Transcripts come from whisper and contain occasional errors; the UI labels them as such

## A note on the material

The lesson content belongs to its original author and this app exists for personal study.
Keep the repository private, and if you deploy it, enable access protection rather than
leaving it publicly indexed.
