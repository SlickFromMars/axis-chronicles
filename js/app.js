let allQuests = [];
let currentTeam = "all";


/* =========================================================
   CAMPAIGN STATE
   ========================================================= */

let campaignSwitcherOpen = false;


/* =========================================================
   PAGE ROUTING
   ========================================================= */

function isValidPage(page) {

    if (
        typeof getEnabledCampaignPages !==
        "function"
    ) {
        return page === "quests";
    }

    return getEnabledCampaignPages()
        .includes(page);
}


/* Get the current page from the URL hash. */

function getPageFromURL() {

    const page =
        window.location.hash.substring(1);


    if (isValidPage(page)) {
        return page;
    }


    if (
        typeof getCampaignDefaultPage ===
        "function"
    ) {
        return getCampaignDefaultPage();
    }


    return "quests";
}


/* Update the URL without reloading the page. */

function updatePageURL(page) {

    const url =
        new URL(
            window.location.href
        );


    /*
        Preserve the active campaign query parameter.
    */

    if (
        typeof activeCampaign !==
        "undefined" &&
        activeCampaign
    ) {

        url.searchParams.set(
            "campaign",
            activeCampaign.id
        );
    }


    url.hash =
        page === "quests"
            ? ""
            : page;


    history.pushState(
        { page },
        "",
        url.href
    );
}


/* =========================================================
   PAGE DISPLAY
   ========================================================= */

function navigateTo(
    page,
    updateURL = true
) {

    if (!isValidPage(page)) {

        page =
            typeof getCampaignDefaultPage ===
                "function"
                ? getCampaignDefaultPage()
                : "quests";
    }


    if (updateURL) {
        updatePageURL(page);
    }


    /*
        Update active navigation button.
    */

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(item => {

            const isActive =
                item.dataset.page ===
                page;


            item.classList.toggle(
                "active",
                isActive
            );


            item.setAttribute(
                "aria-current",
                isActive
                    ? "page"
                    : "false"
            );
        });


    /*
        Display requested page.
    */

    if (
        page ===
        "quests"
    ) {

        currentTeam =
            "all";


        showQuests();


    } else if (
        page ===
        "calendar"
    ) {

        showCalendar();


    } else if (
        page ===
        "map"
    ) {

        showMap();


    } else if (
        page ===
        "music"
    ) {

        showMusic();


    }

    else if (
        page ===
        "archives"
    ) {
        sessionStorage.removeItem("archiveIntroPlayed");
        window.location.href = "arg/";
    } else if (
        page ===
        "characters"
    ) {

        showCharacters();
    }

}


/* =========================================================
   CAMPAIGN LIBRARY
   ========================================================= */

let campaignLibraryPreviousFocus = null;

