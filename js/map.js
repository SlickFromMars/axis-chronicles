
let mapLocations = [];
let activeMapType = "all";
let activeMapRegion = "all";
let mapSearchQuery = "";

async function showMap() {
    const content = document.getElementById("content");

    if (!content) {
        console.error("Map could not load: #content was not found.");
        return;
    }

    content.innerHTML = `
        <section class="page map-page">
            <div class="page-header">
                <h1>Map of Caelora</h1>
            </div>

            <div class="map-controls">
                <div class="map-search-wrapper">
                    <span class="map-search-icon" aria-hidden="true">⌕</span>
                    <input
                        id="map-search"
                        type="search"
                        placeholder="Search locations, regions, or lore..."
                        aria-label="Search map locations"
                        autocomplete="off"
                    >
                </div>

                <div class="map-filter-row">
                    <label class="map-filter">
                        <span>Type</span>
                        <select id="map-type-filter">
                            <option value="all">All types</option>
                            <option value="region">Regions</option>
                            <option value="settlement">Settlements</option>
                            <option value="location">Other locations</option>
                        </select>
                    </label>

                    <label class="map-filter">
                        <span>Region</span>
                        <select id="map-region-filter">
                            <option value="all">All regions</option>
                        </select>
                    </label>

                    <button
                        type="button"
                        id="map-clear-filters"
                        class="map-clear-filters"
                    >
                        Clear filters
                    </button>
                </div>

                <p id="map-result-count" class="map-result-count"
                   aria-live="polite"></p>
            </div>

            <div class="map-legend" aria-label="Map legend">
                <span class="map-legend-item">
                    <span class="map-legend-region">✦</span>
                    Region
                </span>
                <span class="map-legend-item">
                    <span class="map-legend-location"></span>
                    Settlement / Location
                </span>
            </div>

            <div class="map-container">
                <div class="map-stage" id="map-stage">
                    <img
                        id="world-map-image"
                        class="map-image"
                        src="assets/images/caelora.png"
                        alt="Map of Caelora"
                    >
                    <div id="map-markers" class="map-markers"></div>
                </div>

                <aside
                    id="map-detail-panel"
                    class="map-detail-panel"
                    aria-live="polite"
                >
                    <p class="map-detail-empty">
                        Select a marker to explore a location.
                    </p>
                </aside>
            </div>

            <div class="map-viewer" id="map-viewer" aria-hidden="true" hidden>
                <button
                    type="button"
                    class="map-viewer-close"
                    id="map-viewer-close"
                    aria-label="Close fullscreen map"
                >
                    &times;
                </button>
                <img
                    class="map-viewer-image"
                    src="assets/images/caelora.png"
                    alt="Fullscreen map of Caelora"
                >
            </div>
        </section>
    `;

    try {
        const response = await fetch("data/locations.json");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("locations.json must contain an array.");
        }

        mapLocations = data;
        activeMapType = "all";
        activeMapRegion = "all";
        mapSearchQuery = "";

        populateRegionFilter();
        setupMapFilters();
        setupMapViewer();
        renderFilteredMap();

    } catch (error) {
        console.error("Could not load map locations:", error);

        const stage = document.getElementById("map-stage");
        if (stage) {
            stage.innerHTML = `
                <div class="map-error">
                    <h2>Unable to load map locations</h2>
                    <p>Check that data/locations.json exists and contains valid JSON.</p>
                </div>
            `;
        }
    }
}

/* -----------------------------------------
   SEARCH AND FILTERS
----------------------------------------- */

function populateRegionFilter() {
    const regionFilter = document.getElementById("map-region-filter");
    if (!regionFilter) return;

    const regions = mapLocations
        .filter(location => location.type?.toLowerCase() === "region")
        .sort((a, b) => a.name.localeCompare(b.name));

    regions.forEach(region => {
        const option = document.createElement("option");
        option.value = region.name;
        option.textContent = region.name;
        regionFilter.appendChild(option);
    });
}

