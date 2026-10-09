# UI alignment: BSO Jobs ← BSO Intelligence

Handoff for the Claude session working in **bso-jobs-site**. Written 2026-10-09 from a read-only audit of both repos.

- **Reference repo (patterns):** `C:\Users\thoma\Documents\GitHub\bso-intelligence`. Paths below that start with `intel:` are in that repo.
- **This repo:** `bso-jobs-site`. Paths without a prefix are here.
- **Citation format:** `app/globals.css` here is minified (49 long lines), so `globals.css:18` means "on line 18". Find the selector by name.

---

## 1. Goal and decisions

Make BSO Jobs feel like the same product family as BSO Intelligence. The two should share interaction grammar, motion, header behaviour, tap targets, focus handling and component structure. Jobs is **not** to become dark. The owner does not want the Jobs colour theme changed.

The two palettes are already siblings. Intelligence's light scope `.theme-paper` (`intel:app/globals.css:49-66`) uses exactly the Jobs colours: paper `#f4f6f0`, forest `#114634`, ink `#10231d`, line `#cbd3c9`, accent `#007800`. So every place this doc maps an Intelligence token to Jobs, the light value comes from that scope and no new colour is invented.

### a) Shared grammar (Jobs adopts)

1. **Mobile menu.** Replace the dropdown with Intelligence's full-screen slide-in menu panel: big Georgia links, staggered entry, pinned actions at the bottom, a focus trap and scroll lock. The owner specifically likes this.
2. **Header behaviour:**
   - nav links show which page you're on (`aria-current`);
   - the product switch marks the current product by route instead of hard-coding it;
   - 44px tap targets on the menu and close buttons.
3. **Interaction baseline:**
   - one visible focus ring everywhere, replacing the `outline:0` rules that have no replacement;
   - 44px minimum tap targets on phones;
   - inputs and selects at 16px on phones, so iOS doesn't zoom in;
   - job rows reachable by keyboard.
4. **Overlays.** Every sheet or modal gets Escape to close, a focus trap, scroll lock, focus return, and one easing curve. The job quick-view sheet currently has none of these.
5. **Motion tokens:**
   - one signature easing, `cubic-bezier(0.22,1,0.36,1)`;
   - Intelligence's durations;
   - a shorter reveal (10px rather than 32px);
   - full `prefers-reduced-motion` coverage.
6. **Phone density.** Small grey explanatory text is hidden on phones; this is the owner's standing rule in Intelligence. Section rhythm on phones follows Intelligence's tighter scale.
7. **Type hierarchy.** Keep Georgia for display and a sans for UI, as now. Bring the phone display sizes in line with Intelligence's ladder, because the Jobs headings are much larger on phones.
8. **Feedback patterns:**
   - inline `role="status"`/`role="alert"` messages instead of toasts;
   - an `aria-live` result count on the filtered list;
   - a skeleton shimmer pattern for any future loading state.

### b) Per product (stays different)

| Aspect | Intelligence | Jobs (keep) |
|---|---|---|
| Surface | Dark (`#0a0a0a`) | Light: cream `#f4f6f0`, white cards, `--deep #062c22` panels/footer |
| Accent text | `#5cb96b` on black | `#007800` / `#114634` on cream |
| Header bg | `rgba(12,12,12,.88)` | `rgba(244,246,240,.9)` (already the same structure) |
| Hero/feature panels | Black with green radial glow | Green gradients (`132deg,#007800,#114634`) |
| Footer | `bg-black/40` | `--deep` |
| Product badge | "Intelligence · Beta" | "Jobs" |

### c) Undecided

The owner needs to decide these (section 6). The biggest one is **corner radius**. Jobs is fully square and Intelligence uses pills and 16px cards. This handoff **does not change radii** until the owner decides.

---

## 2. Token table

Jobs has no Tailwind utilities in use. All styling is hand-written CSS in `app/globals.css`, so the tokens below go into the `:root` block at `globals.css:3` as CSS variables. Existing variables keep their names and values.

### Colour (light equivalents, already the Jobs palette)

