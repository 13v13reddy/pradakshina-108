---
name: "Pradakshina"
description: "A quiet, deliberate companion for 108 pradakshinas."
colors:
  green: "#153e35"
  jasmine: "#f6f3e8"
  sage: "#b8cbbd"
  brass: "#e0bd7f"
  line: "#3e6054"
  ink: "#173d34"
  pending-bead: "#6b8978"
  brass-hover: "#ebca92"
  hold-fill: "#f6e3bc"
  guard: "#bfd0b9"
  paused: "#37584b"
  sheet-muted: "#4c6556"
  sheet-line: "#d6dcd0"
  subtle: "#e3e6da"
  switch-off: "#aab8a9"
  danger: "#8b4433"
typography:
  display:
    fontFamily: "Instrument, Georgia, serif"
    fontSize: "clamp(56px, 5.65vw, 78px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.025em"
  count:
    fontFamily: "Instrument, Georgia, serif"
    fontSize: "112px"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Instrument, Georgia, serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.07
    letterSpacing: "-0.02em"
  mobile-title:
    fontFamily: "Instrument, Georgia, serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  introduction:
    fontFamily: "DM, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.85
  body:
    fontFamily: "DM, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "DM, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
  quiet:
    fontFamily: "DM, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  label:
    fontFamily: "DM, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  action: "14px"
  sheet: "18px"
  confirmation: "16px"
  compact-action: "9px"
  switch-track: "20px"
  circle: "50%"
spacing:
  small: "8px"
  gap: "12px"
  control: "18px"
  page: "24px"
  sheet: "30px"
  touch-target: "44px"
components:
  record-ready:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.action}"
    padding: "18px 20px"
    width: "100%"
  record-hover:
    backgroundColor: "{colors.brass-hover}"
  record-guard:
    backgroundColor: "{colors.guard}"
    textColor: "{colors.ink}"
  record-paused:
    backgroundColor: "{colors.paused}"
    textColor: "{colors.jasmine}"
  record-complete:
    backgroundColor: "{colors.jasmine}"
    textColor: "{colors.ink}"
  button-quiet:
    textColor: "{colors.sage}"
    typography: "{typography.quiet}"
    padding: "8px 4px"
  button-solid:
    backgroundColor: "{colors.green}"
    textColor: "{colors.jasmine}"
    rounded: "{rounded.compact-action}"
    padding: "12px 18px"
  button-subtle:
    backgroundColor: "{colors.subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.compact-action}"
    padding: "12px 18px"
  navigation-tools:
    textColor: "{colors.sage}"
    typography: "{typography.quiet}"
  switch-off:
    backgroundColor: "{colors.switch-off}"
    rounded: "{rounded.switch-track}"
    width: "44px"
    height: "44px"
  switch-on:
    backgroundColor: "{colors.green}"
  receipt:
    textColor: "{colors.jasmine}"
    padding: "17px 7px 20px"
    width: "100%"
  bead-progress:
    backgroundColor: "{colors.green}"
    textColor: "{colors.jasmine}"
    width: "340px"
    height: "340px"
  sheet:
    backgroundColor: "{colors.jasmine}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "30px"
    width: "min(460px, calc(100% - 32px))"
  confirmation-sheet:
    backgroundColor: "{colors.jasmine}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "30px"
  history-row:
    textColor: "{colors.ink}"
    padding: "15px 0"
---

# Design System: Pradakshina

## Overview

**Creative North Star: "The Temple Pond"**

A temple pond at rest: one continuous green field, pale jasmine type, sage supporting detail, and brass that marks attention. The interface is quiet and spacious, with a serif voice that feels human and a clear sans serif that keeps actions and saved evidence easy to scan.

The world is expressed through working geometry and restrained material changes. Circular marks carry actual progress; the latest saved round keeps its timestamp after feedback ends. The practice field stays open, while light sheets bring secondary tasks into a separate, readable layer. Local fonts and functional SVG carry the identity without raster illustration.

**Key Characteristics:**

- An open pond-green field with a single brass primary action.
- Instrument Serif for expression and count; DM Sans for operation and evidence.
- Circular, data-bearing geometry with quiet hairline dividers.
- Persistent receipts and brief, state-led motion.

## Colors

The palette pairs deep green with warm botanical neutrals and a small amount of brass. The frontmatter is the normative source for color values; names below describe their jobs.

### Primary

- **Temple Pond Green** (`green`): the full practice field and affirmative actions inside light sheets.
- **Brass** (`brass`): the record action, completed beads, orientation marker, and saved-state detail. `brass-hover` brightens the ready action; `hold-fill` shows deliberate press progress.

### Secondary

- **Sage** (`sage`): supporting text, quiet tools, and saved-device status on green. `guard` makes the duplicate-protected action visibly restful; `paused` supports paused and blocked actions.

### Neutral

