# India 2027 — Ananthavix Easy Public Analytics (Stable Build)

This is the stable GitHub Pages + Vercel build.

## Why this version does not go blank

- The supplied `data.js` is local.
- Plotly is bundled locally at `vendor/plotly.min.js`.
- KPI cards and charts render immediately.
- The India population-density map loads independently after the dashboard is ready.
- If the external India map service is unavailable, the map panel automatically shows a local state-density ranking instead of breaking the page.
- SheetJS is loaded only when **Connect Excel** is clicked, so it cannot block startup.

## Upload

Delete the old dashboard files from the repository and upload the complete contents of this ZIP to the repository root. Do not upload only `index.html` or `app.js`.

Required root files/folders:

- `index.html`
- `style.css`
- `app.js`
- `data.js`
- `vendor/`
- `assets/`
- `vercel.json`
- `.nojekyll`

## Branding

Presented by **Ananthavix Solutions** — Data. Insight. Solutions. Growth.

## Data note

The workbook describes the 2027 figures as modelled estimates. They are not official final Census 2027 results.