| Role | Intelligence (dark) | Jobs variable (existing / **add**) | Jobs value |
|---|---|---|---|
| Page | `--paper #0a0a0a` | `--paper` | `#f4f6f0` |
| Alt section | `--paper-2 #141414` | **`--paper-2`** | `#e9eee7` (already hard-coded in `.jobs-section`) |
| Card | `--card #121212` | `--white` | `#fff` |
| Text | `--ink #f2f2ef` | `--ink` | `#10231d` |
| Secondary text | `--ink-2 #d2d2ce` | **`--ink-2`** | `#283c35` (from `intel:.theme-paper`) |
| Muted | `--muted #a1a19c` | `--muted` | `#637169` |
| Faint | `--faint #8a8a85` | **`--faint`** | `#5f6b64` |
| Hairline | `--line #222` | `--line` | `#cbd3c9` |
| Strong line | `--line-strong #333` | **`--line-strong`** | `#a9b5a8` |
| Hover/pill fill | `--night-3 #1c1c1c` | **`--fill`** | `#eef1eb` |
| Brand fill | `--brand #007800` | `--green` | `#007800` |
| Accent text | `--accent #5cb96b` | `--green` | `#007800` |
| Accent tint | `--accent-soft #10241a` | **`--accent-soft`** | `#dce9da` (already used for selected alert pills) |
| Dark panel | `--deep #062c22` | `--deep` | `#062c22` |
| Exclusive | `--exclusive #8e2524` | (hard-coded) | `#8e2524`, unchanged |
| Caution | `--caution #d8b36a` | **`--caution`** | `#9a6b1f` |

### Type

| Role | Intelligence | Jobs today | Proposed Jobs |
|---|---|---|---|
| UI font | Inter (`intel:app/layout.tsx:18`) | Arial (`globals.css:4`) | **Keep Arial** (open question Q3) |
| Display | Georgia stack, weight 400, `-0.035em` (`intel:globals.css:149-153`) | Georgia inline per rule | Add `--font-display: Georgia,"Times New Roman",serif` and use it everywhere `Georgia` is written |
| Index-page h1 | `2.4rem` → `3.2rem` at 640px, `leading-none`, `-0.04em` (`intel:app/firms/page.tsx:23`) | `.directory-hero h1` `clamp(3.4rem,7vw,7rem)`, 2.8rem at ≤720 | Keep the desktop clamp; at ≤720 use `2.4rem/1, -0.04em` |
| Section h2 | `1.75rem` → `2.1rem` (`intel:app/page.tsx:41`) | `.section-heading h2` `clamp(2.5rem,4.5vw,5rem)`, 2.65rem at ≤720 | At ≤720 use `1.75rem/1.05, -0.03em` |
| Job title in list | `1.2rem/1.22, -0.02em` (`intel:components/jobs/job-card.tsx:45`) | `.job-copy h3` `1.26rem/1.22` | Keep (already aligned) |
| Eyebrow | `.68rem/700/.14em` uppercase (`intel:globals.css:140-147`) | `.eyebrow` `.72rem/800/.17em` | Keep (close enough; brand voice) |
| Meta | 12–13px | `.meta` `.74rem` | Keep |
| Inputs on phones | `16px` (`intel:components/ui/filters.tsx:26,54`) | search `1.18rem`, selects `.7rem` | **`16px` minimum for every input/select at ≤720** |

### Spacing, layout, radius, shadow, motion

| Token | Intelligence | Jobs today | Proposed Jobs |
|---|---|---|---|
| Header height | 76 / 68 at ≤720 (`intel:globals.css:379-445`) | 76 / 68 | Same, no change |
| Gutter | Header `4vw` / `20px` at ≤720 | `4vw` / `20px` | Same, no change |
| Section padding on phones | `pt-12` = 48px (`intel:components/firm/section.tsx:33`) | `75px 20px` (`globals.css:36`) | `56px 20px` at ≤720 |
| Tap target | 44px (`size-11`) | 38–43px in places | **44px minimum** |
| Focus ring | `2px solid accent, offset 2px` (`intel:globals.css:126-129`) | Mostly none (`outline:0`) | `2px solid var(--green); outline-offset:2px` |
| Easing | `cubic-bezier(0.22,1,0.36,1)` (`intel:globals.css:100`) | `cubic-bezier(.2,.8,.2,1)` / `(.2,.7,.2,1)` | Add `--ease: cubic-bezier(0.22,1,0.36,1)` and use it everywhere |
| Fast UI transition | 150ms (buttons), 200ms (card) | .2–.35s | 150ms colour/background, 200ms shadow/transform |
| Panel open | Menu 300ms; sheet 280ms; modal 320ms | `slidein` 300ms, `alertin` 240ms | 300ms menu, 280ms sheet, 240ms dialog (keep), all `var(--ease)` |
| Reveal | 10px rise, scroll-linked (`intel:globals.css:354-372`) | 32px over .75s (`globals.css:4`) | **12px over .5s `var(--ease)`** |
| Radius | Pills/16px (`rounded-full`/`rounded-2xl`) | 0 | **No change pending Q1** |
| Shadow (overlay) | `0 24px 48px -24px rgb(0 0 0/.9)` | `-20px 0 70px rgba(0,0,0,.22)` | Keep the Jobs values (light surfaces need lighter shadows) |
| z-index ladder | header 40, palette 60, modal 70, menu 80 | header 20, modal 40, alert 70 | header 20, job sheet 40, alert 70, **mobile menu 80** |

