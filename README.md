# Strikeline

Tools for structural-geology lab reports, made at NU by geology students: structure contours, strike and dip, cross-sections and stereonets, drawn from your own lab map.

## Running it

The site is plain HTML, CSS and JavaScript (ES modules), with no build step. Modules don't load from `file://`, so serve the folder:

```bash
npx serve .            # or: python3 -m http.server 8000
```

Then open the address it prints, for example http://localhost:3000, or http://localhost:8000 if you used Python. In VS Code, the Live Server extension also works.

## Structure

```
index.html            landing page
app.html              workspace: tabs A Map, B Cross-section, C Stereonet, D Tables & legends
css/
  tokens.css          colours, type, spacing, fonts
  base.css            reset, typography, browser surfaces
  components.css      buttons, segmented controls, inputs, FAQ
  site.css            landing page layout (map-sheet frame, sections)
js/
  site.js             landing page entry point
  i18n.js             EN ↔ RU dictionary and switcher
  app.js              workspace entry point
  core/state.js       project data, derived geometry, undo, autosave
  core/planes.js      planes for the stereonet (from beds + typed)
  core/project-file.js save/open project file, downloads
  core/storage.js     IndexedDB (maps stay on the device)
  geo/                pure geometry, no DOM
    vector.js         vectors, intersections, bearings
    fit.js            orthogonal least-squares straight line
    structure.js      strike/dip from structure contours, apparent dip
    stereonet.js      equal-area projection, poles, plane intersection
    contour.js        marching squares (demo map)
  ui/
    demo-model.js     synthetic lab map + full construction
    hero-demo.js      animated worked example on the landing page
    net-figure.js     interactive stereonet on the landing page
    map-view.js       map pan/zoom, tools, overlay, PNG export
    section-view.js   cross-section along X–Y
    net-view.js       stereonet tab
    tables-view.js    stratigraphic table, column, legend
    panel.js          beds and structure-contour table
    sample-map.js     synthetic practice map
tools/build_preview.py  builds dist/ for the shared preview
assets/fonts/         Golos Text, JetBrains Mono (SIL OFL, self-hosted)
```

## Translation

English text lives in the HTML. Elements carry `data-i18n="key"`, and the Russian text for each key is in `js/i18n.js` (`RU`). Strings built in JavaScript use `t('key', {vars})` from `STR`. To add text, give the element a key and add the Russian line.
