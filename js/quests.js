let hideCompleted =
    localStorage.getItem("hideCompleted") === "true";

let collapsedCategories = JSON.parse(
    localStorage.getItem("collapsedCategories") || "{}"
);

/* =========================================================
   QUEST UPDATE NOTIFICATIONS
   ========================================================= */

const QUEST_READ_KEY = "questUpdatesRead";

function getReadVersions() {
    try {
        return JSON.parse(
            localStorage.getItem(QUEST_READ_KEY)
        ) || {};
    } catch {
        return {};
    }
}

function hasUnreadUpdate(quest) {
    const readVersions = getReadVersions();
    const currentVersion = quest.updateVersion || 0;

    return currentVersion > (readVersions[quest.id] || 0);
}

function markQuestAsRead(quest) {
    const readVersions = getReadVersions();

    readVersions[quest.id] = quest.updateVersion || 0;

    localStorage.setItem(
        QUEST_READ_KEY,
        JSON.stringify(readVersions)
    );
}

/* =========================================================
   LOAD QUESTS
   ========================================================= */

async function loadQuests() {
    const response = await fetch("data/quests.json");

    if (!response.ok) {
        throw new Error("Could not load quests");
    }

    return await response.json();
}


/* =========================================================
   QUEST LIST
   ========================================================= */

function renderQuestList(quests) {
    const content = document.getElementById("content");

    /*
        Hide completed quests when enabled.
    */
    const visibleQuests = hideCompleted
        ? quests.filter(quest => quest.status !== "completed")
        : quests;

    let questHTML = renderQuestControls();

    if (visibleQuests.length === 0) {
        questHTML += `
            <p class="empty-state">
                No quests have been recorded here yet.
            </p>
        `;

        content.innerHTML = questHTML;

        attachQuestControls();

        return;
    }

    const categories = [
        {
            type: "main",
            label: "Main Quests"
        },
        {
            type: "side",
            label: "Side Quests"
        },
        {
            type: "companion",
            label: "Companion Quests"
        }
    ];

    categories.forEach(category => {

        const categoryQuests = visibleQuests
            .filter(quest => quest.type === category.type)
            .sort((a, b) => {

                // Completed quests always go to the bottom
                const completedDifference =
                    (a.status === "completed" ? 1 : 0) -
                    (b.status === "completed" ? 1 : 0);

                if (completedDifference !== 0) {
                    return completedDifference;
                }

                // Team ordering
                const teamOrder = {
                    one: 1,
                    two: 2,
                    shared: 3
                };

                const teamDifference =
                    (teamOrder[a.team] || 99) -
                    (teamOrder[b.team] || 99);

                if (teamDifference !== 0) {
                    return teamDifference;
                }

                // Alphabetical title ordering
                return a.title.localeCompare(
                    b.title,
                    undefined,
                    { sensitivity: "base" }
                );
            })

        if (categoryQuests.length === 0) {
            return;
        }

        const isCollapsed = collapsedCategories[category.type] === true;

        questHTML += `
        <section class="quest-category ${isCollapsed ? "collapsed" : ""}">

            <button
                type="button"
                class="quest-category-heading"
                data-category-toggle="${category.type}"
                aria-expanded="${!isCollapsed}"
            >
                <span class="category-title">
                ${category.label}
            </span>

            <span class="category-count">
                ${categoryQuests.length}
            </span>

            <span class="category-chevron" aria-hidden="true">
                ${isCollapsed ? "▸" : "▾"}
            </span>
        </button>

        <div class="quest-list" ${isCollapsed ? "hidden" : ""}>
            ${categoryQuests
                .map(renderQuestCard)
                .join("")}
        </div>

    </section>
`;
    });

    content.innerHTML = questHTML;

    content
        .querySelectorAll("[data-category-toggle]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const category = button.dataset.categoryToggle;

                collapsedCategories[category] =
                    !collapsedCategories[category];

                localStorage.setItem(
                    "collapsedCategories",
                    JSON.stringify(collapsedCategories)
                );

                showQuests();
            });
        });


    /* =====================================================
       QUEST CARD CLICK HANDLERS
       ===================================================== */

    content
        .querySelectorAll("[data-quest-id]")
        .forEach(button => {

            button.addEventListener("click", () => {

                const quest = quests.find(
                    q => q.id === button.dataset.questId
                );

                if (quest) {
                    markQuestAsRead(quest);
                    renderQuestDetail(quest);
                }
            });

        });


    attachQuestControls();
}


