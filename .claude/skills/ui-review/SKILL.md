---
name: ui-review
description: Review the interface with MEASUREMENTS taken from the live DOM rather than by eye — colour contrast, tap targets, the type scale, emphasis hierarchy, horizontal overflow. Use after adding or changing a screen, when AI-written UI looks fine but may not meet standards, or before deploying anything with a visual change.
---

# Interface review

AI-written interfaces fail in a characteristic way: **they look fine and measure
wrong**. Muted text reads as tasteful restraint but falls below the legible
threshold; a button feels the right size but misses it by a few pixels;
`<strong>` scattered through the copy quietly introduces a type weight the scale
never declared. None of that shows up in a screenshot. All of it shows up in a
measurement.

This skill is how to take those measurements — and how not to fool yourself with
them.

## Rule zero — suspect the measurement before you suspect the app

This is the most important rule here and the easiest one to skip.

The first contrast pass over this repo reported **186 failures**. That number was
useless. Two bugs lived in the *measuring code*, not in the app:

- `.nav-day-no` has a **gradient** background, so `backgroundColor` returns
  transparent, so the background probe walked up to the white `body` and
  concluded "white text on white" — a ratio of 1.0.
- `.nav-link.is-current` has a **semi-transparent** background,
  `rgba(61,139,247,0.1)`. The probe took the first three numbers and treated it
  as solid blue. The real background is 10% blue over white, which is nearly
  white. It reported 1.39; the element actually passes.

After fixing the probe: **47 failures**, all real.

Signals that should stop you and send you back to the measuring code:

| What you see | What it almost always means |
| --- | --- |
| A ratio of exactly `1.0` | Text colour equals background — you probed the wrong background, the text is not invisible |
| Many rows sharing one number | ONE token is wrong, not N separate bugs |
| A failure on something plainly legible | Gradient background, semi-transparent background, or `opacity` on an ancestor |
| A failure count too large to believe | The probe is broken; the app is not that bad |

**Before reporting any finding, open one element and check it by hand.** If the
number disagrees with what your eyes see, the number is wrong.

## How to measure

Run the app, drive Chrome over CDP, read `getComputedStyle`. That is what the
user actually receives, after every layer of CSS has resolved.

This app loads content client-side from Firestore, which headless Chrome usually
cannot reach. Start a second server with **Firebase disabled** so content falls
back to the bundled JSON, and leave port 3000 alone for the human:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY= NEXT_PUBLIC_FIREBASE_PROJECT_ID= npx next dev -p 3100
```

**Never run `npm run build` or `rm -rf .next` while someone else's dev server is
up.** Both write the shared `.next` directory. The other server keeps answering
200 but starts serving a half-stale CSS chunk, and the next hour goes into
debugging a change that was applied correctly all along. This happened here.

Resolve the background correctly — this is where the probe usually goes wrong:

```js
// Collect background layers from the element up to the root, then composite
// BOTTOM-UP. Return null on a gradient: measure what you can, never guess.
const bgOf = (el) => {
  const layers = [];
  for (let n = el; n; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (/gradient|url\(/.test(s.backgroundImage)) return null;
    const c = parse(s.backgroundColor);
    if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; }
  }
  let base = { r: 255, g: 255, b: 255, a: 1 };
  for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
  return base;
};
```

Measure across **several screens, two widths (1400 and 390), and both colour
schemes**. Overflow and tap-target bugs only appear at the narrow width. And see
the colour-scheme warning below — it is its own trap.

## What to check

### 1. Does the app obey itself

The README's *Design system* section states a set of rules. Those are not
decoration — they are **testable claims**. Checking the app against its own
stated rules is the cheapest way to find bugs, because the standard already
exists and nobody has to argue about taste.

Caught this way: the README claims "exactly three font weights"; four were
rendering.

### 2. Type weights leaking in from browser defaults

The scale declares 400 / 500 / 650. But browsers give `<strong>`, `<b>` and
`<th>` a weight of **700**, which is not in the scale. Left alone, every bolded
word mid-sentence outweighs the very heading it sits under.

```css
strong, b, th { font-weight: var(--weight-bold); }
```

Same class of trap: `<code>`, `<small>` and `<sub>` carry their own browser font
sizes. Always count the weights and sizes **actually rendering**, never the ones
declared.

### 3. Contrast — and the trap in fixing it

Measurement showed the faintest text tier at **2.63:1** against the page
background, where AA requires 4.5. That tier is used for vocabulary table
headers and `<code>` — real content that has to be read.

The reflex is to darken both muted tiers until they pass. **Don't.** Forcing
both to 4.5 converges them onto nearly the same colour (`#66728a` and
`#65728c`): compliant, but the hierarchy is gone, and hierarchy is the whole
reason there were two tiers.

The correct move is to **shift each tier one step down an existing scale**:

```
--text-muted:  slate-500 → slate-600    4.48 → 6.94
--text-subtle: slate-400 → slate-500    2.63 → 4.48
```

Two distinguishable tiers survive, and the worst one stops being bad.

Three things follow:

- **Fix at the alias layer, not the primitive.** Primitives are the scale;
  changing one warps everything built on it. `grep` first — here those two
  primitives were referenced by nothing but the two aliases, so editing the
  aliases was enough and clean.
- **The harshest surface sets the standard.** Muted text reached 4.77 on white
  cards but only 4.48 on the page background. Measure both, take the lower.
