# India 2027 — Ananthavix Easy Public Analytics (Self-Contained Build)

This version cannot go blank due to a missing/failed script load, because there
are no separate scripts to load.

## What changed from the previous build

Previously the page needed 3 external scripts to succeed one after another:
`data.js` (1.4MB of data), `vendor/plotly.min.js` (4.8MB chart library), and
`app.js` (the app logic) — each loaded with a separate `<script src="...">`
tag. If any single one of those failed to deploy correctly, 404'd, or was
blocked, the whole dashboard stayed blank.

This build embeds all three directly inside `index.html` as inline
`<script>` blocks. There is nothing left to fetch after the page itself
loads — no `data.js`, no `app.js`, no `vendor/` folder, no chance of one
file deploying while another doesn't.

The India population-density map (amCharts5, loaded from a CDN) still loads
independently after the dashboard is ready, and automatically falls back to
a local density-ranking chart if that CDN is ever unreachable — this part
was already resilient and is unchanged.

## Required root files/folders

- `index.html` (contains everything — data, Plotly, and app logic inlined)
- `style.css`
- `assets/` (logo + downloadable source workbook)
- `vercel.json`
- `.nojekyll`

## Upload

Delete the old dashboard files from the repository first, then upload the
complete contents of this ZIP to the repository root. Do not upload only
some of the files.

## Branding

Presented by **Ananthavix Solutions** — Data. Insight. Solutions. Growth.

## Data note

The workbook describes the 2027 figures as modelled estimates. They are not
official final Census 2027 results.