function setupMapFilters() {
    const searchInput = document.getElementById("map-search");
    const typeFilter = document.getElementById("map-type-filter");
    const regionFilter = document.getElementById("map-region-filter");
    const clearButton = document.getElementById("map-clear-filters");

    searchInput?.addEventListener("input", event => {
        mapSearchQuery = event.target.value.trim().toLowerCase();
        renderFilteredMap();
    });

    typeFilter?.addEventListener("change", event => {
        activeMapType = event.target.value;
        renderFilteredMap();
    });

    regionFilter?.addEventListener("change", event => {
        activeMapRegion = event.target.value;
        renderFilteredMap();
    });

    clearButton?.addEventListener("click", () => {
        mapSearchQuery = "";
        activeMapType = "all";
        activeMapRegion = "all";

        searchInput.value = "";
        typeFilter.value = "all";
        regionFilter.value = "all";

        renderFilteredMap();
        searchInput.focus();
    });
}

function getFilteredLocations() {
    return mapLocations.filter(location => {
        const type = (location.type || "location").toLowerCase();

        let matchesType = true;

        if (activeMapType === "region") {
            matchesType = type === "region";
        } else if (activeMapType === "settlement") {
            matchesType = type === "settlement";
        } else if (activeMapType === "location") {
            matchesType = type !== "region" && type !== "settlement";
        }

        const locationRegion = type === "region"
            ? location.name
            : location.region || "";

        const matchesRegion =
            activeMapRegion === "all" ||
            locationRegion.toLowerCase() === activeMapRegion.toLowerCase();

        const searchableText = [
            location.name,
            location.type,
            location.region,
            location.description,
            location.notes
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            !mapSearchQuery || searchableText.includes(mapSearchQuery);

        return matchesType && matchesRegion && matchesSearch;
    });
}

function renderFilteredMap() {
    const markerContainer = document.getElementById("map-markers");
    const resultCount = document.getElementById("map-result-count");

    if (!markerContainer) return;

    const filteredLocations = getFilteredLocations();

    renderMapMarkers(filteredLocations, markerContainer);

    if (resultCount) {
        resultCount.textContent =
            `Showing ${filteredLocations.length} of ${mapLocations.length} entries`;
    }

    const selectedMarker = document.querySelector(".map-marker.selected");

    if (selectedMarker) {
        const selectedId = selectedMarker.dataset.locationId;
        const stillVisible = filteredLocations.some(
            location => String(location.id) === selectedId
        );

        if (!stillVisible) {
            clearMapSelection();
        }
    }
}

/* -----------------------------------------
   MAP MARKERS
----------------------------------------- */

function renderMapMarkers(locations, container) {
    container.innerHTML = locations.map(location => {
        const isRegion = location.type?.toLowerCase() === "region";
        const safeId = escapeMapHTML(String(location.id));
        const safeName = escapeMapHTML(location.name);
        const x = Number(location.x);
        const y = Number(location.y);

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            x < 0 || x > 100 ||
            y < 0 || y > 100
        ) {
            return "";
        }

        return `
            <button
                type="button"
                class="map-marker ${isRegion ? "map-marker-region" : "map-marker-location"
            }"
                data-location-id="${safeId}"
                style="left: ${x}%; top: ${y}%;"
                title="${safeName}"
                aria-label="View ${safeName}"
            >
                ${isRegion
                ? `
                            <span class="map-region-symbol">✦</span>
                            <span class="map-marker-name">${safeName}</span>
                        `
                : `
                            <span class="map-location-symbol"></span>
                            <span class="map-marker-name">${safeName}</span>
                        `
            }
            </button>
        `;
    }).join("");

    container.querySelectorAll(".map-marker").forEach(marker => {
        marker.addEventListener("click", () => {
            const location = locations.find(
                item => String(item.id) === marker.dataset.locationId
            );

            if (!location) return;

            container.querySelectorAll(".map-marker.selected")
                .forEach(item => item.classList.remove("selected"));

            marker.classList.add("selected");
            openLocationDetails(location);
        });
    });
}

