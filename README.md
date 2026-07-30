# my_netflix_project — Work in Progress

This project is a dashboard for the Netflix titles dataset (`Data/netflix_titles.csv`).

Status: WIP — features being implemented:
- Robust CSV loading (PapaParse + fallbacks)
- Filtering by title, genre, country, rating
- Pagination and performance improvements
- Improved UI and responsive layout

Local development:

```bash
# start a simple static server (Python 3)
cd /path/to/my_netflix_project
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

Quick alternative: upload CSV in-browser

If you prefer not to run a local server, open `index.html` in a browser and use the **Upload CSV** control at the top of the page to load your local `netflix_titles.csv` file. The page will parse it in-browser using PapaParse.

Notes for presentation:
- The demo is best served from a local HTTP server or deployed (Vercel/GitHub Pages) because browsers block `fetch()` against local files when opened via `file://`.

Contact: Huma Ali
