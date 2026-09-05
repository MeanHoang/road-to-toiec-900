---
name: arch-review
description: Review a diff against this repo's two-axis architecture — Atomic Design for shared/ui, feature modules for domain logic — as set out in commit "Split the two component barrels into atomic UI and feature modules". Use before committing, when reviewing a branch or PR, or whenever a new component, hook or data-access file is added and you need to decide which layer it belongs to.
---

# Architecture review

## The design being enforced

Two axes. They are not the same axis, and mixing them is the failure this skill exists to catch.

| Axis | Where | Rule |
|---|---|---|
| **UI composition** — Atomic Design | `shared/ui/{atoms,molecules,organisms}` | Presentation only. Knows nothing about TOEIC. Never fetches. |
| **Application logic** — feature modules | `features/{auth,lesson,progress,vocabulary}` | Owns state, data access, and the components tied to them. |

Supporting layers: `app/` is routes only, `lib/` is infrastructure (`firebase.js`), `content/` is data.

Source of truth for the layout: the **Project structure** section of `README.md`, plus
`shared/ui/README.md` and `features/README.md`. If a rule here contradicts those, the READMEs win —
say so in the report instead of silently following this file.

## Scope

Review only what the diff touches. Default target is the working tree against `main`:

```bash
git diff --stat main...HEAD
git diff main...HEAD -- app shared features lib
```

Given a commit range, branch or PR number, use that instead. Pre-existing violations in files the
diff does not touch are **not** findings — mention them at most as one closing line.

---

## Step 1 — Mechanical checks

Run these first. Every one of them should print nothing but the OK line.

```bash
# 1. shared/ui must not know about domain, infrastructure or content
grep -rnE "@/features|@/lib|@/content" shared/ && echo "VIOLATION above" || echo "OK: shared/ui is pure"

# 2. app/ is routes only — no direct data access
grep -rnE "firebase/firestore|localStorage|firebase/auth" app/ && echo "VIOLATION above" || echo "OK: app/ has no data access"

# 3. no barrel files anywhere in the two axes
find shared features -name "index.js" -o -name "index.jsx" | grep . && echo "VIOLATION above" || echo "OK: no barrels"

# 4. atoms compose nothing; molecules never import organisms
grep -rnE "molecules|organisms" shared/ui/atoms/ && echo "VIOLATION above" || echo "OK: atoms are leaves"
grep -rn "organisms" shared/ui/molecules/ && echo "VIOLATION above" || echo "OK: molecules stay below organisms"

# 5. lib/ stays infrastructure — firebase.js and nothing else
ls lib/

# 6. a COMPONENT file (PascalCase name) must export the component it is named after.
#    Lowercase files are modules of several functions — api.js, stats.js — and are exempt.
for f in $(find shared/ui features -name "*.js"); do
  n=$(basename "$f" .js)
  case "$n" in [A-Z]*) grep -qE "export (function|const) $n[^A-Za-z0-9_]" "$f" || echo "MISMATCH: $f exports no $n" ;; esac
done; echo "OK if nothing above"
```

All six run clean on the commit that introduced this layout — anything they print came in with
the diff. `grep -E` matters: without it the alternations match nothing and every check reports OK.

Also run the two guards the repo already has, because a layering change can silently break them:

```bash
npm run test:merge     # progress merge rules — the one place data loss hides
npm run build          # catches a broken import path that grep would miss
```

---

## Step 2 — Judgement: does each new file sit in the right layer?

Mechanical checks cannot answer this. For every **added or moved** component in the diff, ask in order:

1. **Does it read domain state or call domain code?** `useAuth`, `useProgress`, `useDay`, Firestore,
   `localStorage` → it belongs to a **feature**, never to `shared/ui`. This is the mistake the
   Atomic Design note calls out by name.
2. **Does it know the shape of our data?** Touching `word` / `meaningVi` / `questions` / `tokens` /
   `hasKey` / `slug` counts as domain knowledge → **feature**.
   *Precedent: `AccountBar` and `CopyUnknown` look like organisms and are not — they live in
   `features/auth` and `features/vocabulary` for exactly this reason.*
3. **Otherwise it is presentation.** Pick the atomic level by what it composes, not by how big it is:

   | Level | Composed of | Test |
   |---|---|---|
   | atom | nothing but HTML and `next/link` | can it be explained without naming another component? |
   | molecule | atoms | is it one small job made of a few atoms? |
   | organism | atoms + molecules | does it stand alone as a region of a page? |

4. **Is the file doing two jobs?** That is what the refactor undid — `days.js` was schema plus
   bundled data plus counters. A new file mixing data access with a hook, or a hook with a
   presentation component, should be split along the same line.

Then check the smaller conventions:

- **One component per file**, and the file is named after it. No `index.js` re-exports — an import
  line must name the file it depends on.
- **`'use client'` only where earned** — a file using hooks, browser APIs or `next/navigation`.
  Pure atoms stay directive-free so a server component can still render them.
- **A header comment saying WHY**, in Vietnamese, matching the surrounding files. A file that only
  restates its own code in a comment is worse than no comment.
- **No import cycles between files.** The allowed direction across auth and progress is
  `progress/useProgress` → `auth/AuthProvider` → `progress/localStore`. Adding an edge back from
  `localStore` or `merge` closes the loop — reject it.
- **`merge.js` imports nothing.** `scripts/test-merge.mjs` runs it under bare `node`. An import
  there breaks the test that guards against progress loss.

---

## Step 3 — Report

Group findings by severity, most severe first, each as `path/to/file.js:12` plus **the layer it
should move to**. A finding that cannot name a destination is not a finding.

```
BLOCKING   shared/ui/molecules/WordCard.js:8 — imports useProgress.
           Move to features/vocabulary/WordCard.js. shared/ui may not read domain state.

WORTH FIXING  features/lesson/api.js:41 — also formats the day title for display.
           Formatting belongs to the screen or to stats.js; api.js should only fetch.

NIT        shared/ui/atoms/Chip.js:1 — 'use client' with no hook or browser API. Drop it.
```

If the diff is clean, say so in one sentence and name what you checked. Do not pad a clean review
with speculative advice.

## What is out of scope

Content rules (`source`, `schemaVersion`, id stability, answer keys) belong to **`toeic-import`**,
not here. General bug hunting belongs to `/code-review`. This skill answers exactly one question:
**is the diff still honest about the two axes?**