/* -----------------------------------------
   LOCATION DETAILS
----------------------------------------- */

function openLocationDetails(location) {
    const panel = document.getElementById("map-detail-panel");
    if (!panel) return;

    const isRegion = location.type?.toLowerCase() === "region";
    const category = isRegion ? "Region" : location.type || "Location";
    const regionName = isRegion ? "Caelora" : location.region || "Uncategorized";
    const description =
        location.description || "No details have been recorded yet.";

    panel.innerHTML = `
        <div class="map-detail-header">
            <span class="map-detail-eyebrow">
                ${escapeMapHTML(category)}
            </span>
            <h2>${escapeMapHTML(location.name)}</h2>
            <p class="map-detail-region">
                ${escapeMapHTML(regionName)}
            </p>
        </div>

        <div class="map-detail-divider"></div>

        <p class="map-detail-description">
            ${escapeMapHTML(description)}
        </p>

        ${location.status
            ? `<span class="map-detail-status">
                    ${escapeMapHTML(location.status)}
                   </span>`
            : ""
        }

        <button
            type="button"
            class="map-detail-close"
            id="map-detail-close"
        >
            Close details
        </button>
    `;

    document.getElementById("map-detail-close")
        ?.addEventListener("click", closeLocationDetails);
}

function closeLocationDetails() {
    document.querySelectorAll(".map-marker.selected")
        .forEach(marker => marker.classList.remove("selected"));

    const panel = document.getElementById("map-detail-panel");

    if (panel) {
        panel.innerHTML = `
            <p class="map-detail-empty">
                Select a marker to explore a location.
            </p>
        `;
    }
}

function clearMapSelection() {
    closeLocationDetails();
}

/* -----------------------------------------
   FULLSCREEN MAP VIEWER
----------------------------------------- */

// Prevent duplicate document-level Escape listeners.
let mapEscapeListenerAttached = false;

function setupMapViewer() {
    const mapImage = document.getElementById("world-map-image");
    const viewer = document.getElementById("map-viewer");
    const closeButton = document.getElementById("map-viewer-close");

    if (!mapImage || !viewer || !closeButton) return;

    // Always begin with the viewer closed when the map is rendered.
    closeMapViewer();

    // Assigning onclick replaces any previous handler on this element.
    // Only clicking the map image itself opens fullscreen.
    mapImage.onclick = openMapViewer;

    closeButton.onclick = event => {
        event.stopPropagation();
        closeMapViewer();
    };

    // Clicking the dark backdrop closes the viewer.
    viewer.onclick = event => {
        if (event.target === viewer) {
            closeMapViewer();
        }
    };

    // Add the Escape listener only once, even if showMap() runs repeatedly.
    if (!mapEscapeListenerAttached) {
        document.addEventListener("keydown", handleMapEscape);
        mapEscapeListenerAttached = true;
    }
}

function openMapViewer() {
    const viewer = document.getElementById("map-viewer");
    const closeButton = document.getElementById("map-viewer-close");

    if (!viewer) return;

    viewer.hidden = false;
    viewer.classList.add("active");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("map-viewer-open");

    closeButton?.focus();
}

function closeMapViewer() {
    const viewer = document.getElementById("map-viewer");

    if (!viewer) return;

    viewer.classList.remove("active");
    viewer.setAttribute("aria-hidden", "true");
    viewer.hidden = true;
    document.body.classList.remove("map-viewer-open");
}

function handleMapEscape(event) {
    if (event.key !== "Escape") return;

    const viewer = document.getElementById("map-viewer");

    if (viewer && !viewer.hidden) {
        closeMapViewer();
    }
}

/* -----------------------------------------
   HTML ESCAPING
----------------------------------------- */

function escapeMapHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}