/* =========================================================
   QUEST CONTROLS
   ========================================================= */

function setAllCategoriesCollapsed(collapsed) {
    const categories = ["main", "side", "companion"];

    categories.forEach(category => {
        collapsedCategories[category] = collapsed;
    });

    localStorage.setItem(
        "collapsedCategories",
        JSON.stringify(collapsedCategories)
    );

    showQuests();
}

function renderQuestControls() {
    return `
            <div class="quest-controls">

            <div class="quest-view-controls">
                <button type="button" id="collapse-all" class="quest-control-button">
                    Collapse All
                </button>

            <button type="button" id="expand-all" class="quest-control-button">
                Expand All
            </button>
            </div>

            <label class="quest-toggle">
                <input
                    type="checkbox"
                    id="hide-completed-toggle"
                    ${hideCompleted ? "checked" : ""}
                >

                <span class="quest-toggle-box">
                    ${hideCompleted ? "✓" : ""}
                </span>

                <span class="quest-toggle-text">
                    Hide Completed
                </span>
            </label>

            <div class="team-filter">
                <label
                    class="team-filter-label"
                    for="team-filter-select"
                >
                    PARTY
                </label>

                <div class="team-filter-select-wrapper">
                    <select
                        id="team-filter-select"
                        class="team-filter-select"
                    >
                        <option value="all" ${currentTeam === "all" ? "selected" : ""}>
                            All Teams
                        </option>

                        <option value="one" ${currentTeam === "one" ? "selected" : ""}>
                            Team One
                        </option>

                        <option value="two" ${currentTeam === "two" ? "selected" : ""}>
                            Team Two
                        </option>
                    </select>
                </div>
            </div>

        </div>
    `;
}



function attachQuestControls() {
    const toggle = document.getElementById(
        "hide-completed-toggle"
    );

    const teamFilter = document.getElementById(
        "team-filter-select"
    );

    const collapseAll = document.getElementById("collapse-all");
    const expandAll = document.getElementById("expand-all");

    if (toggle) {
        toggle.addEventListener("change", () => {
            hideCompleted = toggle.checked;

            localStorage.setItem(
                "hideCompleted",
                String(hideCompleted)
            );

            showQuests();
        });
    }

    if (teamFilter) {
        teamFilter.addEventListener("change", () => {
            currentTeam = teamFilter.value;
            showQuests();
        });
    }

    if (collapseAll) {
        collapseAll.addEventListener("click", () => {
            setAllCategoriesCollapsed(true);
        });
    }

    if (expandAll) {
        expandAll.addEventListener("click", () => {
            setAllCategoriesCollapsed(false);
        });
    }
}


/* =========================================================
   QUEST CARD
   ========================================================= */

function renderQuestCard(quest) {
    const category = formatCategory(quest.type);

    const team = quest.team !== "shared"
        ? ` · ${formatTeam(quest.team)}`
        : "";

    return `
        <button
            type="button"
            class="quest-card"
            data-quest-id="${escapeHTML(quest.id)}"
        >

            <div class="quest-card-top">

                <span class="quest-category">
                    ${escapeHTML(category + team)}
                </span>

                <span class="quest-status ${escapeHTML(quest.status)}">
                    ${escapeHTML(formatStatus(quest.status))}
                </span>

            </div>

            <h2 class="quest-card-title">
    <span>${escapeHTML(quest.title)}</span>

    ${hasUnreadUpdate(quest) ? `
        <span
            class="quest-notification"
            aria-label="Unread updates"
            title="Unread updates"
        ></span>
    ` : ""}
</h2>

            <p>
                ${escapeHTML(quest.description)}
            </p>

        </button>
    `;
}


/* =========================================================
   QUEST DETAIL
   ========================================================= */

