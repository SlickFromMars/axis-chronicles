
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
                    src="assets/images/world-map.png"
                    alt="Map of the world of Breaking the Axis"
                    class="world-map"
                >
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
        } else {
            showPlaceholder(page);
        }
    });
});

// Start the journal
initializeJournal();
