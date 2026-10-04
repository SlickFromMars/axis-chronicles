let mapLocations = [];
let activeMapType = "all";
let activeMapRegion = "all";
let mapSearchQuery = "";
let selectedLocationId = null;
let pendingMapLocationId = null;
let mapLocationsPromise = null;
let coordinatePickerEnabled = false;

// Shared loader used by both the map page and quest details.
async function loadMapLocations() {
    if (Array.isArray(mapLocations) && mapLocations.length) {
        return mapLocations;
    }

    if (!mapLocationsPromise) {
        mapLocationsPromise = fetch("data/locations.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load locations (${response.status})`);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error("locations.json must contain an array.");
                }
                mapLocations = data;
                return mapLocations;
            })
            .catch(error => {
                mapLocationsPromise = null;
                throw error;
            });
    }

    return mapLocationsPromise;
}

// Called by quest details to navigate to a specific map marker.
function openMapLocation(locationId) {
    pendingMapLocationId = String(locationId);
    navigateTo("map");
}

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

                    <button type="button" id="map-clear-filters" class="map-clear-filters">
                        Clear filters
                    </button>
                </div>

                <p id="map-result-count" class="map-result-count" aria-live="polite"></p>
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
                        src="assets/images/caelora.webp"
                        alt="Map of Caelora"
                    >
                    <div id="map-markers" class="map-markers"></div>

                    <button
                        type="button"
                        id="map-fullscreen-button"
                        class="map-control-button map-fullscreen-button"
                        aria-label="View map fullscreen"
                    >
                        ⤢ Fullscreen
                    </button>

                    <div class="map-coordinate-tools">
    <button
        type="button"
        id="map-coordinate-toggle"
        class="map-control-button map-coordinate-toggle"
        aria-pressed="false"
    >
        Enable Coordinate Picker
    </button>

    <output
        id="map-coordinate-output"
        class="map-coordinate-output"
        aria-live="polite"
    >
        Click the map to read coordinates
    </output>
</div>
                </div>

                <aside id="map-detail-panel" class="map-detail-panel" aria-live="polite">
                    <p class="map-detail-empty">Select a marker to explore a location.</p>
                </aside>
            </div>

            <div
                class="map-viewer"
                id="map-viewer"
                role="dialog"
                aria-modal="true"
                aria-label="Fullscreen map of Caelora"
                aria-hidden="true"
                hidden
            >
                <div class="map-viewer-canvas" id="map-viewer-canvas">
                    <div class="map-viewer-stage" id="map-viewer-stage">
                        <img
                            class="map-viewer-image"
                            id="map-viewer-image"
                            src="assets/images/caelora.webp"
                            alt=""
                            draggable="false"
                        >
                        <div id="map-viewer-markers" class="map-markers"></div>
                    </div>
                </div>

                <button
                    type="button"
                    class="map-viewer-close"
                    id="map-viewer-close"
                    aria-label="Close fullscreen map"
                >
                    &times;
                </button>

                <div class="map-viewer-toolbar" role="group" aria-label="Map zoom controls">
                    <button type="button" class="map-control-button" id="map-zoom-in" aria-label="Zoom in">+</button>
                    <button type="button" class="map-control-button" id="map-zoom-out" aria-label="Zoom out">−</button>
                    <button type="button" class="map-control-button" id="map-zoom-reset" aria-label="Reset view">⟲</button>
                </div>

                <p class="map-viewer-hint">Drag to pan · Pinch or scroll to zoom · Tap a marker</p>
            </div>
        </section>
    `;

    try {
        await loadMapLocations();
        activeMapType = "all";
        activeMapRegion = "all";
        mapSearchQuery = "";
        selectedLocationId = null;

        populateRegionFilter();
        setupMapFilters();
        setupMapViewer();
        setupCoordinatePicker();
        renderFilteredMap();

        // A quest may have requested a specific location before
        // the map page finished loading.
        if (pendingMapLocationId !== null) {
            const location = mapLocations.find(
                item => String(item.id) === pendingMapLocationId
            );

            if (location) {
                selectedLocationId = String(location.id);
                highlightSelectedMarker();
                openLocationDetails(location);
            }

            pendingMapLocationId = null;
        }

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
    const inlineMarkers = document.getElementById("map-markers");
    const viewerMarkers = document.getElementById("map-viewer-markers");
    const resultCount = document.getElementById("map-result-count");

    if (!inlineMarkers) return;

    const filteredLocations = getFilteredLocations();

    // The same markers are drawn on the inline map and the fullscreen map.
    renderMapMarkers(filteredLocations, inlineMarkers);
    if (viewerMarkers) {
        renderMapMarkers(filteredLocations, viewerMarkers);
    }

    if (resultCount) {
        resultCount.textContent =
            `Showing ${filteredLocations.length} of ${mapLocations.length} entries`;
    }

    if (selectedLocationId !== null) {
        const stillVisible = filteredLocations.some(
            location => String(location.id) === selectedLocationId
        );

        if (stillVisible) {
            highlightSelectedMarker();
        } else {
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
                class="map-marker ${isRegion ? "map-marker-region" : "map-marker-location"}"
                data-location-id="${safeId}"
                style="left: ${x}%; top: ${y}%;"
                title="${safeName}"
                aria-label="View ${safeName}"
            >
                ${isRegion
                ? `<span class="map-region-symbol">✦</span>`
                : `<span class="map-location-symbol"></span>`}
                <span class="map-marker-name">${safeName}</span>
            </button>
        `;
    }).join("");

    container.querySelectorAll(".map-marker").forEach(marker => {
        marker.addEventListener("click", () => {
            const location = locations.find(
                item => String(item.id) === marker.dataset.locationId
            );

            if (!location) return;

            selectedLocationId = String(location.id);
            highlightSelectedMarker();
            openLocationDetails(location);
        });
    });
}

