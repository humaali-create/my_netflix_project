let netflixData = [];

function setStatus(message) {
    const statusEl = document.getElementById("status");
    if (statusEl) {
        statusEl.textContent = message;
    }
}

function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(field);
            field = "";
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') i++;
            row.push(field);
            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }
            row = [];
            field = "";
        } else {
            field += char;
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        if (row.some(cell => cell !== "")) {
            rows.push(row);
        }
    }

    if (rows.length === 0) return [];

    const [headers, ...dataRows] = rows;
    return dataRows.map(values => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ?? "";
        });
        return obj;
    });
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
        const parsed = parseCSV(csvText);

        netflixData = parsed.filter(item => item && Object.keys(item).length);
        console.log("Loaded rows:", netflixData.length);

        displayData(netflixData);
        setStatus(`Loaded ${netflixData.length} items.`);
    } catch (error) {
        console.error(error);
        const message = window.location.protocol === "file:"
            ? "The CSV could not be loaded because the page is being opened directly from the filesystem. Run a local server such as python3 -m http.server 8000 and open http://127.0.0.1:8000/."
            : "Failed to load the CSV. Check the server and file path.";
        setStatus(message);
    }
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