---

## 3. Component by component

### 3.1 Mobile menu: full-screen slide-in panel (highest priority)

- **Reference:** `intel:components/layout/mobile-menu.tsx` (the whole file, about 200 lines).
- **Jobs files:** `components/site-chrome.tsx:9-11` (`SiteHeader`) and `globals.css:6` (`.menu-button`) and `:36` (≤720 `nav` dropdown).

**Today:** at ≤720 the `nav` becomes an absolute dropdown under the header (`display:none` → `flex`). It has no animation, no `aria-expanded`, no focus trap, no Escape, no scroll lock, and a 38×38 button.

**Target behaviour** (port it exactly, in light colours). Under 980px (Jobs' existing nav-collapse width), the hamburger opens a `role="dialog" aria-modal="true"` panel. It is rendered with `createPortal(…, document.body)` (`intel:mobile-menu.tsx:27-31,197`), because the header's `backdrop-filter` would otherwise trap a fixed child.

**Panel**
- `position:fixed; inset:0; z-index:80; display:flex; flex-direction:column; background:var(--paper)`.
- Closed state: `transform:translateX(100%); visibility:hidden; pointer-events:none`, plus the `inert` attribute.
- Open state: `transform:none; visibility:visible`.
- `transition: transform 300ms var(--ease), visibility 300ms` (`intel:mobile-menu.tsx:70-81`).

**Glow layer** (light version of `intel:mobile-menu.tsx:82-85`): an absolute `inset:0` layer with `pointer-events:none`:
```css
background: radial-gradient(90% 50% at 100% 0%, rgb(0 120 0 / .10), transparent 70%);
```

**Top bar**
- `height:64px; padding:0 20px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--line)`.
- Left: logo 36px plus the label "JOBS" in `.68rem/800/.14em` uppercase `var(--green)`. This mirrors the "INTELLIGENCE" label at `intel:mobile-menu.tsx:89`.
- Right: close button, a 44×44 circle (`border-radius:50%` here is a control, see Q1) with `background:var(--fill)`. It holds an X icon (lucide `X` size 16, stroke 1.6).

**Body**
- `flex:1; overflow-y:auto; padding:24px 20px max(24px, env(safe-area-inset-bottom))`.

**Links** (Jobs, Companies, Newsletter, For employers; keep the existing hrefs)
- Each is a row: `display:flex; justify-content:space-between; align-items:center; padding:16px 0; border-bottom:1px solid var(--line)`.
- Label: `font: 400 2rem/1 var(--font-display); letter-spacing:-.03em`.
  - Colour: `var(--ink)` when current, else `var(--ink-2)`.
- Arrow: lucide `ArrowRight` size 16.
  - Colour: `var(--green)` when current, else `var(--faint)`.
- Stagger:
  - closed: `opacity:0; transform:translateX(24px)`;
  - open: `opacity:1; transform:none`;
  - `transition: opacity 300ms var(--ease), transform 300ms var(--ease)`;
  - `transition-delay: 80ms + i*40ms` when opening, 0 when closing (`intel:mobile-menu.tsx:104-124`).

**Bottom actions** (`margin-top:auto; padding-top:40px; display:grid; gap:12px`)
- **Primary:** "Get job alerts" (opens the existing `JobAlertModal`; keep its trigger logic and analytics) as a full-width 48px button.
  - `background:var(--green); color:#fff`.
  - This mirrors the "My plan" slot in Intelligence (`intel:mobile-menu.tsx:129-137`). Which action goes here is open question Q5.
- **Secondary:** "BSO Intelligence →" as a 48px outlined button, `border:1px solid var(--forest)`.

**Hamburger**
- 44×44 (was 38).
- Keep the two lines (`22px × 1.5px`).
- Add `aria-expanded`, `aria-controls="mobile-menu"`, and `aria-label="Open menu"` (was "Toggle menu").

**Behaviour** (all from `intel:mobile-menu.tsx:32-67`)
- Escape closes.
- Tab and Shift-Tab are trapped between the first and last `a[href], button:not([disabled])`.
- `document.body.style.overflow="hidden"` while open; restore the saved value on close.
- On open, focus the close button after `setTimeout(30)` (waits for `inert` to lift).
- On close, return focus to the hamburger with `preventScroll:true`.
- Close on route change: compare `usePathname()` to the last path during render.
- Links keep calling `close()`.

**Desktop:** unchanged. The panel and hamburger are hidden above 980px with `display:none`.

**Reduced motion:** transitions go to 0 (covered by the global rule in 3.4).

### 3.2 Header (desktop)

- **Reference:** `intel:components/layout/nav-links.tsx:24-34`, `intel:components/layout/product-switch.tsx`.
- **Jobs files:** `components/site-chrome.tsx:11`, `globals.css:6,48-49`.

**Product switch**
- Set `aria-current="page"` on "Jobs" only when the route is a Jobs route (`/jobs*`, `/companies*`).
- On `/employers`, neither item is current. Today "Jobs" is hard-coded as current on every page.
- Styles are already the Intelligence pattern (`.product-switch` mirrors `intel:globals.css:415-435`), so no change.

**Nav links: current-page state**
- Add `aria-current="page"` where `pathname === href || pathname.startsWith(href + "/")` (`intel:nav-links.tsx:26`). "Newsletter" (`/jobs#newsletter`) never gets it.
- Style for `nav a[aria-current="page"]`: `color:var(--ink)`, with the existing green underline pseudo-element shown permanently (`transform:scaleX(1)`).
- The Intelligence equivalent is a filled pill (`bg-night-3`). The underline is the Jobs-native version of the same signal, so it stays square.

**Header search:** none. See Q4.

### 3.3 Interaction baseline: focus, tap targets, iOS inputs

- **Reference:** `intel:app/globals.css:126-129` (focus) and `intel:components/ui/filters.tsx:9-30` (search field). For 44px targets, see the audit list: hamburger, close, chips `h-11`, socials `size-11`.

**Focus**
- Add global `:focus-visible{outline:2px solid var(--green);outline-offset:2px}`.
- On dark surfaces (`.filter-wrap`, `.newsletter-inner`, footer, `.job-alert-inline`), use `outline-color:#b9e5b7`. That green is already used for light eyebrows.
- Keep the existing amber `#e0a92d` ring on the alert UI (`job-alerts.css:242-252`), or switch it to the green ring for consistency (Q6).
- Every `outline:0` that has no replacement needs a visible state:
  - `.search-band input` (`globals.css:12`): add `.search-band:focus-within{box-shadow:inset 0 -2px 0 #b9e5b7}`.
  - `.select-row select`: add `.select-row label:focus-within{background:rgba(255,255,255,.12)}` plus the outline ring on the label.
  - Newsletter input (`globals.css:26`): `:focus-visible{outline:2px solid var(--deep);outline-offset:-2px}`.

**Tap targets at ≤720**
- `.menu-button` 44×44.
- `.job-modal` close button 44×44 (was 43).
- `.footer-socials a` 44×44: keep the visual 26px circle, use `padding:9px` or a transparent hit area.
- `.select-row label` `min-height:44px`.

**iOS zoom guard at ≤720**
- `.search-band input{font-size:16px}`.
- `.select-row select{font-size:16px}` (today `.7rem`, which zooms).
- Newsletter and alert inputs ≥16px.

**Job rows by keyboard**
- `.job-card` is `<article onClick>`, so it isn't focusable. Do **not** turn the article into a button.
- Make the title a `<button className="job-title-button">` that calls the existing `onSelect(primary)`. Style: `font:inherit; color:inherit; text-align:left; background:none; border:0; padding:0; cursor:pointer`.
- Keep the article's `onClick` so mouse users see no change.
- This mirrors `intel:job-card.tsx:45-55`, where the title is the focusable element.

**Live result count**
- Add `<p role="status" aria-live="polite" className="sr-only">{n} roles</p>` next to the visible count in `.search-band` (`intel:components/jobs/jobs-browser.tsx:114`).
- Add a `.sr-only` utility if one doesn't exist.

### 3.4 Motion

- **Reference:** `intel:app/globals.css:100,215-227,354-372`, `intel:components/motion/reveal.tsx`.
- **Jobs files:** `globals.css:4` (Reveal), `:16,18,21,32,38`, `job-alerts.css`, `components/site-chrome.tsx:20-24`.

**Easing**
- Add `--ease:cubic-bezier(0.22,1,0.36,1)` to `:root`.
- Replace these with `var(--ease)`: `cubic-bezier(.2,.8,.2,1)` (featured card, `slidein`) and `cubic-bezier(.2,.7,.2,1)` (Reveal).

**Reveal**
- Change the `translateY(32px)` start to `translateY(12px)`.
- Change the `.75s` transition to `.5s var(--ease)`.
- Keep the IntersectionObserver (threshold .12) and the stagger delays.
- Don't port Intelligence's `animation-timeline: view()`. It needs `@supports`, and the observer works everywhere.

**Durations**
- Job card hover (`padding, background`): `.25s` → `.2s var(--ease)`.
- Featured card lift: keep the −8px, `.35s` → `.3s var(--ease)`.
- Nav underline: keep `.25s`.

**Reduced motion:** add a global block mirroring `intel:globals.css:215-227`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
    scroll-behavior: auto !important;
  }
}
```
This covers the gaps the audit found: job-card hover, `slidein`, `alertin` and company cards. Keep the existing per-effect rules: the marquee becomes a scroll strip, and orbits get `display:none`.

**Hover gating**
- Wrap lift and translate hovers (featured card, company arrow, footer socials) in `@media (hover:hover) and (pointer:fine)`, as Employers already does (`employers.css:15,47`) and Intelligence does (`intel:globals.css:519`). Phones then don't get stuck in hover states.

### 3.5 Job quick-view sheet (right side)

- **Reference:** `intel:components/sources/source-sheet.tsx:61-74` (right drawer) and `intel:components/firm/firm-preview-modal.tsx:66-123` (scroll lock, focus trap, focus return).
- **Jobs files:** `job-board.tsx:368` (`JobModal`), `globals.css:32` (`.modal-backdrop`, `.job-modal`, `@keyframes slidein`).

**Keep:** `width:min(620px,100%)`, the cream background, the content and the backdrop colour.

**Add, copying `components/job-alerts.tsx:41-62`, which already does all of this in this repo:**
- Escape closes.
- Tab focus trap.
- `body{overflow:hidden}` while open.
- Focus moves into the sheet on open and goes back to the triggering element on close.
- `role="dialog" aria-modal="true" aria-labelledby` pointing at the title.

**Motion**
- `slidein` becomes `from{transform:translateX(32px);opacity:0}`, with `animation: slidein 280ms var(--ease)`. This is the source-sheet motion (`intel:source-sheet.tsx:70-74`).
- Backdrop fade: 180ms.

**Phones (≤720):** make the sheet a bottom sheet, the same pattern Employers and Intelligence use (`employers.css:154-158`, `intel:firm-preview-modal.tsx:174-184`):
- `width:100%; height:auto; max-height:92dvh; align-self:flex-end`.
- A grab handle: `width:40px; height:4px; background:var(--line-strong); margin:10px auto 0`.
- Padding `28px 20px calc(24px + env(safe-area-inset-bottom))`.
- Animation `from{transform:translateY(100%)}`, 380ms `var(--ease)`.
- This is optional and its own step (rollout step 6).

### 3.6 Filters on phones

- **Reference:** `intel:components/ui/filters.tsx:94-142` (Chip/ChipRow, horizontal scroll on phones) and `:147-168` (MoreFilters).
- **Jobs files:** `job-board.tsx:352` (`.filter-wrap`), `globals.css:12,36,47`.

**Keep** native `<select>`s and all filter logic, state and labels (`job-board.tsx:314-323`).

**At ≤720:**
- `.select-row` stays a 2-column grid.
- Each label: `min-height:44px`; label text `.62rem` (was `.56rem`); select `16px`.
- `.active-filter` and Clear: Clear becomes a 44px-tall button.

**Not in scope:** converting the selects to chip rows. That's open question Q7.

### 3.7 Phone density: hide small grey explainer text

- **Reference:** the owner's rule, applied in Intelligence (`intel:components/firm/section.tsx:53,64`; `intel:components/intelligence/firm-browser.tsx:174`): small grey explanatory paragraphs are hidden under 640px. Data stays visible.

**Jobs candidates at ≤720:**
- `.jobs-aside p` (the editorial paragraph beside the list).
- `.section-heading>p`.
- `.job-action p` "Apply by" label: keep the date and hide only the label word (Q8).

**Do not hide:**
- `.seo-support` copy (SEO; see constraints);
- metadata like location, level and salary;
- anything in forms, consent or legal text.

### 3.8 Job card, logo tile, tags (already aligned, light touch only)

Intelligence's job card was built to mirror Jobs (`intel:components/jobs/job-card.tsx`: eyebrow company, Georgia title, square category and exclusive tags, `<details>` for grouped postings). Keep the Jobs versions. The only changes:
- **Title button:** see 3.3.
- **Grouped postings `summary`:** add `min-height:44px; display:flex; align-items:center` at ≤720. Keep the label text logic at `job-board.tsx:302-305` unchanged.
- **Company logo tile:** identical to `intel:components/jobs/company-logo.tsx` (white, `1px solid #cbd3c9`, square, `object-fit:contain`). No change.

