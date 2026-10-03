let allQuests = [];
let currentTeam = "all";


/* =========================================================
   PAGE ROUTING
   ========================================================= */

const validPages = [
    "quests",
    "calendar",
    "map",
    "music"
];


// Get the current page from the URL hash
function getPageFromURL() {
    const page = window.location.hash.substring(1);

    if (validPages.includes(page)) {
        return page;
    }

    return "journal";
}


// Update the URL without changing the existing site URL
function updatePageURL(page) {
    if (page === "journal") {
        history.pushState(
            { page },
            "",
            window.location.pathname
        );
    } else {
        history.pushState(
            { page },
            "",
            `${window.location.pathname}#${page}`
        );
    }
}


// Display the requested page
function navigateTo(page, updateURL = true) {
    if (!validPages.includes(page)) {
        page = "journal";
    }

    if (updateURL) {
        updatePageURL(page);
    }

    // Update active page navigation
    document.querySelectorAll("[data-page]").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === page
        );
    });

    // Display page content
    if (page === "quests") {

        currentTeam = "all";
        showQuests();

    } else if (page === "calendar") {

        showCalendar();

    } else if (page === "map") {

        showMap();

    } else if (page === "music") {

        showMusic();

    } else {

        showPlaceholder(page);
    }
}


/* =========================================================
   INITIALIZE JOURNAL
   ========================================================= */

async function initializeJournal() {
    const content = document.getElementById("content");

    try {
        allQuests = await loadQuests();

        // Open the page specified by the URL.
        // If there is no hash, open Journal.
        navigateTo(getPageFromURL(), false);

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


/* =========================================================
   QUEST FILTERING
   ========================================================= */

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
    showQuests();
}


/* =========================================================
   PLACEHOLDER
   ========================================================= */

// Display a placeholder for sections that are not ready
function showPlaceholder(page) {
    document.getElementById("content").innerHTML = `
        <div class="placeholder">
            <h2>${escapeHTML(
        page.charAt(0).toUpperCase() + page.slice(1)
    )}</h2>

            <p>
                This section will be added in a future stage.
            </p>
        </div>
    `;
}


/* =========================================================
   TEAM NAVIGATION
   ========================================================= */

document.querySelectorAll("[data-team]").forEach(button => {
    button.addEventListener("click", () => {
        setTeam(button.dataset.team);
    });
});


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.page);
    });
});


/* =========================================================
   BROWSER NAVIGATION
   ========================================================= */

// Handle browser Back / Forward
window.addEventListener("popstate", () => {
    navigateTo(getPageFromURL(), false);
});

// Handle direct hash changes
window.addEventListener("hashchange", () => {
    navigateTo(getPageFromURL(), false);
});


/* =========================================================
   START JOURNAL
   ========================================================= */

initializeJournal();
