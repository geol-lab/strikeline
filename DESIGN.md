---
name: Strikeline
description: Structure contours, strike and dip, and true-scale sections from a student's own geology lab map, drawn as a survey map sheet.
colors:
  ink: "#14181d"
  ink-2: "#434d56"
  ink-3: "#5f6971"
  paper: "#f3f5f4"
  paper-raised: "#fbfcfb"
  paper-sunk: "#e7ebe9"
  rule: "#c3cbc8"
  rule-strong: "#8f9996"
  accent: "#2847a8"
  accent-ink: "#ffffff"
  contour: "#a0653a"
  contour-label: "#7d4a24"
  section-line: "#14181d"
  bed-1: "#3e7f70"
  bed-1-fill: "#c3ddd5"
  bed-2: "#b5432e"
  bed-2-fill: "#f3cdc1"
  bed-3: "#7b3f93"
  bed-3-fill: "#ddcbe6"
  bed-4: "#13809b"
  bed-4-fill: "#c4e6ef"
typography:
  display:
    fontFamily: "Golos Text, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.375rem, 1.4rem + 3.6vw, 4.25rem)"
    fontWeight: 680
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Golos Text, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.1rem + 1.4vw, 2.125rem)"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Golos Text, Segoe UI, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  lead:
    fontFamily: "Golos Text, Segoe UI, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "Golos Text, Segoe UI, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "Golos Text, Segoe UI, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Golos Text, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.09em"
  measure:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.92em"
    fontWeight: 400
    letterSpacing: "0em"
    fontFeature: "tnum"
rounded:
  none: "0px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "72px"
  s-9: "112px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#2a3139"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-sunk}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "0 12px"
  button-small:
    typography: "{typography.body-sm}"
    padding: "0 16px"
    height: "36px"
  segment:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "34px"
  segment-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  input:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.measure}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  field-label:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
  map-face:
    backgroundColor: "{colors.paper-raised}"
    rounded: "{rounded.none}"
  key-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    width: "22px"
    height: "20px"
  formula-tag:
    backgroundColor: "{colors.paper-sunk}"
    textColor: "{colors.ink}"
    typography: "{typography.measure}"
    padding: "2px 8px"
  sheet-note:
    textColor: "{colors.ink-2}"
    typography: "{typography.body-sm}"
  sheet-note-error:
    textColor: "{colors.bed-2}"
  title-block-cell:
    typography: "{typography.body-sm}"
    padding: "24px"
---

# Design System: Strikeline

## Overview

**Creative North Star: "The Survey Map Sheet"**

Every Strikeline surface is a sheet from a geological survey: cool paper, blue-black ink, a graduated neatline around the whole page, and a margin with a key, an index and a title block. The interface is the map and its marginalia. It is not a SaaS page with a map placed on it. Colour comes from geology (ICS bed colours, brown contours), and the hairline drawing does the rest. The density is that of a printed sheet: generous sheet margins, tight 1px rules inside, and every number set in mono next to the mark it came from.

The system is strict and quiet. It meets the brand commitment to modern minimalism, a strict corporate feel and an easy-to-learn interface by holding to drafting conventions, not by adding ornament. Planes are flat, corners are square, and state is shown with ink fill. Constructions are previewed as dashes and then ruled in solid. Content is grouped as keyed rows under a rule, never as floating cards.

The workspace (app.html) inherits the sheet as its frame. Fixed regions (map, section, stereonet, tables) stay in place and their contents change. Status prints as a sheet note in the margin, not as a toast.

**Key Characteristics:**
- Graduated neatline frame (ink/paper bar between two 1px ink neatlines) around every page.
- Cool paper and blue-black ink; ICS bed colours and brown contours are the only saturated colours, plus one instrument blue for focus and calibration.
- Golos Text set like map lettering; JetBrains Mono for measurements only.
- Square corners, 1px rules, no shadows.
- Keyed notes and key tables in place of cards.
- Every bed reads three ways: stroke colour, pale fill and lithology pattern.

## Colors

A cool, nearly achromatic paper-and-ink base. Saturated colour is reserved for what the geology itself colours.

### Primary
- **Blue-Black Survey Ink** (ink): all text, linework, neatlines, section boundaries, primary buttons and the pressed state of every segmented control. The X–Y section line (section-line) uses the same ink, dashed.

### Secondary
- **Instrument Blue** (accent): the tool's own marks. Used for the focus ring, the text caret, and live calibration and construction marks (scale-bar ticks and readouts). Not used for links (they inherit ink with a rule-strong underline) and not for selected states (those use ink).

### Tertiary
- **ICS Bed Colours** (bed-1 to bed-4, oldest to youngest: Carboniferous green-teal, Permian red-brown, Triassic violet, Jurassic blue): contacts, structure contours, section bodies, stereonet planes and key swatches. Each pairs with a pale fill (bed-N-fill) for areas: section bodies, legend boxes, stratigraphic column cells.
- **Topographic Brown** (contour): contour linework only. **Contour Lettering Brown** (contour-label) for contour elevations, because the line colour is too light for text.