### 3.9 Empty and loading states

- **Reference:** `intel:components/ui/primitives.tsx:76-83` (EmptyState) and `intel:app/globals.css:184-189` (`.skeleton`).
- **Jobs files:** `.empty` (`globals.css:18`).

**Empty state**
- `.empty{padding:56px 24px; text-align:center; border:1px solid var(--line); background:rgba(255,255,255,.6)}`.
- Title line: `.85rem/700 var(--ink-2)`.
- Body: `.8rem/1.6 var(--muted); max-width:28rem; margin:6px auto 0`.
- Add a "Clear filters" button calling the existing `reset` when filters are active. This mirrors `intel:firm-browser.tsx:139-149`.

**Skeleton:** add the class now for future use:
```css
.skeleton { background: linear-gradient(90deg, var(--paper-2) 0, #f7f9f5 40%, var(--paper-2) 80%); background-size: 800px 100%; animation: bso-shimmer 1.4s linear infinite; }
@keyframes bso-shimmer { from { background-position: -400px 0 } to { background-position: 400px 0 } }
```
`loading` is hard-coded `false` today (`job-board.tsx:312`), so nothing renders it yet.

### 3.10 Footer

- **Reference:** `intel:components/layout/site-footer.tsx`.
- **Keep:** the Jobs footer (`--deep`, the "Not NYC. Not trying to be." tagline, the grid).
- **Change:** socials get a 44px hit area (3.3) and the hover is gated (3.4). Nothing else.

