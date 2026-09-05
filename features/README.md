# features/ — where the logic lives

The `Atomic Design` note in the vault is explicit: Atomic Design organises **UI**,
not an application. Anything that touches the domain — fetching data, reading who
is signed in, knowing the shape of a vocabulary item — is not a decorative
component and does not belong in `shared/ui`. It belongs here.

| Feature | What it owns |
| --- | --- |
| `auth/` | Who is studying: anonymous or Google, and merging progress on sign-in |
| `lesson/` | A lesson: where it is loaded from, how it is assembled, the home and overview screens |
| `progress/` | Progress: localStorage, Firestore, and the rules for merging two copies |
| `vocabulary/` | Flashcards, the lookup table, and the filters behind both |
| `game/` | The vocabulary quiz: building a round, playing it, showing the result |
| `listening/` | Listening sets — three panels, because dictation, class-notes and multiple-choice follow different rules |
| `translation/` | The S / V / O marking exercise |
| `pictures/` | Picture vocabulary and how an answer is graded |
| `theory/` | Theory blocks, one renderer per block type |

Each feature holds its own data access, hooks, screens and components. A screen
lives with its feature, not in `app/` — a route is a five-line file that resolves
`params` and renders the screen.

Every feature keeps its rules in a plain module with no React in it — `rules.js`,
`marks.js`, `grade.js`, `filters.js`, `buildRound.js`. That is deliberate: those
are the parts worth reading on their own, and the parts a test can reach.

A feature may import from `shared/` and `lib/`. Nothing in `shared/` may import
from here — an import line pointing that way means a file is in the wrong place.
