let netflixData = [];
let filteredData = [];

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

function displayData(data) {
    const table = document.getElementById("movieTable");
    if (!table) return;

    table.innerHTML = "";

    if (!data.length) {
        table.innerHTML = `<tr><td colspan="5">No results found.</td></tr>`;
        return;
    }

    data.slice(0, 100).forEach(movie => {
        table.innerHTML += `
            <tr>
                <td>${movie.title || ""}</td>
                <td>${movie.listed_in || ""}</td>
                <td>${movie.rating || ""}</td>
                <td>${movie.duration || ""}</td>
                <td>${movie.type || ""}</td>
            </tr>
        `;
    });
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
        displayData(filtered);
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
        displayData(netflixData);
    });

    loadNetflixData();
});