---

## 4. Rollout (each step ships on its own)

Run these checks for every step:
- `npm run build` passes.
- No changes to the files listed in section 5.
- Check desktop at 1440px and a phone at **390×844** in the browser.
- Keyboard-only pass on the changed component (Tab, Shift-Tab, Enter, Escape).

### Step 1: Mobile menu (3.1), plus `--ease` and the new colour variables

- **Files:** `components/site-chrome.tsx`, `globals.css`.
- **Desktop:** header unchanged at 1440 and 1100. The hamburger is hidden above 980.
- **390px:**
  - the hamburger is 44px;
  - the panel slides in from the right in 300ms with staggered rows;
  - the page underneath doesn't scroll;
  - Escape and the X close it, and focus returns to the hamburger;
  - Tab stays inside the panel;
  - tapping a link navigates and closes it;
  - the bottom buttons sit above the home indicator (safe area).

### Step 2: Focus, tap targets and iOS inputs (3.3), plus the live result count

- **Desktop:** Tab through `/jobs`. Search, both selects, each job title, View links, newsletter input and footer links all show a visible ring. Mouse clicks show no ring.
- **390px:**
  - focusing search or a select does not zoom the page;
  - the menu, modal close, Clear and socials are all at least 44px (measure in devtools);
  - VoiceOver or a screen reader announces the "N roles" count after typing.

