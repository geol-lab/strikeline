# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and vanilla JavaScript (ES modules), no build step and no backend. The user first asked for C++ and agreed to drop it, provided quality doesn't suffer; the geometry lives in a separate `js/geo/` module. Hosting is undecided, so the site must run from any static host (GitHub Pages is the likely candidate).

## Users

Undergraduate geology students, mainly at Nazarbayev University (NU), doing structural-geology lab reports. They have a topographic or geological map with contour lines, often a PDF or a phone photo of the lab sheet, and they need to construct structure contours (strike lines), read strike and dip, and draw a cross-section along a given line X–Y. Most work happens on a laptop. They check answers on a phone. Secondary audience: the NU geology department and teaching staff, who may point students to the site.

## Product Purpose

To take the slow, error-prone ruler-and-protractor work out of map lab reports while keeping the student in charge of the geology. The tool measures and calculates. The student decides which lines to draw and what they mean. Success means a student can go from a scanned map to a correct, report-ready cross-section, with strike/dip values, a legend and a stratigraphic table, and understand each step.

## Positioning

Made by NU students for NU students and the department, built around the exact lab workflow: mark the intersection points of a contact with contour lines, fit a straight structure contour, read strike/dip, project onto the section line X–Y at map scale. It is not a general GIS.

## Operating Context

- Input: a map image (scan, PDF screenshot, phone photo) with topographic contours, contacts between beds, a scale bar and a section line X–Y.
- The workflow follows the lab sheet: set the scale from the scale bar, then mark contact × contour intersections with the marker tool, connect equal-elevation points into straight structure contours (one colour per bed), read each line's position along X–Y (e.g. "500" = 500 m from X), strike/dip per bed (e.g. 358/12 E, 178/58 W), the cross-section beneath the map at the same horizontal scale, anticline/syncline identification, and a stratigraphic table and legend.
- A separate stereonet tab: enter strike/dip, find the intersection line of two beds, and toggle it on the map.
- Data stays on the student's device.

## Capabilities and Constraints

- Scale calibration from two clicks on the scale bar, with the second point snapping horizontal.
- Marker points per bed and elevation, a least-squares straight structure contour, and a length and position along X–Y on every line.
- Strike/dip per bed from structure-contour spacing, plotted as a map symbol.
- Cross-section built automatically from the A/B points, with horizontal scale = map scale and vertical range from the data.
- A unique, consistent colour per bed across the map, section, legend and table.
- Editable stratigraphic table and legend templates.
- Stereonet (equal-area, lower hemisphere): planes, poles, and the intersection lineation of two planes.
- The interface is in English with a built-in EN ↔ RU toggle (own dictionary, no third-party translator).
- The reference demo is `SectionKit: cross-section editor` v0.2 (single-file canvas prototype). The new product supersedes it.
- Open: hosting target.

## Brand Commitments

- Name: **Strikeline** (proposed by Claude, the user delegated the choice).
- Voice: precise, plain, instructive; geology terms used correctly (strike, dip, structure contour, section line X–Y, antiform/synform).
- The user asked for modern minimalism, a strict corporate feel, and an interface that is easy to figure out.

## Evidence on Hand

- `SectionKit_ cross-section editor (1).html` (user-supplied demo).
- A photo of the Lab 4 answer key: structure contours coloured per bed, positions on X–Y, strike/dip labels 358/12 E and 178/58 W, anticline/syncline markers.
- No testimonials, usage numbers, partner logos or endorsements exist. Do not invent them, and do not claim official department endorsement.

## Product Principles

1. The student does the geology and the tool does the arithmetic.
2. Every number traces back to a mark the student made.
3. Follow the lab sheet's order and vocabulary.
4. Straight, exact, reproducible: fitted lines, calibrated scale, true-scale sections.
5. The student's work stays on the student's device.

## Accessibility & Inclusion

- English and Russian readers.
- Keyboard-operable tools.
- Bed colours must be distinguishable beyond hue alone (labels and line styles), since colour-blind students will use it.
