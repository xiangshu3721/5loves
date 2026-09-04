---
name: 爱的5种语言
description: Blush-paper poster of Chapman’s five languages, made tappable on a phone.
colors:
  blush: "#f7d5dc"
  blush-deep: "#eeb8c4"
  paper: "#fff7f8"
  coral: "#e07a8a"
  coral-ink: "#c45c6e"
  rose: "#b54a5c"
  ink: "#4a2c33"
  muted: "#7a535c"
  disc-l: "#f3c1cb"
  disc-o: "#e8a3b0"
  disc-v: "#f0b4a8"
  disc-e: "#e9c3d4"
  disc-y: "#f4d0c2"
  you: "#efc4ce"
typography:
  display:
    fontFamily: "Ma Shan Zheng, Noto Sans SC, serif"
    fontSize: "clamp(2.6rem, 12vw, 3.6rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "Ma Shan Zheng, Noto Sans SC, serif"
    fontSize: "clamp(2.2rem, 10vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "normal"
  title:
    fontFamily: "Noto Sans SC, PingFang SC, Hiragino Sans GB, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Noto Sans SC, PingFang SC, Hiragino Sans GB, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Noto Sans SC, PingFang SC, Hiragino Sans GB, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  card: "28px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  page: "20px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "14px 20px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.rose}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "14px 20px"
  button-choice:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: "24px 20px"
  button-back:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "40px"
  progress-fill:
    backgroundColor: "{colors.coral-ink}"
    rounded: "{rounded.full}"
    height: "8px"
  score-fill:
    backgroundColor: "{colors.coral-ink}"
    rounded: "{rounded.full}"
    height: "12px"
---

# Design System: 爱的5种语言

## Overview

**Creative North Star: "The Tappable Poster"**

This is the source 爱的5种语言 infographic brought onto a phone, not a test app dressed in pink. The field is blush paper. The only picture is the coral watercolor LOVE YOU disc cluster. Type is a handwritten display against a quiet Chinese gothic. Controls are capsules and 28px statement pills with a rose-tinted lift — the poster’s roundels made into things a thumb can press.

Density is spare: one column, one decision, large type, long vertical breath. There is no clinical white page, no exam chrome, no dashboard grid. Light is the default scene; the same token names remap under `prefers-color-scheme: dark`, but new surfaces are designed for blush paper first.

**Key Characteristics:**
- Full-bleed blush field on every screen; paper is a wash laid on blush, never a separate white canvas
- Ma Shan Zheng only for the product name and the winning language
- Two radii: capsules for actions and meters, 28px pills for statement cards
- One shadow: a large, soft, rose-tinted lift
- Signature art is the LOVE YOU watercolor cluster; statement cards share the wash-card paper tooth

## Colors

A single warm rose family. Nothing leaves the blush–coral–rosewood range.

### Primary
- **Dried Rose**: Solid fill of primary actions (开始测试, 复制结果链接). Also the focus ring. Rarity is not the point — it is the only opaque action color.
- **Coral Ink**: Fill of progress and score meters. Slightly cooler and deeper than the button, so a bar never looks like a button.

### Secondary
- **Watercolor Coral**: Selection highlight (`::selection`) and the saturated heart of the wash. Not a button fill.

### Tertiary
- **Disc L / O / V / E / Y / You**: Watercolor roundels in the LOVE YOU cluster (肯定的言词, 精心的时刻, 接受礼物, 服务的行动, 身体的接触, plus the unlabeled YOU discs). These colors live in the raster cluster, not as UI chrome or per-language bar tints.

### Neutral
- **Blush Paper**: Page background. Every screen.
- **Pressed Blush**: Darker neighbor in the theme; reserved for a deeper wash, not currently painted on components.
- **Rose Paper**: Statement cards, meter tracks, secondary fills, back disc. Always translucent or laid on blush, never a full-page sheet.
- **Rosewood Ink**: Titles, statements, primary reading text.
- **Dusty Mauve**: Subtitles, counters, “或”, interpretation captions, English language names.

Light values above are canonical. Under `prefers-color-scheme: dark` the same names invert: blush becomes a rosewood night (`#2a181c`), ink becomes a pale rose (`#f6e6e9`), rose lightens so buttons still read as the action, and the rose shadow becomes a heavier black (`0 18px 40px rgb(0 0 0 / 0.35)`).

**The Blush Field Rule.** The page is blush. Paper appears only as cards, tracks, and discs floating on that field. A white or gray app shell is out of world.

**The Meter Is Not the Button Rule.** Meters fill with coral ink. Buttons fill with dried rose. Do not swap them.

## Typography

**Display Font:** Ma Shan Zheng (fallback Noto Sans SC, serif)
**Body Font:** Noto Sans SC (fallback PingFang SC, Hiragino Sans GB, sans-serif)

**Character:** The display is a brush title, as on the printed poster. The body is a round gothic that can carry long Chinese statements without competing with the brush. Weight 400 is the voice; 500 is emphasis on actions and labels. Weight 700 is not part of the system.

### Hierarchy
- **Display** (400, `clamp(2.6rem, 12vw, 3.6rem)`, 1.15): Intro product name 爱的5种语言.
- **Headline** (400, `clamp(2.2rem, 10vw, 3rem)`, 1.15): Result primary language(s). Same brush, slightly smaller so five score rows still fit.
- **Title** (500, 1.125rem, 1.5): Interpretation headings (Chinese name). English name sits beside it as a muted label, not a second headline.
- **Body** (400, 0.95rem–1.05rem, relaxed ~1.625): Subtitle, instructions, statements, meaning, how-to. Intro subtitle caps at ~28ch. Statements sit at 1.05rem so a thumb-sized card remains readable.
- **Label** (500, 0.875rem, tabular-nums where counting): `1/30`, score values, quiz prompt, “或”.

