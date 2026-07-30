# Demo Script — Netflix Content Coordinator

This document contains quick steps and suggested screenshots for your final presentation.

Steps to run locally

```bash
cd /path/to/my_netflix_project
python3 -m http.server 8000
open http://127.0.0.1:8000/
```

Quick demo flow

1. Show the landing page (Loaded X items). Screenshot: `screenshot-1` (full page).
2. Click **Show PG-13 Titles** to filter ratings. Screenshot: `screenshot-2` (PG-13 filtered view).
3. Click **Movies Longer Than 90 Minutes** to show long movies. Screenshot: `screenshot-3` (long movies view).
4. Demonstrate filters: search by title, choose a genre, and apply filters.
5. Show pagination controls, change `Per page` to 50 and navigate to page 3.
6. Upload a local `netflix_titles.csv` file with the Upload CSV control (if you didn't start a server). The UI will parse and show results.

Notes

- For the presentation prefer serving the site over HTTP (Python or deploy to Vercel) so `fetch()` works without requiring upload.
- The UI includes a spinner while loading and numeric pagination controls for navigation.

Suggested screenshots (already captured via the dev environment):
- Full page (default)
- PG-13 filtered
- Long movies (>90 min)
If you want, I can add the actual screenshot image files to the repo (they're currently captured in the session). I added placeholder files in `/assets/screenshots/` — replace them with real PNGs named:

- `assets/screenshots/default.png`
- `assets/screenshots/pg13.png`
- `assets/screenshots/longer_than_90.png`

To replace placeholders locally, capture screenshots and save the PNGs at the paths above, then commit and push.