- **Jasmine** (`jasmine`): main reading on green, light sheet surfaces, and the completed-action surface.
- **Pond Ink** (`ink`): text and controls on jasmine or brass.
- **Pond Line** (`line`): hairline structure on green. `pending-bead` distinguishes uncompleted marks from jasmine's current mark and brass's completed marks.
- **Sheet Muted** and **Sheet Line** (`sheet-muted`, `sheet-line`): secondary reading and row divisions inside light sheets.
- **Subtle Surface** and **Resting Switch** (`subtle`, `switch-off`): the keep/cancel action and an unchecked preference track.
- **Clay Warning** (`danger`): the text action that starts a new practice; destructive intent remains explicit in copy and confirmation.

**The Attention Rule.** Use brass for the deliberate primary action, completed progress, and small orientation or confirmation details. Use jasmine for primary reading and sage for supporting reading.

## Typography

**Display Font:** Instrument Serif, self-hosted as `Instrument`, with Georgia and serif fallbacks. Both regular and italic are available at regular weight (400).

**Body Font:** DM Sans, self-hosted as `DM`, with a sans-serif fallback. Regular (400) and semibold (600) are the shipped weights. Font synthesis is disabled.

**Character:** Instrument Serif gives the count and quiet headings a calligraphic, human rhythm. DM Sans keeps controls and saved evidence practical and easy to compare. Italic brass is used for the emphasized phrase in the desktop introduction.

### Hierarchy

- **Display** (`display`): the desktop introductory heading; its fluid scale and tight leading belong to short expressive copy.
- **Count** (`count`): the central completion total. Lining, tabular numerals keep the number stable as it changes. Mobile uses a smaller count (106px), compact widths use (96px), and short mobile screens use (94px).
- **Headline** (`headline`): sheet titles. Mobile sheets reduce to (32px); mobile confirmation titles use (31px).
- **Mobile title** (`mobile-title`): a single reassuring line above the progress circle. It reduces to (24px) on compact widths and (23px) on short mobile screens.
- **Introduction** (`introduction`): desktop supporting copy. The narrow desktop layout reduces it to (12px).
- **Body** (`body`): supporting sheet descriptions and preference explanations. Longer notes loosen leading to (1.75–1.8).
- **Control** (`control`): the primary record label. Its subtitle is smaller (11px) with comfortable leading (1.4).
- **Quiet** (`quiet`): secondary tools and timestamps. Practice tools use (11px); timestamps use tabular numerals.
- **Label** (`label`): the functional uppercase completion-state label above the count. Its tracking helps separate state from the much larger number; it is not a decorative eyebrow pattern.

**The Two Voices Rule.** Let the serif carry the heading, count, and sheet titles. Keep actions, instructions, timestamps, and state explanations in DM Sans.

## Layout

The desktop shell is centered, capped at (1192px), and padded horizontally by (48px). It spans at least the small viewport height. A flexible introduction and a practice column (390px) form the main grid, separated by (70px). The header and footer stretch across this shared field; the footer uses a single hairline divider.

Between widths (761px–1000px), shell padding becomes (35px), the practice column becomes (350px), and the grid gap becomes (32px). On screens at least (800px) wide and (900px) tall, the circle grows to (360px) and the composition gains vertical breathing room.

At widths up to (760px), the shell is a single practice column capped at (480px) with side padding (24px) and safe-area insets. The desktop introduction yields to the short mobile title. The practice column caps at (370px); the circle fits available width up to (320px). The receipt, large record action, helper, and quiet actions follow directly underneath. The header and saved-device footer remain within the same shell.

At widths up to (380px), side padding becomes (20px) and the circle caps at (286px). At widths up to (340px), the history tool becomes an icon-only button with its accessible label retained. On mobile viewports no taller than (740px), the circle caps at (268px), vertical gaps tighten, and the primary action remains generous (72px minimum height). The base body allows widths down to (280px).

The rhythm is deliberately irregular where the task needs it: compact tool gaps, readable receipt separation, and a generous count. Reuse observed spacing roles rather than forcing every gap into a new global grid. Interactive controls keep a minimum target of (44px); main record targets range from (72px) on short screens to (82px) on desktop.

## Elevation & Depth

The practice field has no card shadows. Depth comes from the full green plane, thin tonal dividers, and the contrast of the brass action. Jasmine sheets supply the only substantial elevation, above a dark translucent backdrop. Their softness is ambient, without hard offset edges.

### Shadow Vocabulary

- **Sheet ambient:** a broad downward shadow on desktop. Its exact value is recorded in the sidecar as `sheet-desktop`.
- **Sheet rise:** an upward, softer shadow for the mobile bottom sheet, recorded as `sheet-mobile`.
- **Modal backdrop:** a dark green translucent veil behind native modal dialogs; its exact CSS is carried by the sidecar sheet preview.

**The Quiet Field Rule.** Keep the main practice surface flat. Reserve ambient elevation for sheets that interrupt it.

## Shapes

Circular forms carry progress and small confirmations: beads, the inner orbit, the receipt icon, and the primary press symbol. The SVG uses a square coordinate field (360 by 360), a bead-center radius (160), and an inner orbit radius (139). The sequence contains exactly (108) marks. Every ninth mark is slightly larger; a small brass diamond orients the top.

The large action uses the `action` radius. Sheets use the `sheet` radius; mobile sheets keep their rounded top corners and meet the bottom edge squarely. Mobile confirmation dialogs remain centered with the `confirmation` radius. Compact affirmative/cancel buttons use `compact-action`. Preference tracks use `switch-track`, with circular thumbs.

