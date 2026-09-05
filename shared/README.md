# shared/ — reusable, domain-free

Nothing here knows what TOEIC is. No lesson, no vocabulary item, no progress, no
Firestore. If a file in here needs any of those, it is in the wrong layer and
belongs under `features/`.

## `shared/ui/` — Atomic Design

Presentation only. The only state allowed is transient UI state (is it playing,
is it open, is it flipped).

| Level | What it is | Examples here |
| --- | --- | --- |
| `atoms/` | Smallest element, composed of nothing | `Button`, `Badge`, `Input`, `Progress`, `Notice` |
| `molecules/` | A few atoms doing one job | `NavCard`, `StepList`, `CountBadge`, `Speak`, `AudioPlayer` |
| `organisms/` | A region of a page that stands on its own | `TopBar` |

Imports only ever point downward: an atom imports no other component, a molecule
imports atoms, an organism imports atoms and molecules.

## `shared/lib/` — pure functions

No React, no DOM, no imports from `features/`. Plain functions that would make
sense in any project: `shuffle.js` (Fisher-Yates plus `pick`), `text.js`
(normalise and compare what a learner typed).

## The rule that decides placement

A component that reads domain state (`useAuth`, `useProgress`, `useDay`), fetches
anything, or knows the shape of our data (`word`, `meaningVi`, `questions`,
`tokens`) does **not** belong here — it belongs to a feature. `AccountBar` and
`CopyUnknown` look like organisms and are not, for exactly that reason.

No barrel files. Import the file itself, so an import line shows what it depends on.
