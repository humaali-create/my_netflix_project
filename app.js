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

    try {
        const response = await fetch("./Data/netflix_titles.csv", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const csvText = await response.text();
        const parsed = parseCSV(csvText);

        netflixData = parsed.filter(item => item && Object.keys(item).length);
        console.log("Loaded rows:", netflixData.length);

        displayData(netflixData);
        setStatus(`Loaded ${netflixData.length} items.`);
    } catch (error) {
        console.error(error);
        setStatus("Failed to load the CSV. Check the server and file path.");
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
