let allQuests = [];
let currentTeam = "all";

/* =========================================================
   INSTALL APP
   ========================================================= */

let deferredInstallPrompt = null;

const installAppButton = document.getElementById(
    "install-app-button"
);

const installPanel = document.getElementById(
    "install-panel"
);

const installInstructions = document.getElementById(
    "install-instructions"
);

const installPanelClose = document.getElementById(
    "install-panel-close"
);


// Detect whether the website is already installed
function isAppInstalled() {
    return window.matchMedia(
        "(display-mode: standalone)"
    ).matches || window.navigator.standalone === true;
}


// Detect mobile devices, including iPads that may identify as Macs
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
    ) || (
            navigator.platform === "MacIntel" &&
            navigator.maxTouchPoints > 1
        );
}


// Display the install button when appropriate
function updateInstallButton() {
    if (!installAppButton) {
        return;
    }

    installAppButton.hidden =
        !isMobileDevice() || isAppInstalled();
}


// Android and supported browsers provide this event
window.addEventListener(
    "beforeinstallprompt",
    event => {
        event.preventDefault();

        deferredInstallPrompt = event;

        updateInstallButton();
    }
);


// Handle the install button
installAppButton?.addEventListener(
    "click",
    async () => {

        // Already installed? Nothing else to do.
        if (isAppInstalled()) {
            installAppButton.hidden = true;
            return;
        }

        const userAgent = navigator.userAgent;

        const isIOS =
            /iPhone|iPad|iPod/i.test(userAgent) ||
            (
                navigator.platform === "MacIntel" &&
                navigator.maxTouchPoints > 1
            );


        // iPhone and iPad installation instructions
        if (isIOS) {
            installInstructions.innerHTML = `
                <strong>To install on your iPhone or iPad:</strong>

                <ol>
                    <li>Open this website in Safari.</li>
                    <li>Tap the <strong>Share</strong> button.</li>
                    <li>Select <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> to finish.</li>
                </ol>

                The Axis Chronicles icon will then appear
                on your Home Screen.
            `;

            installPanel.hidden = false;
            return;
        }


        // Android and other browsers with native install support
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();

            const { outcome } =
                await deferredInstallPrompt.userChoice;

            if (outcome === "accepted") {
                installAppButton.hidden = true;
            }

            deferredInstallPrompt = null;
            return;
        }


        // Fallback for browsers without the native prompt
        installInstructions.innerHTML = `
            <strong>To install Axis Chronicles:</strong>

            <ol>
                <li>Open this website in your browser.</li>
                <li>Open the browser menu.</li>
                <li>Look for <strong>Install app</strong> or
                    <strong>Add to Home Screen</strong>.</li>
                <li>Follow the instructions to finish.</li>
            </ol>

            The exact wording depends on your browser.
        `;

        installPanel.hidden = false;
    }
);


// Close the instructions panel
installPanelClose?.addEventListener(
    "click",
    () => {
        installPanel.hidden = true;
    }
);


// Close the panel when clicking outside it
installPanel?.addEventListener(
    "click",
    event => {
        if (event.target === installPanel) {
            installPanel.hidden = true;
        }
    }
);


// Hide the button after successful installation
window.addEventListener(
    "appinstalled",
    () => {
        installAppButton.hidden = true;
        deferredInstallPrompt = null;
        installPanel.hidden = true;
    }
);


// Initial visibility check
updateInstallButton();


/* =========================================================
   INITIALIZE JOURNAL
   ========================================================= */

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

    // Update team navigation
    document.querySelectorAll("[data-team]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.team === team
        );
    });

    // Select the Quests page
    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === "quests"
        );
    });

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
        const page = button.dataset.page;

        // Update active page navigation
        document.querySelectorAll("[data-page]").forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.page === page
            );
        });

        if (page === "quests") {

            currentTeam = "all";

            document
                .querySelectorAll("[data-team]")
                .forEach(item => {
                    item.classList.toggle(
                        "active",
                        item.dataset.team === "all"
                    );
                });

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
    });
});


/* =========================================================
   START JOURNAL
   ========================================================= */

initializeJournal();