async function renderQuestDetail(quest) {
    const content = document.getElementById("content");

    // Load map data on demand so quest-to-map links work even
    // when the user opens a quest before visiting the Map page.
    if (typeof loadMapLocations === "function") {
        try {
            await loadMapLocations();
        } catch (error) {
            console.error("Could not load locations for quest:", error);
        }
    }

    const questLocations = quest.status === "active"
        ? (quest.locations || [])
            .map(locationId => mapLocations.find(
                location => String(location.id) === String(locationId)
            ))
            .filter(Boolean)
        : [];

    /*
        Hide completed objectives when the global setting
        is enabled.
    */
    const visibleObjectives = hideCompleted
        ? quest.objectives.filter(
            objective => !objective.completed
        )
        : quest.objectives;

    content.innerHTML = `
        <button
            type="button"
            class="back-button"
            id="back-button"
        >
            ← Back to quests
        </button>

        <div class="quest-detail">

            <div class="quest-card-top">

                <span class="quest-category">
                    ${escapeHTML(
        formatCategory(quest.type)
    )}
                </span>

                <span class="quest-status ${escapeHTML(quest.status)}">
                    ${escapeHTML(
        formatStatus(quest.status)
    )}
                </span>

            </div>

            <div class="quest-detail-team">
                ${escapeHTML(
        formatTeam(quest.team)
    )}
            </div>

            <h2>
                ${escapeHTML(quest.title)}
            </h2>

            <p class="quest-description">
                ${escapeHTML(quest.description)}
            </p>

            <h3>
                Objectives
            </h3>

            <div class="objectives">

                ${visibleObjectives.length > 0
            ? visibleObjectives
                .map(renderObjective)
                .join("")
            : `
                            <p class="objectives-hidden">
                                All objectives have been completed.
                            </p>
                        `
        }

            </div>

            <h3>Relevant Locations</h3>

            <div class="quest-locations">
                ${questLocations.length
                    ? questLocations.map(location => `
                        <button
                            type="button"
                            class="quest-location-link"
                            data-quest-location="${escapeHTML(location.id)}"
                        >
                            <span class="quest-location-icon" aria-hidden="true">⌖</span>
                            <span>${escapeHTML(location.name)}</span>
                            <span class="quest-location-arrow" aria-hidden="true">→</span>
                        </button>
                    `).join("")
                    : `<p class="objectives-hidden">No currently relevant locations.</p>`
                }
            </div>

            <h3>
                Recent Developments
            </h3>

            <div class="developments">

                ${quest.developments &&
            quest.developments.length
            ? quest.developments
                .map(renderDevelopment)
                .join("")
            : `
                            <p>
                                No developments recorded.
                            </p>
                        `
        }

            </div>

        </div>
    `;

    document
        .getElementById("back-button")
        .addEventListener("click", () => {
            showQuests();
        });

    content.querySelectorAll("[data-quest-location]").forEach(button => {
        button.addEventListener("click", () => {
            openMapLocation(button.dataset.questLocation);
        });
    });
}


/* =========================================================
   OBJECTIVES
   ========================================================= */

function renderObjective(objective) {
    return `
        <div class="objective ${objective.completed ? "completed" : ""
        }">

            <span
                class="objective-checkbox"
                aria-hidden="true"
            >
                ${objective.completed ? "✓" : ""}
            </span>

            <span class="objective-text">
                ${escapeHTML(objective.text)}
            </span>

        </div>
    `;
}


/* =========================================================
   DEVELOPMENTS
   ========================================================= */

function renderDevelopment(development) {
    return `
        <div class="development">

            <span class="development-session">
                ${escapeHTML(development.session)}
            </span>

            <p>
                ${escapeHTML(development.text)}
            </p>

        </div>
    `;
}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatCategory(type) {
    const categories = {
        main: "Main Quest",
        side: "Side Quest",
        companion: "Companion Quest"
    };

    return categories[type] || "Quest";
}


function formatTeam(team) {
    const teams = {
        one: "Team One",
        two: "Team Two",
        shared: "Shared"
    };

    return teams[team] || "Shared";
}


function formatStatus(status) {
    return status.charAt(0).toUpperCase() +
        status.slice(1);
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(value) {
    return String(value).replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}