// Keeps the selected marker highlighted on both the inline and fullscreen maps.
function highlightSelectedMarker() {
    document.querySelectorAll(".map-marker").forEach(marker => {
        marker.classList.toggle(
            "selected",
            marker.dataset.locationId === selectedLocationId
        );
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

    const relevantQuests = (Array.isArray(allQuests) ? allQuests : [])
        .filter(quest =>
            quest.status === "active" &&
            Array.isArray(quest.locations) &&
            quest.locations.some(id => String(id) === String(location.id))
        );

    panel.innerHTML = `
        <div class="map-detail-header">
            <span class="map-detail-eyebrow">${escapeMapHTML(category)}</span>
            <h2>${escapeMapHTML(location.name)}</h2>
            <p class="map-detail-region">${escapeMapHTML(regionName)}</p>
        </div>

        <div class="map-detail-divider"></div>

        <p class="map-detail-description">${escapeMapHTML(description)}</p>

        ${location.status
            ? `<span class="map-detail-status">${escapeMapHTML(location.status)}</span>`
            : ""}

        ${relevantQuests.length ? `
            <div class="map-detail-divider"></div>
            <h3>Current Quests</h3>
            <div class="map-related-quests">
                ${relevantQuests.map(quest => `
                    <button
                        type="button"
                        class="map-related-quest"
                        data-related-quest="${escapeMapHTML(quest.id)}"
                    >
                        <span>${escapeMapHTML(quest.title)}</span>
                        <span aria-hidden="true">→</span>
                    </button>
                `).join("")}
            </div>
        ` : ""}

        <button type="button" class="map-detail-close" id="map-detail-close">
            Close details
        </button>
    `;

    document.getElementById("map-detail-close")
        ?.addEventListener("click", closeLocationDetails);

    panel.querySelectorAll("[data-related-quest]").forEach(button => {
        button.addEventListener("click", () => {
            const quest = allQuests.find(
                item => String(item.id) === button.dataset.relatedQuest
            );

            if (quest) {
                markQuestAsRead(quest);
                renderQuestDetail(quest);
            }
        });
    });
}

function closeLocationDetails() {
    selectedLocationId = null;

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
   FULLSCREEN MAP VIEWER (pan, zoom, markers)
----------------------------------------- */

const MAP_MIN_SCALE = 1;       // 1 = whole map fits the screen
const MAP_MAX_SCALE = 8;
const MAP_LABEL_SCALE = 3;     // location names appear at this zoom or higher
const MAP_START_MAX_SCALE = 2.5; // opening zoom cap for tall/narrow screens

const mapView = { scale: 1, x: 0, y: 0, baseW: 0, baseH: 0, cw: 0, ch: 0 };
const mapPointers = new Map();
let mapPan = null;
let mapPinch = null;
let mapDragMoved = false;
let mapGlobalListenersAttached = false;

function setupMapViewer() {
    const mapImage = document.getElementById("world-map-image");
    const viewer = document.getElementById("map-viewer");
    const canvas = document.getElementById("map-viewer-canvas");
    const closeButton = document.getElementById("map-viewer-close");
    const fullscreenButton = document.getElementById("map-fullscreen-button");

    if (!mapImage || !viewer || !canvas || !closeButton) return;

    mapPointers.clear();
    mapPan = null;
    mapPinch = null;
    mapDragMoved = false;

    closeMapViewer();

    mapImage.onclick = openMapViewer;

    if (fullscreenButton) {
        fullscreenButton.onclick = event => {
            event.stopPropagation();
            openMapViewer();
        };
    }

    closeButton.onclick = event => {
        event.stopPropagation();
        closeMapViewer();
    };

    document.getElementById("map-zoom-in").onclick = () => zoomMapBy(1.5);
    document.getElementById("map-zoom-out").onclick = () => zoomMapBy(1 / 1.5);
    document.getElementById("map-zoom-reset").onclick = resetMapView;

    bindMapGestures(canvas);

    if (!mapGlobalListenersAttached) {
        document.addEventListener("keydown", handleMapKeys);
        window.addEventListener("resize", handleMapResize);
        mapGlobalListenersAttached = true;
    }
}

function openMapViewer() {
    const viewer = document.getElementById("map-viewer");
    const image = document.getElementById("map-viewer-image");
    const closeButton = document.getElementById("map-viewer-close");

    if (!viewer || !image) return;

    viewer.hidden = false;
    viewer.classList.add("active");
    viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("map-viewer-open");

    const start = () => {
        if (measureMapViewer()) resetMapView();
    };

    if (image.complete && image.naturalWidth) {
        start();
    } else {
        image.addEventListener("load", start, { once: true });
    }

    closeButton?.focus();
}

function closeMapViewer() {
    const viewer = document.getElementById("map-viewer");

    if (!viewer) return;

    viewer.classList.remove("active", "show-labels");
    viewer.setAttribute("aria-hidden", "true");
    viewer.hidden = true;
    document.body.classList.remove("map-viewer-open");

    mapPointers.clear();
    mapPan = null;
    mapPinch = null;
    document.getElementById("map-viewer-canvas")?.classList.remove("dragging");
}

// Size the stage so the whole map fits the screen at scale 1.
function measureMapViewer() {
    const canvas = document.getElementById("map-viewer-canvas");
    const stage = document.getElementById("map-viewer-stage");
    const image = document.getElementById("map-viewer-image");

    if (!canvas || !stage || !image || !image.naturalWidth) return false;

    const aspect = image.naturalWidth / image.naturalHeight;

    mapView.cw = canvas.clientWidth;
    mapView.ch = canvas.clientHeight;
    mapView.baseW = Math.min(mapView.cw, mapView.ch * aspect);
    mapView.baseH = mapView.baseW / aspect;

    stage.style.width = `${mapView.baseW}px`;
    stage.style.height = `${mapView.baseH}px`;

    return true;
}

function resetMapView() {
    if (!measureMapViewer()) return;

    // On tall phone screens the fitted map is small, so open already zoomed in.
    const fillScale = (mapView.ch * 0.9) / mapView.baseH;
    mapView.scale = Math.min(
        MAP_START_MAX_SCALE,
        Math.max(MAP_MIN_SCALE, fillScale)
    );
    mapView.x = (mapView.cw - mapView.baseW * mapView.scale) / 2;
    mapView.y = (mapView.ch - mapView.baseH * mapView.scale) / 2;

    applyMapTransform();
}

function applyMapTransform() {
    const stage = document.getElementById("map-viewer-stage");
    const viewer = document.getElementById("map-viewer");

    if (!stage) return;

    const s = mapView.scale;
    const w = mapView.baseW * s;
    const h = mapView.baseH * s;

    // Keep the map from being dragged out of view (center it when smaller).
    mapView.x = w <= mapView.cw
        ? (mapView.cw - w) / 2
        : Math.min(0, Math.max(mapView.cw - w, mapView.x));
    mapView.y = h <= mapView.ch
        ? (mapView.ch - h) / 2
        : Math.min(0, Math.max(mapView.ch - h, mapView.y));

    stage.style.transform =
        `translate(${mapView.x}px, ${mapView.y}px) scale(${s})`;

    // Markers stay a readable size instead of scaling with the map:
    // slightly smaller when zoomed out, full size once zoomed in.
    const markerSize = Math.min(1, 0.7 + 0.15 * (s - 1));
    stage.style.setProperty("--marker-scale", (markerSize / s).toFixed(4));

    viewer?.classList.toggle("show-labels", s >= MAP_LABEL_SCALE);
}

function zoomMapAt(newScale, cx, cy) {
    const scale = Math.min(MAP_MAX_SCALE, Math.max(MAP_MIN_SCALE, newScale));
    const ratio = scale / mapView.scale;

    mapView.x = cx - (cx - mapView.x) * ratio;
    mapView.y = cy - (cy - mapView.y) * ratio;
    mapView.scale = scale;

    applyMapTransform();
}

function zoomMapBy(factor) {
    zoomMapAt(mapView.scale * factor, mapView.cw / 2, mapView.ch / 2);
}

function readMapPinch() {
    const [a, b] = [...mapPointers.values()];

    return {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2
    };
}

function bindMapGestures(canvas) {
    canvas.addEventListener("pointerdown", event => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        mapPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (mapPointers.size === 1) {
            mapDragMoved = false;
            mapPan = {
                x: event.clientX,
                y: event.clientY,
                viewX: mapView.x,
                viewY: mapView.y
            };
        } else if (mapPointers.size === 2) {
            mapDragMoved = true;
            mapPan = null;
            mapPinch = readMapPinch();
        }
    });

    canvas.addEventListener("pointermove", event => {
        if (!mapPointers.has(event.pointerId)) return;

        mapPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        // Two fingers: pinch to zoom and pan at the same time.
        if (mapPointers.size >= 2) {
            const pinch = readMapPinch();

            if (!mapPinch || mapPinch.distance === 0) {
                mapPinch = pinch;
                return;
            }

            const rect = canvas.getBoundingClientRect();

            mapView.x += pinch.cx - mapPinch.cx;
            mapView.y += pinch.cy - mapPinch.cy;
            zoomMapAt(
                mapView.scale * (pinch.distance / mapPinch.distance),
                pinch.cx - rect.left,
                pinch.cy - rect.top
            );

            mapPinch = pinch;
            return;
        }

        // One pointer: drag to pan. A small threshold keeps marker taps working.
        if (!mapPan) return;

        const dx = event.clientX - mapPan.x;
        const dy = event.clientY - mapPan.y;

        if (!mapDragMoved) {
            if (Math.hypot(dx, dy) < 6) return;

            mapDragMoved = true;
            canvas.setPointerCapture(event.pointerId);
            canvas.classList.add("dragging");
        }

        mapView.x = mapPan.viewX + dx;
        mapView.y = mapPan.viewY + dy;
        applyMapTransform();
    });

    const endPointer = event => {
        if (!mapPointers.delete(event.pointerId)) return;

        if (mapPointers.size === 1) {
            // Went from two fingers to one: carry on panning with the remaining one.
            const [remaining] = mapPointers.values();
            mapPan = {
                x: remaining.x,
                y: remaining.y,
                viewX: mapView.x,
                viewY: mapView.y
            };
            mapPinch = null;
        } else if (mapPointers.size === 0) {
            mapPan = null;
            mapPinch = null;
            canvas.classList.remove("dragging");
        }
    };

    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);

    // Swallow the click that follows a drag so it doesn't open a marker.
    canvas.addEventListener("click", event => {
        if (mapDragMoved) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    canvas.addEventListener("wheel", event => {
        event.preventDefault();

        const rect = canvas.getBoundingClientRect();
        const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
        const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0015));

        zoomMapAt(
            mapView.scale * factor,
            event.clientX - rect.left,
            event.clientY - rect.top
        );
    }, { passive: false });

    canvas.addEventListener("dblclick", event => {
        if (event.target.closest(".map-marker")) return;

        const rect = canvas.getBoundingClientRect();

        if (mapView.scale >= 4) {
            resetMapView();
        } else {
            zoomMapAt(
                mapView.scale * 2,
                event.clientX - rect.left,
                event.clientY - rect.top
            );
        }
    });
}

function handleMapKeys(event) {
    const viewer = document.getElementById("map-viewer");

    if (!viewer || viewer.hidden) return;

    const step = 60;

    switch (event.key) {
        case "Escape":
            // Close an open location popup first, then the viewer.
            if (document.getElementById("map-detail-close")) {
                closeLocationDetails();
            } else {
                closeMapViewer();
            }
            break;
        case "+":
        case "=":
            zoomMapBy(1.4);
            break;
        case "-":
        case "_":
            zoomMapBy(1 / 1.4);
            break;
        case "0":
            resetMapView();
            break;
        case "ArrowLeft":
            mapView.x += step;
            applyMapTransform();
            event.preventDefault();
            break;
        case "ArrowRight":
            mapView.x -= step;
            applyMapTransform();
            event.preventDefault();
            break;
        case "ArrowUp":
            mapView.y += step;
            applyMapTransform();
            event.preventDefault();
            break;
        case "ArrowDown":
            mapView.y -= step;
            applyMapTransform();
            event.preventDefault();
            break;
    }
}

function handleMapResize() {
    const viewer = document.getElementById("map-viewer");

    if (!viewer || viewer.hidden) return;

    if (measureMapViewer()) applyMapTransform();
}

/* -----------------------------------------
   MAP COORDINATE PICKER
----------------------------------------- */

function setupCoordinatePicker() {
    const stage = document.getElementById("map-stage");
    const mapImage = document.getElementById("world-map-image");
    const toggle = document.getElementById("map-coordinate-toggle");
    const output = document.getElementById("map-coordinate-output");

    if (!stage || !mapImage || !toggle || !output) return;

    coordinatePickerEnabled = false;

    stage.classList.remove("coordinate-mode");
    toggle.setAttribute("aria-pressed", "false");
    toggle.textContent = "Enable Coordinate Picker";
    output.textContent = "Click the map to read coordinates";

    toggle.addEventListener("click", () => {
        coordinatePickerEnabled = !coordinatePickerEnabled;

        stage.classList.toggle(
            "coordinate-mode",
            coordinatePickerEnabled
        );

        toggle.setAttribute(
            "aria-pressed",
            String(coordinatePickerEnabled)
        );

        toggle.textContent = coordinatePickerEnabled
            ? "Disable Coordinate Picker"
            : "Enable Coordinate Picker";

        output.textContent = coordinatePickerEnabled
            ? "Click the map to read coordinates"
            : "Click the map to read coordinates";
    });

    // Capture map clicks before the normal image click opens fullscreen.
    stage.addEventListener("click", event => {
        if (!coordinatePickerEnabled) return;

        // Keep the fullscreen control usable.
        if (event.target.closest("#map-fullscreen-button, #map-coordinate-toggle")) {
            return;
        }

        const rect = mapImage.getBoundingClientRect();

        // Ignore clicks outside the actual map image.
        if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        const coordinates = {
            x: Number(x.toFixed(2)),
            y: Number(y.toFixed(2))
        };

        output.textContent = `x: ${coordinates.x}, y: ${coordinates.y}`;

        console.log(
            `Map coordinates: x: ${coordinates.x}, y: ${coordinates.y}`
        );
    }, true);
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