### Step 3: Motion tokens and reduced motion (3.4)

- **Desktop:** reveals rise 12px; card hovers feel quicker. With OS "reduce motion" on, nothing animates or slides.
- **390px:** no hover state gets stuck after tapping a featured or company card.

### Step 4: Header current-page states (3.2)

- **Desktop:**
  - on `/jobs` the Jobs nav link is underlined and the product switch shows Jobs as current;
  - on `/companies` the Companies link is current;
  - on `/employers` the product switch has no current item.
- **390px:** the current link shows in `--ink` with a green arrow in the mobile menu.

### Step 5: Job quick-view sheet accessibility (3.5, desktop behaviour)

- **Desktop:** open a job. Escape closes it, focus returns to that job's title, Tab is trapped, and the background doesn't scroll. The slide is 280ms.
- **390px:** same checks.

### Step 6 (optional): Bottom sheet on phones (3.5)

- **390px:** the sheet rises from the bottom with a grab handle and is at most 92% of the screen height; content scrolls inside it.
- **Desktop:** unchanged right-side sheet.

### Step 7: Phone density and type sizes (3.7, the type rows in §2, the ≤720 section padding)

- **390px:**
  - the `/jobs` hero h1 is 2.4rem;
  - section h2s are 1.75rem;
  - sections are 56px apart;
  - the explainer paragraphs listed in 3.7 are hidden;
  - no data is lost.
