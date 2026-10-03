
let allQuests = [];
let currentTeam = "all";

async function initializeJournal() {
    const content = document.getElementById("content");

    try {
        allQuests = await loadQuests();
        showQuests();
    } catch (error) {
        console.error(error);
        content.innerHTML = `
            <p class="error">
                The journal could not be loaded.
                Check your data files and try again.
            </p>
        `;
    }
}

// Display quests filtered by the selected team
function showQuests() {
    const filteredQuests = allQuests.filter(quest =>
        currentTeam === "all" ||
        quest.team === currentTeam ||
        quest.team === "shared"
    );

    renderQuestList(filteredQuests);
}


// Update the selected team
function setTeam(team) {
    currentTeam = team;

    document.querySelectorAll("[data-team]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.team === team
        );
    });

    // Select the Quests page when changing teams
    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === "quests"
        );
    });

    showQuests();
}

// Display the map
function showMap() {
    document.getElementById("content").innerHTML = `
        <section class="page map-page">
            <h1>World Map</h1>

            <div class="map-container">
                <img
                    src="assets/images/caelora.png"
                    alt="Map of the world of Breaking the Axis"
                    class="world-map"
                    id="world-map-image"
                >
            </div>
        </section>
    `;

    document
        .getElementById("world-map-image")
        .addEventListener("click", openMapViewer);
}

function openMapViewer() {
    const overlay = document.createElement("div");

    overlay.className = "map-viewer";
    overlay.id = "map-viewer";

    overlay.innerHTML = `
        <button
            type="button"
            class="map-viewer-close"
            id="map-viewer-close"
            aria-label="Close map"
        >
            ×
        </button>

        <img
            src="assets/images/caelora.png"
            alt="Expanded map of the world of Breaking the Axis"
            class="map-viewer-image"
        >
    `;

    document.body.appendChild(overlay);

    document
        .getElementById("map-viewer-close")
        .addEventListener("click", closeMapViewer);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeMapViewer();
        }
    });

    document.addEventListener("keydown", handleMapEscape);
}

function closeMapViewer() {
    const viewer = document.getElementById("map-viewer");

    if (viewer) {
        viewer.remove();
    }

    document.removeEventListener("keydown", handleMapEscape);
}

function handleMapEscape(event) {
    if (event.key === "Escape") {
        closeMapViewer();
    }
}

function showMusic() {
    document.getElementById("content").innerHTML = `
        <section class="page music-page">
            <h1>Campaign Music</h1>

            <p class="page-description">
                The music behind the world of Caelora.
            </p>

            <div class="music-section">
                <h2>Campaign Inspiration</h2>

                <p>
                    Songs that inspired the characters,
                    locations, stories, and atmosphere of Breaking the Axis.
                </p>

                <iframe
                    style="border-radius: 12px"
                    src="https://open.spotify.com/embed/playlist/2n4tFMIR5GfEudPK51svuO?utm_source=generator&si=53fa386e79614ed9"
                    width="100%"
                    height="500"
                    frameborder="0"
                    allowfullscreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>
            </div>

            <div class="music-section">
                <h2>Session Soundtrack</h2>

                <p>
                    Music used during our actual sessions.
                </p>

                <iframe
                    style="border-radius: 12px"
                    src="https://open.spotify.com/embed/playlist/4WpsBbXWCIL5zXoZzuM4Ck?utm_source=generator&theme=0&si=27fd1ec0b0db4e89"
                    width="100%"
                    height="500"
                    frameborder="0"
                    allowfullscreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>
            </div>
        </section>
    `;
}

// Display a placeholder for sections that are not ready
function showPlaceholder(page) {
    document.getElementById("content").innerHTML = `
        <div class="placeholder">
            <h2>${escapeHTML(
        page.charAt(0).toUpperCase() + page.slice(1)
    )}</h2>
            <p>This section will be added in a future stage.</p>
        </div>
    `;
}

// Handle team selection
document.querySelectorAll("[data-team]").forEach(button => {
    button.addEventListener("click", () => {
        setTeam(button.dataset.team);
    });
});

// Handle navigation
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        const page = button.dataset.page;

        // Update active navigation button
        document.querySelectorAll("[data-page]").forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.page === page
            );
        });

        if (page === "quests") {
            currentTeam = "all";

            document.querySelectorAll("[data-team]").forEach(item => {
                item.classList.toggle(
                    "active",
                    item.dataset.team === "all"
                );
            });

            showQuests();
        } else if (page === "map") {
            showMap();
        } else if (page == "music") {
            showMusic();
        } else {
            showPlaceholder(page);
        }
    });
});

// Start the journal
initializeJournal();