**The Hand Title Rule.** Ma Shan Zheng is only for the product name and the winning language. Buttons, statements, meters, and interpretation stay in Noto Sans SC.

**The Sentence Case Rule.** Chinese UI is sentence-like, never all-caps Latin chrome. English language names are title case and muted, never display-sized.

## Layout

A single phone column: `max-width: 28rem` (`max-w-md`), centered, full `100dvh`. Horizontal inset is 20px (`px-5`), with `env(safe-area-inset-*)` on top and bottom. Desktop does not grow a second column; it is the same slip on a wider blush field.

Rhythm: 8 / 12 / 16 / 20 / 24 / 32. Stacked CTAs sit in a 12px gap; choice cards in a 16px gap with “或” between; score rows and interpretation blocks open to 32px. Primary actions live at thumb reach — `mt-auto` on intro, sticky blush bar on result (`bg-blush/95`, light blur).

Quiz is one pair per screen. No multi-item list, no side-by-side statements on a wide breakpoint.

**The One Column Rule.** New surfaces inherit the 28rem column and 20px page gutter. Do not add a desktop sidebar or a two-up choice grid.

## Elevation & Depth

Depth is a hybrid of tonal paper-on-blush and one rose-tinted shadow. There is no black drop shadow in light, no hard offset, no hairline divider.

### Shadow Vocabulary
- **Rose lift** (`box-shadow: 0 18px 40px rgb(180 74 92 / 0.16)`): Primary buttons and statement cards at rest. Dark scene remaps to `0 18px 40px rgb(0 0 0 / 0.35)`.
- **Frosted blush bar**: Sticky result actions use `background: blush at 95%` plus `backdrop-filter: blur(4px)` so the list can scroll underneath. Not a second shadow.

Motion is a short rise-and-fade on screen enter (`cubic-bezier(0.16, 1, 0.3, 1)`, 0.22s–0.5s). Pressed controls scale to ~0.98. Honor `prefers-reduced-motion`.

**The One Shadow Rule.** If it lifts, it uses the rose shadow. Do not add a second shadow recipe, a y-offset slab, or a gray ambient.

## Shapes

Two silhouettes, both from the poster’s roundels.

- **Capsule** (`border-radius: 9999px`): Primary and secondary buttons, back disc, progress track, score track. Full-width pills, not compact chips.
- **Statement pill** (`border-radius: 28px`): Forced-choice cards. Large enough to feel like a watercolor tile, not a rounded rectangle.
- **Share slip** (`border-radius: 20px`): One-off for a pasted URL; do not promote it to a third radius scale.

No squares, no 4–8px app-chip radii, no circular language avatars in CSS — the discs exist only in the cluster raster.

**The Two Radii Rule.** Actions and meters are capsules. Statements are 28px pills. Do not invent a third everyday radius.

## Components

### Buttons
- **Shape:** Full-width capsules. Vertical padding 14px (`py-3.5`), label at 1rem / 500.
- **Primary:** Dried rose fill, rose-paper text, rose lift. Pressed: `scale(0.98)`. No hover recolor.
- **Secondary:** Rose-paper fill at ~70%, dried-rose text, `1px` border at rose 30%. Same padding and press. Used for 继续上次 and 再测一次.
- **Focus:** 2px dried-rose outline, 3px offset, on every control.

### Choice cards
- **Style:** 28px pill, min-height 128px, rose-paper fill, `wash-card.png` covering the face (`background-size: cover`), 20×24px padding, left-aligned 1.05rem ink, rose lift.
- **Pairing:** Two cards stacked with a centered muted “或”. One tap per card; no radio dots, no checkmarks.
- **State:** Pressed `scale(0.985)`. No selected-fill variant — choosing advances the quiz.

### Back disc
- **Style:** 40px paper circle, ink caret, no border, no shadow. Pressed `scale(0.96)`.

### Meters
- **Progress (quiz):** 8px capsule track of paper at 80%; fill coral ink, width eases 300ms.
- **Score (result):** 12px capsule, same colors. Label left (medium ink), tabular value right (muted). All five languages always shown, ranked.

### Cards / Containers
- **Page:** Blush field. No enclosing card.
- **Sticky action bar:** Blush at 95% with light blur; 12px gap between buttons; safe-area padding.
- **URL slip:** 20px paper tile, 12px type, muted ink, only after copy fallback.

### Love cluster
The only illustration. Raster `cluster-love-you.png`, contained, `max-height: 42dvh`, `max-width: 24rem`. Do not rebuild the discs as CSS circles or swap in another hero.

### Navigation
No persistent nav. Quiz chrome is back disc + progress + `n/30`. Result has no top bar.

## Do's and Don'ts

### Do:
- **Do** keep every screen on blush paper, with paper used only for pills, tracks, and discs.
- **Do** set product name and winning language in Ma Shan Zheng; everything else in Noto Sans SC 400/500.
- **Do** use 28px pills for statements and capsules for actions and meters, with the rose lift on primary buttons and choice cards.
- **Do** show both statements as two large wash cards separated by “或”, one pair per screen.
- **Do** show all five scores as coral-ink capsule bars, not a single winner badge.

### Don't:
- **Don't** introduce a white, gray, or cool clinical page behind the column.
- **Don't** put Ma Shan Zheng on buttons, statements, or score labels.
- **Don't** tint each score bar a different disc color — meters stay coral ink.
- **Don't** lay out choices as a radio list, Likert row, or two-up desktop grid.
- **Don't** add a second shadow, a hard offset, or a hairline rule to separate sections.