### Neutral
- **Survey Paper** (paper): the sheet background.
- **Map-Face Paper** (paper-raised): drawing surfaces (map face, stereonet disc), inputs, and the halo stroke behind lettering on drawings.
- **Sheet Margin Grey** (paper-sunk): hover fills and formula tags.
- **Secondary Ink** (ink-2, 7.9:1 on paper): leads, descriptions, field labels, axis numbers.
- **Tertiary Ink** (ink-3, 5.1:1 on paper): metadata lines and schematic placeholder strokes.
- **Hairline** (rule): 1px dividers between rows and grid lines on drawings.
- **Strong Hairline** (rule-strong): input borders, link underlines, scrollbar thumb.

### Named Rules
**The Geology Colours Rule.** Saturated hues mean a bed, a contour or the instrument. A bed colour always marks that bed, everywhere (map, section, net, legend, table). It is never used as decoration, a status colour or a brand accent. The one exception is the error note, which uses bed-2 red-brown.

**The Ink Fill Rule.** Selected, pressed and primary all mean ink fill with paper lettering. No tinted selection states and no accent-filled buttons.

**The Three-Way Bed Rule.** Every bed reads three ways: stroke colour, pale fill and lithology pattern (pat-1 brick, pat-2 dash, pat-3 stipple, pat-4 pebble, ink at about 40% opacity). Hue is never the only cue. Colour-blind students use this tool.

## Typography

**Display Font:** Golos Text (with Segoe UI, system-ui)
**Body Font:** Golos Text
**Label/Mono Font:** JetBrains Mono, for measurements only

**Character:** A plain grotesk set like map lettering. Titles are large, heavy and tightly tracked. Labels are small tracked capitals. Values are tabular mono, so they line up like a field book.

### Hierarchy
- **Display** (680, clamp 2.375–4.25rem; 2.75–4rem at ≥1100px, 1.02, -0.035em): the one page title, max about 13ch.
- **Headline** (650, clamp 1.5–2.125rem, 1.08, -0.025em): section titles, max about 22ch.
- **Title** (650, 1.25rem, 1.08, -0.015em): row and note headings in key tables.
- **Lead** (400, 1.25rem, 1.45, ink-2): the one sentence under a title, max 44–62ch.
- **Body** (400, 1.0625rem, 1.55): running text, 58–62ch.
- **Body small** (400, 0.875rem, 1.5): notes, key entries, title-block cells, button-small and segment text.
- **Label** (600, 0.75rem, 0.09em, uppercase, ink-2): map lettering for the key title, title-block field names and the example metadata line. Field labels above inputs use the same role.
- **Measure** (JetBrains Mono, 0.92em, tabular numerals): every number with a unit, coordinates, bearings, formulas, key letters and input values.

### Named Rules
**The Measurement Rule.** Mono is for values only: lengths, bearings, elevations, trend/plunge, formulas, field inputs. Prose, buttons, headings and labels are never set in mono.

**The Lettering Rule.** Lettering on drawings is Golos/Mono at 13–15px, 600–700 weight, with a 3px paper-raised halo (`paint-order: stroke`) so it stays readable over linework.

## Layout

The page is a single framed sheet. The frame sits at a sheet margin from the viewport (10px, then 18px at ≥720px, then 24px at ≥1100px). The graduated bar is 3px, then 6px from 720px, in 48px ink/paper segments. Inside it, a gutter (16 / 32 / 48px) sets the content padding. Corner graticule labels (mono) sit in the top margin from 720px.

Stacking order inside the sheet: title strip (masthead), then map face, then blocks, then the title block. Each region is closed by a 1px ink rule; there are no gaps between bands. Blocks use s-8 (72px) vertical padding. Block heads put the headline and lead side by side from 900px. The hero becomes copy+key | map (0.9fr | 1.5fr) from 1100px. Spacing follows a 4px-base scale (s-1 to s-9). Rows inside a key use s-4/s-5 padding.

For the workspace: keep the sheet frame and masthead. Lay the four tabs out as fixed regions that switch their contents (Map with Cross-section beneath it at the same horizontal scale, Stereonet, Tables & legends). The regions follow the A–D plan drawn on the landing page and are divided by 1px ink rules. Do not use floating panels.

Breakpoints observed: 380, 520, 600, 720, 900, 960 (nav collapses below), 1100.

## Elevation & Depth

Flat. No shadows anywhere. Depth comes only from paper tone (paper-raised for drawing faces and inputs, paper for the sheet, paper-sunk for hover) and from the weight of rules: 1px ink for frames and region boundaries, 1px hairline between rows. Lettering halos are a cartographic knockout, not elevation.

### Named Rules
**The Flat Sheet Rule.** Nothing lifts off the paper. A region is separated by a rule or a tone, never by a shadow, blur or overlay glow.

## Shapes

Square corners everywhere (0px): buttons, inputs, selects, segmented controls, map faces, key tags and legend boxes. Borders are 1px. Ink marks a frame or control and rule-strong marks a field. The only curves are cartographic: point markers (r 3.4, paper-raised fill, ink stroke), stereonet circles and contour lines. Selects use a drawn chevron made of two gradient triangles, not the platform chevron.