- **Don't chase 0.02.** Going from 2.63 to 4.48 is a real win. Distorting a
  primitive to claim the last two hundredths is a bad trade.

### 4. Both colour schemes, or it isn't fixed

A fix applied to the light palette only is not a fix. If the person reviewing it
runs their system in dark mode, your reported improvement is zero **for them**,
and a "dark mode not audited" line at the bottom of the report does not cover
that. This happened here: light mode went 186 → 47 while dark mode stayed
untouched, and dark mode was what the reviewer was actually looking at.

Dark mode has its own numbers. Here `--text-subtle` measured **4.30:1** against
the dark background — failing, but nowhere near as badly as light mode's 2.63,
so the fix is different. Measure it separately; never assume one palette's fix
carries.

Note there are usually **two** dark blocks to edit — one under
`prefers-color-scheme`, one under the explicit `data-theme` override. Changing
only one leaves the toggle broken.

### 5. Tap targets

The rule here is 40px. Note that the wider industry standard, and the one the
external skills below use, is **44px** — this repo's own bar is set lower.

What slips through is never the big buttons:

- small icon buttons (the drawer handle here is **34×34**)
- navigation rows short by a pixel or two (**190×39**) — invisible to the eye,
  visible only to measurement
- inline text links inside prose, where 40px does not apply the same way and
  judgement is required

Measure `getBoundingClientRect()` at both widths.

### 6. One primary button per screen

Not an aesthetic rule. Two primary buttons are two places the eye is pulled, and
the reader has to decide which one is the real action — which is precisely the
decision the design was supposed to make for them.

The most common violation is **a tab using the primary style to mean
"selected"**:

```jsx
variant={tab === s.id ? 'primary' : 'quiet'}   // selected tab becomes a primary button
```

A selected tab is **state**, not an action. It should not compete for emphasis
with the screen's real action button.

### 7. Emphasis by pushing the secondary down

The README says it outright: emphasis comes from **de-emphasising what is
secondary**, not from bolding what is primary. A `<strong>` nested inside
another, or three things in one block all claiming attention, means this rule
has been inverted.

## Rules borrowed from external skills

Synthesised from [anthropics/claude-code — frontend-design](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design),
[nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
and [h3nryprod01/design-taste](https://github.com/h3nryprod01/design-taste).
Only the parts that are **measurable** and that suit this repo are kept.

### Applicable, and checked

| Rule | Status in this repo |
| --- | --- |
| Body contrast ≥ 4.5:1, large text ≥ 3:1 | token tiers fixed; 47 badge / quiet-button cases remain |
| `prefers-reduced-motion` required for every animation | pass — 0 elements still moving |
| `:focus-visible` always visible | pass — 12/12 on Tab |
| UI animation < 300ms | pass |
| Semantic z-index scale, never `999` / `9999` | pass — 1 / 20 / 25 / 30 / 40 / 60 |
| Reading measure 65–75ch | pass — 68ch |
| line-height ≥ 1.5 body, 1.1–1.2 headings | pass — 1.65 / 1.2 |
| Animate only `transform` and `opacity` | see below |
| Tap targets ≥ 44px | this repo's README sets 40px |

**`transition: all` is a real defect — fix it on sight.** It makes the browser
watch every property, so adding any declaration to that selector later silently
animates it too. List the properties that actually change.

### Not applicable — and why

This is the part that needs judgement. General rules are written for the web at
large, not for this repo.

- **"Animate only transform/opacity"** → `.progress-fill` uses
  `transition: width`. Switching to `transform: scaleX()` would **squash the
  gradient**: at 20% it compresses the whole ramp into 20% of the width instead
  of showing the first 20% of it. Keep `width`; a deliberate trade.
- **"Never use pure `#fff`"** → `--text-on-brand: #ffffff` is correct, because
  it needs maximum contrast against the brand colour. That rule is about
  *surfaces*, not about text sitting on a coloured one.
- **"Never use em dashes"** → written for English prose. Vietnamese uses them
  normally, and this repo's voice uses them deliberately. Ignore.
- **Anti-slop, choosing an aesthetic direction, avoiding "template" looks** →
  this repo already has a token table and its own stated rules, so it is past
  that stage. Those skills are strongest when **building something new**; this
  one is for **reviewing what exists**.

### The test most worth borrowing

From frontend-design: *would this exact solution work just as well for a
completely unrelated project?* If yes, it is a default, not a decision.

And: **the first version is a draft — it exists to be critiqued.** Never ship it
straight.

## How to report

**Group by cause, not by row count.** Those 186 rows reduced to two causes. A
186-line report is unusable; "one colour token is wrong, here is the line" is
fixable immediately.

Every finding needs a **measurement**, the **threshold it misses**, and **where
the user meets it**. Without a measurement it is an opinion, and opinions about
interfaces never settle.

State what you did **not** check. This pass did not cover keyboard navigation
through whole flows, or screen readers. Silence about those reads as a clean
bill of health.

## Don't

- Don't change the interface because it "looks better". Change it because a
  measurement shows it is broken.
- Don't touch spacing, radii or shadows unasked — this repo runs a 4/8 grid and
  a hand-picked size set, and adjusting one value off-system breaks the system.
- Don't add a UI library. Plain CSS and tokens are deliberate here.
- Don't trust screenshots. A screenshot shows everything looking fine, which is
  exactly the failure mode this skill exists to catch.
