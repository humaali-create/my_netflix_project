# my_netflix_project

This is a simple static site that reads `Data/netflix_titles.csv` and displays it in the browser.

You cannot load the CSV by opening `index.html` with the `file://` protocol because browsers block cross-file fetches. Start a local HTTP server instead.

Options to run a local server:

- Using Python 3 (no install required):

```bash
python3 -m http.server 8000
```

Then open: http://127.0.0.1:8000/

- Using Node + `http-server` (recommended if you want `npm start`):

```bash
# install dev dependency
npm install
# then start the server
npm start
```

`npm start` will run `http-server -c-1 -p 8000` and serve the project at http://127.0.0.1:8000/

If you prefer a different port, change the port number in the command.

Troubleshooting:

- If you still see the "file://" message, make sure you've opened the `http://...` URL and not the file path.
- If `npm install` fails, run `node -v` and `npm -v` to check your Node.js installation, or use the Python option above.