- **Desktop:** unchanged.

### Step 8: Empty state and skeleton class (3.9)

- **Both:** search for "zzzz". The bordered empty state shows with a working "Clear filters" button.

---

## 5. Constraints (must hold at every step)

1. **No changes to routes, redirects or URLs.** That includes `next.config.ts:8` (`/` → `/intelligence`) and `lib/jobs/urls.ts`.
2. **No changes to data or ranking:** `lib/jobs/server.ts`, `lib/jobs/types.ts`, `lib/jobs/recruiting-updates.ts`, `lib/jobs/ranking.ts` (`RANKING_WEIGHTS`, `rankJobs`). In `job-board.tsx`, also leave alone the pins and tiers (`:111-183`), the filter state and `filtered` (`:314-323`), and the label normalisation (`:166-210`).
3. **Grouped duplicate postings unchanged:** `roleGroupKey`, `groupJobs` and the variant order and labels (`job-board.tsx:281-307`). Only the CSS of `summary` changes.
4. **Job alerts unchanged:**
   - `components/job-alerts.tsx` logic, the 27,000ms auto-open, and the session/local storage keys (`job-board.tsx:330-343`);
   - `lib/job-alerts/*`, `app/api/job-alerts/*`, `.github/workflows/*job-alert*`.
   - The mobile-menu "Get job alerts" button calls the existing open handler and adds no new tracking event, unless the owner approves one.
5. **Newsletter capture unchanged:** `id="newsletter"`, the honeypot `website` field, the `/api/newsletter` submit (`job-board.tsx:324`), and the "Joining…" pending state.
6. **Analytics unchanged:** `<Analytics/>` in `app/layout.tsx:36`, and every `trackJobAlert` / `employer_*` / `intelligence_*` event name and payload.
7. **SEO unchanged:**
   - all `metadata` / `generateMetadata` exports;
   - JSON-LD (`lib/jobs/structured-data.ts`);
   - `app/sitemap.ts` and `app/robots.ts`;
   - the noindex rules;
   - the `.seo-support` / `.seo-links` copy, which must **not** be hidden on phones.
8. **Brand assets unchanged:** `/bso-logo.png`, `/company-logos/bso-supplied/*`, the logo map (`job-board.tsx:20-110`), the colour palette (§2), and the Georgia and Arial stacks.
9. **No heavy new dependencies.** Use `lucide-react` (already used) for icons. Do **not** add framer-motion, `motion`, or an animation or UI kit. The unused shadcn/radix/vaul/sonner packages stay unused unless the owner asks. The menu is plain React plus CSS.
10. **Accessibility no worse than today, and better where this doc says so.** Every new overlay has Escape, a focus trap, focus return and `aria-modal`. Every interactive element is at least 44px on phones. Contrast is unchanged, since the palette is unchanged.
11. **`/intelligence` and `/employers` keep their own styling.** Don't apply this doc's changes inside `.intel-page`. The shared header changes in step 4 do reach `/employers`.