function setupCampaignSwitcher() {
    const button = document.getElementById("campaign-switcher-button");
    const overlay = document.getElementById("campaign-library");
    const panel = overlay?.querySelector(".campaign-library-panel");
    const closeButton = document.getElementById("campaign-library-close");
    const backdrop = document.getElementById("campaign-library-backdrop");

    if (!button || !overlay || !panel || !closeButton || !backdrop) return;

    button.addEventListener("click", event => {
        event.stopPropagation();
        setCampaignSwitcherOpen(!campaignSwitcherOpen);
    });

    closeButton.addEventListener("click", () => setCampaignSwitcherOpen(false));
    backdrop.addEventListener("click", () => setCampaignSwitcherOpen(false));

    document.addEventListener("keydown", event => {
        if (!campaignSwitcherOpen) return;
        if (event.key === "Escape") {
            event.preventDefault();
            setCampaignSwitcherOpen(false);
        }

        // Keep keyboard focus inside the modal while it is open.
        if (event.key === "Tab") {
            const focusable = [...panel.querySelectorAll('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    renderCampaignSwitcher();
}

async function renderCampaignSwitcher() {
    const grid = document.getElementById("campaign-library-grid");
    if (!grid || !campaignRegistry || !Array.isArray(campaignRegistry.campaigns)) return;

    if (campaignRegistry.campaigns.length <= 1) {
        document.getElementById("campaign-switcher-button")?.setAttribute("aria-disabled", "true");
        return;
    }

    const entries = await Promise.all(campaignRegistry.campaigns.map(async entry => {
        try {
            const response = await fetch(entry.master);
            if (!response.ok) throw new Error(`Could not load ${entry.master}`);
            const master = await response.json();
            const root = entry.master.slice(0, entry.master.lastIndexOf("/") + 1);
            const imagePath = master.assets?.selectionPreview || master.assets?.map || master.assets?.socialPreview || master.assets?.favicon
            return {
                ...entry,
                master,
                name: master.name || entry.name || formatCampaignId(entry.id),
                description: master.text?.home?.description || master.social?.description || "Open this campaign journal and explore its world.",
                image: imagePath ? new URL(imagePath, new URL(root, window.location.href)).href : "",
                accent: master.theme?.accent || "#c9a45c",
                palette: {
                    background: master.theme?.background || "#100d0b",
                    backgroundDeep: master.theme?.backgroundDeep || "#080706",
                    panel: master.theme?.panel || "#1b1612",
                    panelLight: master.theme?.panelLight || master.theme?.panel || "#261e17",
                    panelHover: master.theme?.panelHover || master.theme?.panelLight || "#302519",
                    border: master.theme?.border || master.theme?.accent || "#c9a45c",
                    text: master.theme?.textBright || "#f4e9d0",
                    muted: master.theme?.muted || "#a89d88",
                    secondary: master.theme?.secondary || "#672b2b"
                },
                isCurrent: typeof activeCampaign !== "undefined" && activeCampaign?.id === entry.id
            };
        } catch (error) {
            console.warn("Could not prepare campaign library card:", entry.id, error);
            return {
                ...entry,
                name: entry.name || formatCampaignId(entry.id),
                description: "Open this campaign journal and explore its world.",
                image: "",
                accent: "#c9a45c",
                palette: { background: "#100d0b", backgroundDeep: "#080706", panel: "#1b1612", panelLight: "#261e17", panelHover: "#302519", border: "#c9a45c", text: "#f4e9d0", muted: "#a89d88", secondary: "#672b2b" },
                isCurrent: typeof activeCampaign !== "undefined" && activeCampaign?.id === entry.id
            };
        }
    }));

    // The archive frame follows the currently active campaign palette, not a fixed gold theme.
    const current = entries.find(campaign => campaign.isCurrent) || entries[0];
    const palette = current.palette;
    const library = document.getElementById("campaign-library");
    if (library && palette) {
        Object.entries({
            "--library-background": palette.background,
            "--library-background-deep": palette.backgroundDeep,
            "--library-panel": palette.panel,
            "--library-panel-light": palette.panelLight,
            "--library-panel-hover": palette.panelHover,
            "--library-border": palette.border,
            "--library-text": palette.text,
            "--library-muted": palette.muted,
            "--library-secondary": palette.secondary
        }).forEach(([name, value]) => library.style.setProperty(name, value));
    }

    // Three or fewer campaigns fit in the grid; from the fourth on, switch to a horizontal scroller.
    grid.classList.toggle("is-scrolling", entries.length > 3);

    grid.innerHTML = entries.map((campaign, index) => `
        <button type="button" class="campaign-volume ${campaign.isCurrent ? "is-current" : ""}"
            data-campaign-id="${escapeAppHTML(campaign.id)}"
            style="--volume-accent:${escapeAppHTML(campaign.accent)};--volume-index:${index};--volume-background:${escapeAppHTML(campaign.palette.background)};--volume-background-deep:${escapeAppHTML(campaign.palette.backgroundDeep)};--volume-panel:${escapeAppHTML(campaign.palette.panel)};--volume-panel-light:${escapeAppHTML(campaign.palette.panelLight)};--volume-panel-hover:${escapeAppHTML(campaign.palette.panelHover)};--volume-border:${escapeAppHTML(campaign.palette.border)};--volume-text:${escapeAppHTML(campaign.palette.text)};--volume-muted:${escapeAppHTML(campaign.palette.muted)};--volume-secondary:${escapeAppHTML(campaign.palette.secondary)}"
            ${campaign.isCurrent ? 'aria-current="true"' : ""}
            aria-label="${campaign.isCurrent ? "Current campaign: " : "Open campaign: "}${escapeAppHTML(campaign.name)}">
            <span class="campaign-volume-art ${campaign.image ? "has-art" : "no-art"}" ${campaign.image ? `style="background-image:url('${escapeAppHTML(campaign.image)}')"` : ""} aria-hidden="true">
                <span class="campaign-volume-art-wash"></span>
                <span class="campaign-volume-sigil">${campaign.isCurrent ? "✦" : "✧"}</span>
                ${campaign.isCurrent ? '<span class="campaign-volume-current">CURRENT JOURNAL</span>' : ""}
            </span>
            <span class="campaign-volume-copy">
                <span class="campaign-volume-kicker">VOLUME ${String(index + 1).padStart(2, "0")}</span>
                <span class="campaign-volume-title">${escapeAppHTML(campaign.name)}</span>
                <span class="campaign-volume-description">${escapeAppHTML(campaign.description)}</span>
                <span class="campaign-volume-enter">${campaign.isCurrent ? "YOU ARE HERE" : "OPEN JOURNAL"}<span aria-hidden="true"> ↗</span></span>
            </span>
        </button>
    `).join("");

    grid.querySelectorAll("[data-campaign-id]").forEach(card => {
        card.addEventListener("click", () => {
            const campaignId = card.dataset.campaignId;
            if (campaignId === activeCampaign?.id) {
                setCampaignSwitcherOpen(false);
                return;
            }
            switchCampaign(campaignId);
        });
    });
}

function setCampaignSwitcherOpen(open) {
    const button = document.getElementById("campaign-switcher-button");
    const overlay = document.getElementById("campaign-library");
    const panel = overlay?.querySelector(".campaign-library-panel");
    if (!button || !overlay || !panel) return;

    if (open === campaignSwitcherOpen) return;
    campaignSwitcherOpen = open;

    if (open) {
        campaignLibraryPreviousFocus = document.activeElement;
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        button.setAttribute("aria-expanded", "true");
        button.classList.add("open");
        document.body.classList.add("campaign-library-open");
        requestAnimationFrame(() => panel.focus());
    } else {
        overlay.setAttribute("aria-hidden", "true");
        button.setAttribute("aria-expanded", "false");
        button.classList.remove("open");
        document.body.classList.remove("campaign-library-open");
        overlay.hidden = true;
        if (campaignLibraryPreviousFocus && typeof campaignLibraryPreviousFocus.focus === "function") {
            campaignLibraryPreviousFocus.focus();
        }
    }
}


/* =========================================================
   SWITCH CAMPAIGN
   ========================================================= */

function switchCampaign(
    campaignId
) {

    if (
        !campaignRegistry ||
        !Array.isArray(
            campaignRegistry.campaigns
        )
    ) {
        return;
    }


    const campaign =
        campaignRegistry.campaigns.find(
            entry =>
                entry.id ===
                campaignId
        );


    if (!campaign) {

        console.error(
            `Campaign "${campaignId}" was not found.`
        );

        return;
    }


    /*
        Don't reload unnecessarily.
    */

    if (
        activeCampaign &&
        activeCampaign.id ===
        campaignId
    ) {

        setCampaignSwitcherOpen(
            false
        );

        return;
    }


    localStorage.setItem(
        "activeCampaign",
        campaignId
    );


    const url =
        new URL(
            window.location.href
        );


    /*
        Preserve the currently selected page.
        The new campaign will validate it after loading.
    */

    url.searchParams.set(
        "campaign",
        campaignId
    );


    /*
        Keep the current hash.
        If the new campaign disables that page,
        the router will automatically fall back
        to its default page.
    */


    window.location.href =
        url.href;
}


/* =========================================================
   CAMPAIGN NAME FALLBACK
   ========================================================= */

function formatCampaignId(
    id
) {

    return String(
        id || "Campaign"
    )
        .replace(
            /[-_]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );
}


/* =========================================================
   INITIALIZE JOURNAL
   ========================================================= */

async function initializeJournal() {

    const content =
        document.getElementById(
            "content"
        );


    try {

        /*
            Campaign MUST load first.
        */

        await loadCampaign();


        /*
            Now that the campaign is loaded,
            build the campaign selector.
        */

        setupCampaignSwitcher();


        /*
            Load shared quest data because
            several other pages use it.
        */

        allQuests =
            await loadQuests();


        /*
            Load characters used by quest cards.
        */

        if (
            typeof loadQuestCharacterData ===
            "function"
        ) {

            await loadQuestCharacterData();
        }


        /*
            Open the page specified by the URL.
        */

        navigateTo(
            getPageFromURL(),
            false
        );


    } catch (error) {

        console.error(
            "Journal initialization failed:",
            error
        );


        if (content) {

            content.innerHTML = `
                <p class="error">
                    The journal could not be loaded.
                    Check your campaign configuration
                    and data files and try again.
                </p>
            `;
        }
    }
}


/* =========================================================
   QUEST FILTERING
   ========================================================= */

function showQuests() {

    renderQuestList(allQuests);
}

/* Update the selected team. */

function setTeam(
    team
) {

    currentTeam =
        team;

    showQuests();
}


/* =========================================================
   PLACEHOLDER
   ========================================================= */

function showPlaceholder(
    page
) {

    document.getElementById(
        "content"
    ).innerHTML = `

        <div class="placeholder">

            <h2>
                ${escapeAppHTML(
        page.charAt(0).toUpperCase() +
        page.slice(1)
    )}
            </h2>


            <p>
                This section will be added
                in a future stage.
            </p>

        </div>
    `;
}


/* =========================================================
   TEAM NAVIGATION
   ========================================================= */

document
    .querySelectorAll(
        "[data-team]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    setTeam(
                        button.dataset.team
                    );
                }
            );
        }
    );


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

document
    .querySelectorAll(
        "[data-page]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.hidden ||
                        button.style.display ===
                        "none"
                    ) {
                        return;
                    }


                    navigateTo(
                        button.dataset.page
                    );
                }
            );
        }
    );


/* =========================================================
   BROWSER NAVIGATION
   ========================================================= */

window.addEventListener(
    "popstate",
    () => {

        navigateTo(
            getPageFromURL(),
            false
        );
    }
);


window.addEventListener(
    "hashchange",
    () => {

        navigateTo(
            getPageFromURL(),
            false
        );
    }
);


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeAppHTML(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => ({

            "&":
                "&amp;",

            "<":
                "&lt;",

            ">":
                "&gt;",

            '"':
                "&quot;",

            "'":
                "&#39;"
        })[
            character
        ]
    );
}


/* =========================================================
   START JOURNAL
   ========================================================= */

initializeJournal();
