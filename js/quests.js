let hideCompleted =
    localStorage.getItem("hideCompleted") === "true";


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

        questHTML += `
            <section class="quest-category">

                <h2 class="quest-category-heading">
                    ${category.label}
                </h2>

                <div class="quest-list">
                    ${categoryQuests
                .map(renderQuestCard)
                .join("")}
                </div>

            </section>
        `;
    });

    content.innerHTML = questHTML;


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
                    renderQuestDetail(quest);
                }
            });

        });


    attachQuestControls();
}


/* =========================================================
   QUEST CONTROLS
   ========================================================= */

function renderQuestControls() {
    return `
        <div class="quest-controls">

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

        </div>
    `;
}


function attachQuestControls() {
    const toggle = document.getElementById(
        "hide-completed-toggle"
    );

    if (!toggle) {
        return;
    }

    toggle.addEventListener("change", () => {

        hideCompleted = toggle.checked;

        /*
            Save the setting so it survives page refreshes.
        */
        localStorage.setItem(
            "hideCompleted",
            String(hideCompleted)
        );

        /*
            Re-render the quest list.
        */
        showQuests();
    });
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

            <h2>
                ${escapeHTML(quest.title)}
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

function renderQuestDetail(quest) {
    const content = document.getElementById("content");

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