Dividers are thin tonal lines (1px). The quiet practice field is open rather than boxed into nested containers. SVG tool icons use consistent round caps and joins, predominantly a stroke width of (1.6), with a standard icon size (20px).

## Components

### Record action

A broad, steady brass control with a circular press symbol, two lines of clear copy, and a small check at the trailing edge. The desktop padding is held in `record-ready`; mobile reduces it to (17px 18px). Its internal fill moves from left to right during the deliberate press. Ready hover uses `record-hover`, while keyboard focus uses a jasmine outline.

The default press lasts (850ms); releasing early or moving away cancels it. Successful recording updates one bead and the persistent receipt, then applies the `record-guard` surface for the duplicate guard (12 seconds). Paused and unreadable-data states use the `record-paused` treatment, while completion uses `record-complete`. These states always explain themselves in text. A preference allows a single tap while retaining the duplicate guard. Standard keyboard and assistive activation stay available.

### Quiet buttons and practice tools

Secondary actions sit directly on green without filled containers. Sage text and line icons brighten to jasmine on hover. Buttons preserve visible brass focus with a generous offset (5px); unavailable actions reduce opacity. The header groups history and settings, while pause and protected undo sit below the main action. Icon-only tools retain accessible names.

### Confirmation actions

Compact, rounded affirmative buttons use green on jasmine. The keep/cancel action uses `subtle` with pond ink. Both use semibold text (12px), padding (12px 18px), and minimum height (44px). Within light sheets, focus is a pond-ink outline with a closer offset (3px). Undo and restart pass through a centered confirmation dialog, with initial focus on keeping the current state.

### Persistent saved receipt

A flat row directly beneath the circle, introduced by a top divider. A circular outlined icon precedes the saved-round title and exact timestamp; relative age aligns at the trailing edge. A saved receipt changes the icon outline to brass. Its brief arriving wash settles back to the green field; the title, time, and age remain after the animation ends. Empty, saved, and failed-saving states use explicit copy.

### 108-bead progress

A real SVG sequence rather than an illustration. Completed beads use brass, the current pending bead uses jasmine, and later pending beads use muted green. Every ninth bead is more prominent. The central text gives the completed total, the fixed goal, and the active round or pause/completion instruction. The SVG is hidden from assistive technology because the equivalent count and state are textual.

### Native sheets

History, preferences, installation help, and confirmations use native modal dialogs. Desktop sheets are centered, with widths capped at (460px), padding (30px), and maximum height capped by the viewport (80svh) or (760px). Mobile sheets become bottom-aligned, full-width surfaces capped at (480px), with maximum height (85svh), comfortable side padding (23px), and safe-area-aware bottom padding. Confirmation dialogs remain centered and narrower.

The close control is a standard icon button. Escape, outside clicking, and explicit closing are supported; focus returns to the invoking control. Overflow scrolls inside the sheet and does not propagate beyond it.

### Preference switches

Each preference pairs a clear title and explanation with a standard button carrying switch semantics. The interactive target is (44px square), surrounding a pill track (24px high) and a circular thumb (18px). Off uses `switch-off`; on uses green and moves the thumb horizontally (20px). Checked state is exposed through `aria-checked`; unavailable wake-lock support also supplies explanatory text.

### History rows

A simple divider-separated list inside jasmine, with a small brass-toned dot, a semibold round label, and a right-aligned timestamp/date column. Tabular numerals keep times aligned. Most recent rounds appear first. Empty history stays spacious and typographic; download is a plain text action beneath the real list. There are no text-entry fields, chips, or card-grid patterns in this implementation.

### Feedback and motion

Color transitions are brief (160–250ms). The completed bead settles once (650ms); the receipt wash settles once (700ms). A sheet enters with a small upward displacement (14px) over (250ms), using the shared expressive easing. The sidecar carries exact timings, easing, and shadows beyond the frontmatter schema.

Under reduced-motion preferences, CSS animations and transitions stop. The functional hold fill still expresses deliberate input, and saved evidence stays textual and persistent. Optional device vibration is supplementary; it is never the only confirmation. No sound is used.

## Do's and Don'ts

### Do:

- **Do** preserve the open green practice field and the restrained brass, jasmine, and sage roles.
- **Do** use the serif for expressive text and the count, with DM Sans for actions and timestamps.
- **Do** show a lasting saved receipt, including exact time and relative age, after a successful record.
- **Do** keep controls at least 44px in their interactive dimension and respect iPhone safe areas.
- **Do** preserve keyboard access, visible focus, native dialog behavior, the tap alternative, and reduced-motion support.
- **Do** make every bead correspond to a real completed or pending round.

### Don't:

- **Don't** place the primary practice content inside nested decorative cards.
- **Don't** replace the timestamped receipt with transient animation or haptic feedback alone.
- **Don't** use decorative geometry in place of the functional 108-mark progress sequence.
- **Don't** add sound, looping ambient animation, or celebratory motion to this quiet practice world.
- **Don't** present the app as detecting physical movement or completing rounds automatically.
