let netflixData = [];
let filteredData = [];
let currentPage = 1;
let pageSize = 25;

function setStatus(message) {
    const statusEl = document.getElementById("status");
    if (statusEl) {
        statusEl.textContent = message;
    }
}

// Use PapaParse (included via CDN in index.html) for robust CSV parsing.
function parseCSVWithPapa(text) {
    try {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
        return result.data || [];
    } catch (err) {
        console.error('PapaParse error', err);
        return [];
    }
}

function loadFromFile(file) {
    showSpinner();
    try {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: results => {
                netflixData = (results.data || []).filter(item => item && Object.keys(item).length);
                populateFilterOptions(netflixData);
                filteredData = netflixData.slice();
                currentPage = 1;
                displayData(filteredData);
                setStatus(`Loaded ${netflixData.length} items from file.`);
                hideSpinner();
            },
            error: err => {
                console.error('File parse error', err);
                hideSpinner();
                setStatus('Failed to parse CSV file.');
            }
        });
    } catch (err) {
        console.error(err);
        hideSpinner();
        setStatus('Failed to read file.');
    }
}

function displayData(data) {
    const table = document.getElementById("movieTable");
    if (!table) return;
    table.innerHTML = "";

    if (!data.length) {
        table.innerHTML = `<tr class="empty-row"><td colspan="5">No results found.</td></tr>`;
        updatePagination(0);
        return;
    }

    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = data.slice(start, end);

    pageItems.forEach(movie => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(movie.title || "")}</td>
            <td>${escapeHtml(movie.listed_in || movie['listed_in'] || "")}</td>
            <td>${escapeHtml(movie.rating || "")}</td>
            <td>${escapeHtml(movie.duration || "")}</td>
            <td>${escapeHtml(movie.type || "")}</td>
        `;
        table.appendChild(tr);
    });

    updatePagination(total);
}

function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}

function updatePagination(totalItems){
    const pageInfo = document.getElementById('pageInfo');
    const prev = document.getElementById('prevPage');
    const next = document.getElementById('nextPage');
    const first = document.getElementById('firstPage');
    const last = document.getElementById('lastPage');
    const pageButtons = document.getElementById('pageButtons');
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prev.disabled = currentPage <= 1;
    next.disabled = currentPage >= totalPages;
    first.disabled = currentPage <= 1;
    last.disabled = currentPage >= totalPages;

    // render numeric page buttons (windowed)
    if (pageButtons) {
        pageButtons.innerHTML = '';
        const maxButtons = 7;
        let start = Math.max(1, currentPage - Math.floor(maxButtons/2));
        let end = start + maxButtons - 1;
        if (end > totalPages) { end = totalPages; start = Math.max(1, end - maxButtons + 1); }

        if (start > 1) {
            const el = makePageButton(1); pageButtons.appendChild(el);
            if (start > 2) pageButtons.appendChild(makeEllipsis());
        }

        for (let p = start; p <= end; p++) pageButtons.appendChild(makePageButton(p));

        if (end < totalPages) {
            if (end < totalPages - 1) pageButtons.appendChild(makeEllipsis());
            pageButtons.appendChild(makePageButton(totalPages));
        }
    }
}

function makePageButton(p) {
    const btn = document.createElement('button');
    btn.textContent = p;
    btn.style.minWidth = '36px';
    if (p === currentPage) { btn.disabled = true; btn.style.fontWeight = '700'; }
    btn.addEventListener('click', () => { currentPage = p; displayData(filteredData); });
    return btn;
}

function makeEllipsis() {
    const span = document.createElement('span'); span.textContent = '...'; span.className = 'muted'; span.style.padding = '0 6px'; return span;
}

async function loadNetflixData() {
    setStatus("Loading data...");

    const candidates = [
        "./Data/netflix_titles.csv",
        "Data/netflix_titles.csv"
    ];

    try {
        let response = null;
        let lastError = null;

        for (const url of candidates) {
            try {
                response = await fetch(url, { cache: "no-store" });
                if (response.ok) {
                    break;
                }
                lastError = new Error(`HTTP ${response.status} for ${url}`);
            } catch (error) {
                lastError = error;
            }
        }

        if (!response?.ok) {
            throw lastError || new Error("Unable to fetch CSV");
        }

        const csvText = await response.text();
        // Try PapaParse first, fall back to simple split if needed
        let parsed = parseCSVWithPapa(csvText);
        if (!parsed || !parsed.length) {
            // fallback: simple parsing by lines
            const lines = csvText.split(/\r?\n/).filter(l => l.trim());
            const headers = lines.shift().split(',').map(h => h.trim());
            parsed = lines.map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => obj[h] = values[i] ?? '');
                return obj;
            });
        }

        netflixData = parsed.filter(item => item && Object.keys(item).length);
        console.log("Loaded rows:", netflixData.length);

        populateFilterOptions(netflixData);
        filteredData = netflixData.slice();
        displayData(filteredData);
        setStatus(`Loaded ${netflixData.length} items.`);
    } catch (error) {
        console.error(error);
        const message = window.location.protocol === "file:"
            ? "The CSV could not be loaded because the page is being opened directly from the filesystem. Run a local server such as python3 -m http.server 8000 and open http://127.0.0.1:8000/."
            : "Failed to load the CSV. Check the server and file path.";
        setStatus(message);
    }
}

function getUniqueGenres(data) {
    const set = new Set();
    data.forEach(item => {
        const listed = item.listed_in || item['listed_in'] || '';
        listed.split(',').forEach(g => {
            const t = g.trim();
            if (t) set.add(t);
        });
    });
    return Array.from(set).sort();
}

function getUniqueCountries(data) {
    const set = new Set();
    data.forEach(item => {
        const country = item.country || item['country'] || '';
        country.split(',').forEach(c => {
            const t = c.trim();
            if (t) set.add(t);
        });
    });
    return Array.from(set).sort();
}

function getUniqueRatings(data) {
    const set = new Set();
    data.forEach(item => {
        const r = item.rating || item['rating'] || '';
        const t = (r || '').trim();
        if (t) set.add(t);
    });
    return Array.from(set).sort();
}

function populateFilterOptions(data) {
    const genreSelect = document.getElementById('genreSelect');
    const countrySelect = document.getElementById('countrySelect');
    const ratingSelect = document.getElementById('ratingSelect');

    // Clear existing (keep first option)
    [genreSelect, countrySelect, ratingSelect].forEach(sel => {
        if (!sel) return;
        while (sel.options.length > 1) sel.remove(1);
    });

    getUniqueGenres(data).forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        genreSelect.appendChild(opt);
    });

    getUniqueCountries(data).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        countrySelect.appendChild(opt);
    });

    getUniqueRatings(data).forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        ratingSelect.appendChild(opt);
    });
}

function applyFilters() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const genre = document.getElementById('genreSelect')?.value || '';
    const country = document.getElementById('countrySelect')?.value || '';
    const rating = document.getElementById('ratingSelect')?.value || '';

    filteredData = netflixData.filter(movie => {
        if (!movie) return false;
        if (search) {
            const title = (movie.title || movie['title'] || '').toLowerCase();
            if (!title.includes(search)) return false;
        }
        if (genre) {
            const listed = (movie.listed_in || movie['listed_in'] || '');
            const parts = listed.split(',').map(s => s.trim());
            if (!parts.includes(genre)) return false;
        }
        if (country) {
            const c = (movie.country || movie['country'] || '');
            const parts = c.split(',').map(s => s.trim());
            if (!parts.includes(country)) return false;
        }
        if (rating) {
            const r = (movie.rating || movie['rating'] || '').trim();
            if (r !== rating) return false;
        }
        return true;
    });

    displayData(filteredData);
    setStatus(`Showing ${filteredData.length} of ${netflixData.length} items.`);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('genreSelect').value = '';
    document.getElementById('countrySelect').value = '';
    document.getElementById('ratingSelect').value = '';
    filteredData = netflixData.slice();
    displayData(filteredData);
    setStatus(`Showing ${filteredData.length} of ${netflixData.length} items.`);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("pg13Btn")?.addEventListener("click", () => {
        const filtered = netflixData.filter(movie => movie.rating === "PG-13");
        filteredData = filtered;
        currentPage = 1;
        displayData(filteredData);
    });

    document.getElementById("longBtn")?.addEventListener("click", () => {
        const filtered = netflixData.filter(movie => {
            const match = movie.duration?.match(/(\d+)/);
            if (match) {
                return parseInt(match[1], 10) > 90;
            }
            return false;
        });
        displayData(filtered);
    });

    document.getElementById("resetBtn")?.addEventListener("click", () => {
        filteredData = netflixData.slice();
        currentPage = 1;
        displayData(filteredData);
    });

    document.getElementById('applyFiltersBtn')?.addEventListener('click', () => { currentPage = 1; applyFilters(); });
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => { clearFilters(); });

    document.getElementById('csvFileInput')?.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) loadFromFile(f);
    });

    // Prev/Next pagination handlers
    document.getElementById('prevPage')?.addEventListener('click', () => { if (currentPage>1) { currentPage--; displayData(filteredData); } });
    document.getElementById('nextPage')?.addEventListener('click', () => { currentPage++; displayData(filteredData); });
    // First/Last page buttons (added to support CSV-first MVP pagination)
    document.getElementById('firstPage')?.addEventListener('click', () => { currentPage = 1; displayData(filteredData); });
    document.getElementById('lastPage')?.addEventListener('click', () => { const totalPages = Math.max(1, Math.ceil((filteredData.length||0)/pageSize)); currentPage = totalPages; displayData(filteredData); });
    document.getElementById('pageSizeSelect')?.addEventListener('change', (e) => { pageSize = parseInt(e.target.value,10)||25; currentPage=1; displayData(filteredData); });

    // MVP change: do NOT auto-load any CSV on startup.
    // - Removed automatic `loadNetflixData()` call and spinner show so page starts empty.
    // - Data will only be loaded when the user selects a file via `#csvFileInput`.
    // Ensure spinner is hidden on startup (HTML default sets it to display:none).
});

function showSpinner(){
    const s = document.getElementById('spinner');
    if(s) s.style.display = '';
}

function hideSpinner(){
    const s = document.getElementById('spinner');
    if(s) s.style.display = 'none';
}