Line grammar on drawings: solid means committed. Dashed means a preview or the section line: preview dash 3 4 at 0.55 opacity, then the line is ruled in solid; section line X–Y in ink, dash 7 4, with bold X and Y end letters. The strike-and-dip symbol is an ink strike line with a short dip tick and a mono value, for example 358/12 E.

### Named Rules
**The Neatline Rule.** The graduated ink/paper bar frames the sheet only. It is a map-sheet border, not a divider, progress bar or decorative stripe inside content.

**The Dashed Preview Rule.** A line is shown dashed before it commits and solid after. Dashes never decorate.

## Components

### Buttons
Drafting controls: an ink outline, square and plain.
- **Shape:** square (0px), 1px ink border, 44px tall (36px small), 24px side padding (16px small), Golos 560.
- **Primary:** ink fill, paper text. One per region. "Load your map" is a file input dressed as the button, and the label is the control.
- **Hover / Focus:** paper-sunk fill (primary goes to a lighter ink); 2px accent outline at 3px offset; press scales to 0.97 over 120ms.
- **Secondary:** transparent with an ink outline. **Quiet:** no border, 12px padding, paper-sunk on hover. Disabled: 45% opacity.

### Segmented control
The house selector for language, construction steps and, in the workspace, tool modes.
- **Style:** one 1px ink frame with 1px ink dividers, 34px tall, 0.875rem 560.
- **State:** `aria-pressed="true"` or `aria-current="step"` means ink fill with paper text. Hover on unpressed segments is paper-sunk. Step segments may lead with a mono step number.

### Inputs / Fields
- **Style:** paper-raised fill, 1px rule-strong border, square, 44px, mono with tabular numerals at 1rem (no iOS zoom). The label is a tracked-caps field label (ink-2) stacked above with a 4px gap.
- **Focus:** the border turns accent, with a 2px accent outline at 0 offset.
- **Error:** `aria-invalid` gives a bed-2 border; the message prints as an error sheet note.
- **Grouping:** related fields sit in a fieldset with an ink top rule and a legend led by a bed swatch (a 22px line in the bed colour).

### Navigation
Masthead title strip: the wordmark (a strike-and-dip mark plus "Strikeline", 700), nav links at 0.875rem 520 in ink-2 (hover: ink on paper-sunk), the EN/RU segmented control and a small primary button. Below 960px the links fold into a panel under the strip, one per row with hairline separators and a grid-rows reveal.

### Keyed notes / key table
These replace cards. A list under a 1px ink top rule, one row per item, separated by hairlines.
- **Key table:** a symbol column (56–72px drawn SVG) | title | description | formula tag on the right.
- **Keyed notes:** a key tag (22×20 ink block, paper mono letter A–D) | title + body-sm description, cross-referenced to the same letters on a drawing.
- **Numbered notes:** a mono "1." counter in ink-2 hanging in a 2.25rem indent, with a hairline top rule. Grid of columns at 340px minimum.

### Map key
Tracked-caps "Key" title under an ink rule. Entries pair a 36×20 swatch with a body-sm name. Bed swatches are fill + pattern + stroke rectangles. Line swatches draw the real line style (contour, structure contour with markers, dashed section, strike/dip).

### Map face and drawings
A paper-raised panel inside a 1px ink border. Lettering follows the Lettering Rule. Each computed value sits at its mark or connects to it by a 1px ink leader with an elbow. Construction is revealed in steps with the dashed preview and then the ruled line. Dimension lines are ink with oblique ticks.

### Sheet note
Status and help text print as a margin note (body-sm, ink-2, `role="status"` or `aria-live`) directly under the control they describe. Errors switch the note to bed-2. Notes are never toasts or floating banners.

### Readout
A definition list under a hairline: the term (ink-2, led by a bed line swatch) | the value in mono. It stacks below 600px.

### Title block
The footer as a sheet title block: cells divided by 1px ink verticals from 720px, each with a tracked-caps field name over a body-sm value. The edition is set in mono.

## Do's and Don'ts

### Do:
- **Do** frame every page with the graduated neatline (3px/6px bar, 48px segments, 1px ink neatlines both sides).
- **Do** mark selection and pressed state with ink fill and paper lettering.
- **Do** carry each bed as colour + fill + lithology pattern, and keep one colour per bed across map, section, net, legend and table.
- **Do** set every measurement in JetBrains Mono with tabular numerals, next to or leadered to its mark.
- **Do** group content as keyed rows under a 1px ink rule with hairline separators.
- **Do** show a construction dashed before it commits, and solid after.
- **Do** print status as a sheet note under its control, bed-2 for errors.
- **Do** use contour-label (not contour) for contour elevations.

### Don't:
- **Don't** add border radius, box shadows, blur or glows to any control or region.
- **Don't** use bed colours or contour brown for decoration, branding or generic status.
- **Don't** set prose, headings, buttons or labels in mono.
- **Don't** box content into cards; use key tables and keyed notes.
- **Don't** use the graduated bar anywhere but the sheet frame.
- **Don't** fill selected states with the accent blue; accent is for focus, caret and calibration marks.
