---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: landing (index.html)

Mode: Persuade. Audience: NU geology students with a map lab due; secondary: department staff. Action: open the workspace with their own map loaded. Proof: the mechanism shown working on a synthetic map (points → straight structure contour → strike/dip → section X–Y), with real computed values. Constraints: EN with RU toggle, no invented endorsements or numbers, maps stay on device. Build path: code-led (no image generation).

## Direction contract

THESIS: The page is a geological map sheet, not a SaaS landing page: it refuses the split hero with a screenshot and a row of feature cards. Every section is a part of the sheet: the map face, the key, the sheet index, the section plate, the title block.

OWN-WORLD: Cool white survey paper, blue-black ink, a hairline neatline with graduated coordinate ticks framing the page, brown topographic contours, a blue dashed section line X–Y, and bed colours from the ICS chronostratigraphic chart as the only saturated colour. Golos Text grotesk set like map lettering (tracked caps for labels, tight large weights for titles) and JetBrains Mono for measurements only. Square corners and 1px rules. Legend boxes instead of cards.

STORY: Students recognise their own lab sheet, see their tedious construction done straight and exactly, trust that they still make the geological decisions, and load their map.

FIRST VIEWPORT: The neatline frames the viewport. Top: a title-block strip with the wordmark, nav and EN/RU. Left third: the headline "Mark the points. Strikeline draws the line.", one line of subcopy, a primary "Load your map" control (file input → workspace) and a secondary "How it works". Right two-thirds: a live SVG map face where markers land on contact×contour intersections, structure contours fit straight, leader-line labels show elevation and X–Y position, a 358/12 E symbol appears, and a section strip grows under the map. A step scrubber (Scale, Mark, Fit, Dip, Section) sits under the map.

FORM: Geological survey map sheet, my top-ranked candidate (#1, Impeccable's pick, chosen over the assigned field level-book). seed:699dede443042095. Raises: every number connects to its mark with a leader line (from the tensegrity column); status lines print as sheet notes, not toasts (from the phosphor terminal); a dashed preview shows each line before it commits (from the algorave floor); the workspace keeps fixed regions and swaps their contents (from the PC-98 field).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