---

## 6. Questions for the owner

1. **Corner radius.** Jobs is fully square; Intelligence uses pills (buttons, chips, inputs) and 16px cards.
   - (a) Keep Jobs square as its own identity. This is the default in this doc.
   - (b) Round only interactive controls: buttons and selects become pills, cards stay square.
   - (c) Adopt Intelligence radii fully.
   - The menu's close button is a circle in step 1 either way. Is that OK?
2. **Mobile menu breakpoint.** Jobs collapses the nav at ≤720 today; this doc moves the menu to <980 (Intelligence collapses at <1024). Is 980 OK, or keep 720?
3. **UI font.** Intelligence uses Inter for UI text; Jobs uses Arial. Load Inter through `next/font` (light, self-hosted), or keep Arial?
4. **Header search.** Intelligence has ⌘K search in the header; Jobs only has search in the `/jobs` filter bar. Add a header search trigger that jumps to `/jobs` with focus in the search box? This would be no new dependency, but it is a new interaction.
5. **Mobile menu bottom action.** Which action goes in the primary slot: "Get job alerts" (opens the existing modal), "For employers", or "Open BSO Intelligence"?
6. **Focus ring colour.** Should the job alerts' amber `#e0a92d` ring change to the green ring for consistency?
7. **Filters on phones.** Keep native selects (this doc), or convert career path and level to Intelligence-style horizontally scrolling chip rows? Chip rows mean more work, but are more tappable.
8. **Phone density.** Confirm the explainer list in 3.7, especially hiding the "Apply by" label while keeping the date.
9. **Product-switch order.** Jobs shows "Jobs | Intelligence"; Intelligence's switch shows only "Intelligence · Beta" (its Jobs link was removed). Should both headers show both products in the same order?

---

## 7. Prompt for the BSO Jobs session (step 1)

> You're working in the BSO Jobs repo (`bso-jobs-site`, Next.js 16 App Router, hand-written CSS in `app/globals.css`, no Tailwind utilities in use). Read `docs/ui-alignment-from-intelligence.md` in full first, especially §1, §2, §3.1 and §5.
>
> Do **rollout step 1 only**: replace the mobile nav dropdown with the full-screen slide-in menu panel described in §3.1. Also add the new CSS variables from §2 (`--paper-2`, `--ink-2`, `--faint`, `--line-strong`, `--fill`, `--accent-soft`, `--caution`, `--font-display`, `--ease`) to `:root` in `app/globals.css`. Do not change any existing variable values or colours.
>
> The reference implementation is `C:\Users\thoma\Documents\GitHub\bso-intelligence\components\layout\mobile-menu.tsx`. Read it (read-only, do not edit that repo) and port its structure and behaviour into `components/site-chrome.tsx`:
> - portal to `document.body`;
> - `role="dialog"`, `aria-modal`, `inert` while closed;
> - Escape to close and a Tab focus trap;
> - body scroll lock with the previous value restored;
> - initial focus on the close button, and focus returned to the hamburger;
> - close on route change;
> - the 300ms `translateX(100%)` → `0` transition on `var(--ease)`;
> - staggered rows with delay 80ms + i×40ms.
>
> Use plain React, CSS and `lucide-react` only (no new dependencies). Use the light-theme values in §3.1 and the existing four nav links and hrefs. The hamburger becomes 44px with `aria-expanded` and `aria-controls`. For the bottom actions, use a "BSO Intelligence →" outlined button. If the owner hasn't answered Q5 in §6, use a "Get job alerts" primary button. The alert modal's state lives in `job-board.tsx`, not in `site-chrome.tsx`. If opening it from the header would need more than a small, non-behavioural change (for example a window `CustomEvent` that the board already listens for, which it does not today), link the button to `/jobs#newsletter` instead and tell me. Add no new analytics events. Keep the desktop header pixel-identical.
>
> Touch nothing listed in §5. When done:
> - run `npm run build`;
> - check `/jobs` at 1440px and at 390×844 using the step 1 checks in §4;
> - do a keyboard-only pass;
> - show me screenshots of the closed and open menu at 390px.
>
> Don't commit or push until I've seen it.
