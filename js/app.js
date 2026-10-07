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

        window.location.href =
            "arg/";
    } else if (
        page ===
        "characters"
    ) {

        showCharacters();
    }

}


/* =========================================================
   CAMPAIGN SWITCHER
   ========================================================= */

function setupCampaignSwitcher() {

    const switcher =
        document.getElementById(
            "campaign-switcher"
        );


    const button =
        document.getElementById(
            "campaign-switcher-button"
        );


    const menu =
        document.getElementById(
            "campaign-switcher-menu"
        );


    if (
        !switcher ||
        !button ||
        !menu
    ) {
        return;
    }


    renderCampaignSwitcher();


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            setCampaignSwitcherOpen(
                !campaignSwitcherOpen
            );
        }
    );


    /*
        Close when clicking elsewhere.
    */

    document.addEventListener(
        "click",
        event => {

            if (
                !switcher.contains(
                    event.target
                )
            ) {

                setCampaignSwitcherOpen(
                    false
                );
            }
        }
    );


    /*
        Escape closes the menu.
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                setCampaignSwitcherOpen(
                    false
                );
            }
        }
    );
}


/* =========================================================
   RENDER CAMPAIGN SWITCHER
   ========================================================= */

function renderCampaignSwitcher() {

    const button =
        document.getElementById(
            "campaign-switcher-button"
        );


    const menu =
        document.getElementById(
            "campaign-switcher-menu"
        );


    if (
        !button ||
        !menu ||
        typeof campaignRegistry ===
        "undefined" ||
        !campaignRegistry
    ) {
        return;
    }


    const campaigns =
        Array.isArray(
            campaignRegistry.campaigns
        )
            ? campaignRegistry.campaigns
            : [];


    if (
        campaigns.length <=
        1
    ) {

        button.setAttribute(
            "aria-disabled",
            "true"
        );


        button.classList.add(
            "campaign-switcher-single"
        );


        menu.hidden =
            true;


        return;
    }


    button.removeAttribute(
        "aria-disabled"
    );


    button.classList.remove(
        "campaign-switcher-single"
    );


    menu.innerHTML =
        campaigns
            .map(
                campaign => {

                    const campaignId =
                        campaign.id;


                    const masterPath =
                        campaign.master;


                    /*
                        Prefer the loaded campaign
                        name when available.
                    */

                    const isCurrent =
                        typeof activeCampaign !==
                        "undefined" &&
                        activeCampaign &&
                        activeCampaign.id ===
                        campaignId;


                    const label =
                        isCurrent &&
                            activeCampaign.name
                            ? activeCampaign.name
                            : formatCampaignId(
                                campaignId
                            );


                    return `
                        <button
                            type="button"
                            class="
                                campaign-option
                                ${isCurrent
                            ? "active"
                            : ""}
                            "
                            data-campaign-id="${escapeAppHTML(
                                campaignId
                            )}"
                            data-campaign-master="${escapeAppHTML(
                                masterPath
                            )}"
                            ${isCurrent
                            ? 'aria-current="true"'
                            : ""}
                        >

                            <span
                                class="campaign-option-marker"
                                aria-hidden="true"
                            >
                                ${isCurrent
                            ? "◆"
                            : ""
                        }
                            </span>


                            <span
                                class="campaign-option-name"
                            >
                                ${escapeAppHTML(
                            label
                        )}
                            </span>

                        </button>
                    `;
                }
            )
            .join("");


    menu
        .querySelectorAll(
            "[data-campaign-id]"
        )
        .forEach(
            option => {

                option.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const campaignId =
                            option.dataset
                                .campaignId;


                        switchCampaign(
                            campaignId
                        );
                    }
                );
            }
        );


    button.setAttribute(
        "aria-expanded",
        String(
            campaignSwitcherOpen
        )
    );
}


/* =========================================================
   CAMPAIGN SWITCHER STATE
   ========================================================= */

function setCampaignSwitcherOpen(
    open
) {

    const button =
        document.getElementById(
            "campaign-switcher-button"
        );


    const menu =
        document.getElementById(
            "campaign-switcher-menu"
        );


    if (
        !button ||
        !menu
    ) {
        return;
    }


    campaignSwitcherOpen =
        open;


    menu.hidden =
        !open;


    button.setAttribute(
        "aria-expanded",
        String(open)
    );


    button.classList.toggle(
        "open",
        open
    );
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
