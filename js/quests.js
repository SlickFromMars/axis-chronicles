let hideCompleted = false;

let collapsedCategories = {};

// Fallback team filter, used only if the rest of the site doesn't
// define a global `currentTeam`.
let questTeamFilterFallback = "all";


// Character data is read-only here; character profiles remain unchanged.
let questCharacterData = [];
let questCharacterDataPromise = null;


/* =========================================================
   CAMPAIGN CONFIGURATION
   ========================================================= */

const DEFAULT_QUEST_TEXT = {
    emptyState: "No quests have been recorded here yet.",

    controls: {
        collapseAll: "Collapse All",
        expandAll: "Expand All",
        hideCompleted: "Hide Completed"
    },

    teamFilter: {
        label: "PARTY",
        allLabel: "All Teams"
    },

    categories: {
        main: {
            label: "Main Quests",
            singular: "Main Quest"
        },
        side: {
            label: "Side Quests",
            singular: "Side Quest"
        },
        companion: {
            label: "Companion Quests",
            singular: "Companion Quest"
        }
    },

    statuses: {
        active: "Active",
        completed: "Completed"
    },

    labels: {
        characters: "CHARACTERS",
        relevantCharacters: "Relevant Characters",
        noCharacters: "No characters linked to this quest.",
        relevantLocations: "Relevant Locations",
        noLocations: "No currently relevant locations.",
        objectives: "Objectives",
        allObjectivesCompleted: "All objectives have been completed.",
        recentDevelopments: "Recent Developments",
        noDevelopments: "No developments recorded.",
        back: "← Back to quests",
        unreadUpdates: "Unread updates",
        relevantCharactersAria: "Relevant characters"
    }
};


function getQuestConfig() {

    if (
        typeof activeCampaign === "undefined" ||
        !activeCampaign
    ) {
        return {};
    }

    return activeCampaign.quests || {};
}


function getQuestText() {

    if (
        typeof activeCampaign === "undefined" ||
        !activeCampaign
    ) {
        return DEFAULT_QUEST_TEXT;
    }

    const configured =
        activeCampaign.text?.quests || {};

    return {

        ...DEFAULT_QUEST_TEXT,

        ...configured,

        controls: {
            ...DEFAULT_QUEST_TEXT.controls,
            ...(configured.controls || {})
        },

        teamFilter: {
            ...DEFAULT_QUEST_TEXT.teamFilter,
            ...(configured.teamFilter || {})
        },

        categories: {
            ...DEFAULT_QUEST_TEXT.categories,
            ...(configured.categories || {})
        },

        statuses: {
            ...DEFAULT_QUEST_TEXT.statuses,
            ...(configured.statuses || {})
        },

        labels: {
            ...DEFAULT_QUEST_TEXT.labels,
            ...(configured.labels || {})
        }

    };
}


function getQuestCategories() {

    const config =
        getQuestConfig();

    const text =
        getQuestText();

    const categoryOrder =
        Array.isArray(config.categoryOrder)
            ? config.categoryOrder
            : [
                "main",
                "side",
                "companion"
            ];

    return categoryOrder.map(
        type => {

            const category =
                text.categories[type] || {};

            return {

                type,

                label:
                    category.label ||
                    type.charAt(0).toUpperCase() +
                    type.slice(1),

                singular:
                    category.singular ||
                    category.label ||
                    type.charAt(0).toUpperCase() +
                    type.slice(1) +
                    " Quest"

            };
        }
    );
}


/* =========================================================
   CAMPAIGN TEAMS
   ========================================================= */

function getQuestTeams() {

    if (
        typeof activeCampaign !== "undefined" &&
        activeCampaign &&
        activeCampaign.party &&
        Array.isArray(activeCampaign.party.teams)
    ) {
        return activeCampaign.party.teams;
    }

    return [

        {
            id: "team-one",
            label: "Team One"
        },

        {
            id: "team-two",
            label: "Team Two"
        },

        {
            id: "shared",
            label: "Shared"
        }

    ];
}


/* =========================================================
   TEAM NORMALIZATION
   ========================================================= */

function normalizeQuestTeam(team) {

    const value =
        String(team ?? "shared")
            .trim()
            .toLowerCase();

    /*
        Accept both the original quest IDs
        and the newer campaign team IDs.
    */

    if (value === "shared") {
        return "shared";
    }

    /*
        Collapse formats like "one", "1", "team1", "team-1",
        "Team 1", "team_one" into one canonical id: "team-one".
    */

    const words = {
        one: "1",
        two: "2",
        three: "3",
        four: "4"
    };

    const stripped =
        value
            .replace(/^team/, "")
            .replace(/[^a-z0-9]/g, "");

    const digit =
        words[stripped] || stripped;

    const numberWords = {
        "1": "one",
        "2": "two",
        "3": "three",
        "4": "four"
    };

    if (numberWords[digit]) {
        return "team-" + numberWords[digit];
    }

    return value;
}


/* =========================================================
   SELECTED TEAM (team filter state)
   ========================================================= */

function getSelectedQuestTeam() {

    const raw =
        typeof currentTeam !== "undefined"
            ? currentTeam
            : questTeamFilterFallback;

    const value =
        String(raw ?? "all")
            .trim()
            .toLowerCase();

    if (
        value === "" ||
        value === "all"
    ) {
        return "all";
    }

    return normalizeQuestTeam(value);
}


function setSelectedQuestTeam(team) {

    // Keep the site-wide global in sync if it exists.
    if (typeof currentTeam !== "undefined") {
        currentTeam = team;
    }

    questTeamFilterFallback = team;
}


/* =========================================================
   TEAM RANK
   ========================================================= */

function getQuestTeamRank(team) {

    const normalizedTeam =
        normalizeQuestTeam(team);

    const teams =
        getQuestTeams();

    const index =
        teams.findIndex(
            configuredTeam =>
                normalizeQuestTeam(configuredTeam.id) ===
                normalizedTeam
        );

    /*
        Campaign-configured teams always sort
        before unknown/unconfigured teams.
    */

    return index === -1
        ? Number.MAX_SAFE_INTEGER
        : index;
}


/* =========================================================
   QUEST STATUS HELPERS
   ========================================================= */

function isQuestCompleted(quest) {

    if (!quest) {
        return false;
    }

    return (
        String(quest.status || "")
            .trim()
            .toLowerCase() === "completed"
    ) ||
        quest.completed === true;
}


/* =========================================================
   QUEST SORTING
   ========================================================= */

function compareQuests(a, b) {

    /*
        FIRST:
        Active quests before completed quests.
    */

    const completedA =
        isQuestCompleted(a) ? 1 : 0;

    const completedB =
        isQuestCompleted(b) ? 1 : 0;

    if (completedA !== completedB) {
        return completedA - completedB;
    }

    /*
        SECOND:
        Campaign-defined team order.
    */

    const teamA =
        getQuestTeamRank(a.team);

    const teamB =
        getQuestTeamRank(b.team);

    if (teamA !== teamB) {
        return teamA - teamB;
    }

    /*
        THIRD:
        Alphabetical by quest title.
    */

    return String(a.title || "").localeCompare(
        String(b.title || ""),
        undefined,
        {
            sensitivity: "base"
        }
    );
}


/* =========================================================
   QUEST PREFERENCES
   ========================================================= */

function initializeQuestPreferences() {

    const hideKey =
        getCampaignStorageKey("hideCompleted");

    const collapsedKey =
        getCampaignStorageKey("collapsedCategories");

    /*
        Preserve the old Breaking the Axis
        settings once when migrating.
    */

    const isDefaultCampaign =
        typeof campaignRegistry !== "undefined" &&
        campaignRegistry &&
        activeCampaign &&
        activeCampaign.id === campaignRegistry.defaultCampaign;

    if (
        isDefaultCampaign &&
        localStorage.getItem(hideKey) === null &&
        localStorage.getItem("hideCompleted") !== null
    ) {
        localStorage.setItem(
            hideKey,
            localStorage.getItem("hideCompleted")
        );
    }

    if (
        isDefaultCampaign &&
        localStorage.getItem(collapsedKey) === null &&
        localStorage.getItem("collapsedCategories") !== null
    ) {
        localStorage.setItem(
            collapsedKey,
            localStorage.getItem("collapsedCategories")
        );
    }

    hideCompleted =
        localStorage.getItem(hideKey) === "true";

    try {

        collapsedCategories =
            JSON.parse(
                localStorage.getItem(collapsedKey) || "{}"
            ) || {};

    } catch {

        collapsedCategories = {};
    }
}


/* =========================================================
   LOAD CHARACTER DATA
   ========================================================= */

async function loadQuestCharacterData() {

    if (questCharacterData.length) {
        return questCharacterData;
    }

    if (!questCharacterDataPromise) {

        const characterPath =
            getCampaignDataPath("characters");

        if (!characterPath) {

            console.error(
                "No character data path configured for this campaign."
            );

            return [];
        }

        questCharacterDataPromise =
            fetch(characterPath)

                .then(
                    response => {

                        if (!response.ok) {
                            throw new Error(
                                "Could not load characters"
                            );
                        }

                        return response.json();
                    }
                )

                .then(
                    characters => {

                        questCharacterData =
                            Array.isArray(characters)
                                ? characters
                                : [];

                        return questCharacterData;
                    }
                )

                .catch(
                    error => {

                        questCharacterDataPromise = null;

                        console.error(
                            "Could not load quest character names:",
                            error
                        );

                        return [];
                    }
                );
    }

    return questCharacterDataPromise;
}


// Turns an id like "the-book" into "The Book" when no character
// record is found, instead of showing the raw lowercase id.
function prettifyCharacterId(id) {

    return String(id ?? "")
        .replace(/[-_]+/g, " ")
        .trim()
        .replace(
            /\b\w/g,
            letter => letter.toUpperCase()
        );
}


function getQuestCharacters(quest) {

    const linkedCharacters =
        Array.isArray(quest.characters)
            ? quest.characters
            : [];

    return linkedCharacters

        .map(
            characterRef => {

                if (
                    characterRef &&
                    typeof characterRef === "object"
                ) {

                    const match =
                        questCharacterData.find(
                            character =>
                                String(character.id) ===
                                String(characterRef.id)
                        );

                    return (
                        match ||
                        {
                            id:
                                characterRef.id || "",

                            name:
                                characterRef.name ||
                                prettifyCharacterId(characterRef.id) ||
                                "Unknown character"
                        }
                    );
                }

                const match =
                    questCharacterData.find(
                        character =>
                            String(character.id) ===
                            String(characterRef)
                    );

                return (
                    match ||
                    {
                        id: characterRef,
                        name: prettifyCharacterId(characterRef)
                    }
                );
            }
        )

        .filter(
            character => character.name
        );
}


/* =========================================================
   QUEST UPDATE NOTIFICATIONS
   ========================================================= */

const QUEST_READ_KEY =
    "questUpdatesRead";


function getReadVersions() {

    const storageKey =
        getCampaignStorageKey(QUEST_READ_KEY);

    /*
        Preserve existing Breaking the Axis
        unread state during migration.
    */

    const isDefaultCampaign =
        typeof campaignRegistry !== "undefined" &&
        campaignRegistry &&
        activeCampaign &&
        activeCampaign.id === campaignRegistry.defaultCampaign;

    if (
        isDefaultCampaign &&
        localStorage.getItem(storageKey) === null &&
        localStorage.getItem(QUEST_READ_KEY) !== null
    ) {
        localStorage.setItem(
            storageKey,
            localStorage.getItem(QUEST_READ_KEY)
        );
    }

    try {

        return JSON.parse(
            localStorage.getItem(storageKey)
        ) || {};

    } catch {

        return {};
    }
}


function hasUnreadUpdate(quest) {

    const readVersions =
        getReadVersions();

    const currentVersion =
        quest.updateVersion || 0;

    return (
        currentVersion >
        (readVersions[quest.id] || 0)
    );
}


function markQuestAsRead(quest) {

    const readVersions =
        getReadVersions();

    readVersions[quest.id] =
        quest.updateVersion || 0;

    localStorage.setItem(
        getCampaignStorageKey(QUEST_READ_KEY),
        JSON.stringify(readVersions)
    );
}


/* =========================================================
   LOAD QUESTS
   ========================================================= */

async function loadQuests() {

    initializeQuestPreferences();

    const questPath =
        getCampaignDataPath("quests");

    if (!questPath) {

        throw new Error(
            "No quest data path configured for this campaign."
        );
    }

    const response =
        await fetch(questPath);

    if (!response.ok) {

        throw new Error(
            "Could not load quests"
        );
    }

    const quests =
        await response.json();

    if (!Array.isArray(quests)) {

        throw new Error(
            "quests.json must contain an array."
        );
    }

    return quests;
}


/* =========================================================
   QUEST LIST
   ========================================================= */

function renderQuestList(quests) {

    const content =
        document.getElementById("content");

    /*
        Filter by:
            1. Hide Completed toggle
            2. Selected team
               ("all" shows everything; shared quests
               stay visible for every team)
    */

    const selectedTeam =
        getSelectedQuestTeam();

    const visibleQuests =
        quests.filter(
            quest => {

                if (
                    hideCompleted &&
                    isQuestCompleted(quest)
                ) {
                    return false;
                }

                if (selectedTeam !== "all") {

                    const questTeam =
                        normalizeQuestTeam(quest.team);

                    if (
                        questTeam !== "shared" &&
                        questTeam !== selectedTeam
                    ) {
                        return false;
                    }
                }

                return true;
            }
        );

    console.log(
        "[quests] selected team:", selectedTeam,
        "| global currentTeam:",
        typeof currentTeam !== "undefined" ? currentTeam : "(not defined)",
        "| configured teams:",
        getQuestTeams().map(t => t.id),
        "| showing", visibleQuests.length, "of", quests.length
    );

    let questHTML =
        renderQuestControls();

    if (visibleQuests.length === 0) {

        const text =
            getQuestText();

        questHTML += `
            <p class="empty-state">
                ${escapeHTML(text.emptyState)}
            </p>
        `;

        content.innerHTML =
            questHTML;

        attachQuestControls();

        return;
    }

    const categories =
        getQuestCategories();

    categories.forEach(
        category => {

            /*
                Category is handled FIRST.
                Sorting inside the category is:
                    1. active/completed
                    2. team
                    3. alphabetical
            */

            const categoryQuests =
                visibleQuests
                    .filter(
                        quest =>
                            quest.type === category.type
                    )
                    .sort(compareQuests);

            if (categoryQuests.length === 0) {
                return;
            }

            const isCollapsed =
                collapsedCategories[category.type] === true;

            questHTML += `
                <section
                    class="quest-category ${isCollapsed ? "collapsed" : ""}"
                >

                    <button
                        type="button"
                        class="quest-category-heading"
                        data-category-toggle="${escapeHTML(category.type)}"
                        aria-expanded="${!isCollapsed}"
                    >

                        <span class="category-title">
                            ${escapeHTML(category.label)}
                        </span>

                        <span class="category-count">
                            ${categoryQuests.length}
                        </span>

                        <span
                            class="category-chevron"
                            aria-hidden="true"
                        >
                            ${isCollapsed ? "▸" : "▾"}
                        </span>

                    </button>

                    <div
                        class="quest-list"
                        ${isCollapsed ? "hidden" : ""}
                    >
                        ${categoryQuests
                    .map(renderQuestCard)
                    .join("")}
                    </div>

                </section>
            `;
        }
    );

    content.innerHTML =
        questHTML;

    content
        .querySelectorAll("[data-category-toggle]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const category =
                            button.dataset.categoryToggle;

                        collapsedCategories[category] =
                            !collapsedCategories[category];

                        localStorage.setItem(
                            getCampaignStorageKey("collapsedCategories"),
                            JSON.stringify(collapsedCategories)
                        );

                        showQuests();
                    }
                );
            }
        );

    /*
        QUEST CARD CLICK HANDLERS
    */

    content
        .querySelectorAll("[data-quest-id]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const quest =
                            quests.find(
                                q =>
                                    q.id === button.dataset.questId
                            );

                        if (quest) {

                            markQuestAsRead(quest);

                            renderQuestDetail(quest);
                        }
                    }
                );
            }
        );

    attachQuestControls();
}


/* =========================================================
   QUEST CONTROLS
   ========================================================= */

function setAllCategoriesCollapsed(collapsed) {

    const categories =
        getQuestCategories();

    categories.forEach(
        category => {
            collapsedCategories[category.type] =
                collapsed;
        }
    );

    localStorage.setItem(
        getCampaignStorageKey("collapsedCategories"),
        JSON.stringify(collapsedCategories)
    );

    showQuests();
}


function renderQuestControls() {

    const text =
        getQuestText();

    const config =
        getQuestConfig();

    const teams =
        getQuestTeams();

    const teamFilterEnabled =
        config.teamFilterEnabled !== false &&
        teams.length > 0;

    const selectedTeam =
        getSelectedQuestTeam();

    /*
        NOTE: id / for / value attributes must stay on a
        single line. Whitespace or line breaks inside them
        become part of the value and break lookups.
    */

    return `
        <div class="quest-controls">

            <div class="quest-view-controls">

                <button
                    type="button"
                    id="collapse-all"
                    class="quest-control-button"
                >
                    ${escapeHTML(text.controls.collapseAll)}
                </button>

                <button
                    type="button"
                    id="expand-all"
                    class="quest-control-button"
                >
                    ${escapeHTML(text.controls.expandAll)}
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
                    ${escapeHTML(text.controls.hideCompleted)}
                </span>

            </label>

            ${teamFilterEnabled
            ? `
                        <div class="team-filter">

                            <label
                                class="team-filter-label"
                                for="team-filter-select"
                            >
                                ${escapeHTML(text.teamFilter.label)}
                            </label>

                            <div class="team-filter-select-wrapper">

                                <select
                                    id="team-filter-select"
                                    class="team-filter-select"
                                >

                                    <option
                                        value="all"
                                        ${selectedTeam === "all" ? "selected" : ""}
                                    >
                                        ${escapeHTML(text.teamFilter.allLabel)}
                                    </option>

                                    ${teams
                .filter(
                    team =>
                        normalizeQuestTeam(team.id) !== "shared"
                )
                .map(
                    team => {

                        const teamId =
                            normalizeQuestTeam(team.id);

                        const selected =
                            selectedTeam === teamId;

                        return `
                                                    <option
                                                        value="${escapeHTML(teamId)}"
                                                        ${selected ? "selected" : ""}
                                                    >
                                                        ${escapeHTML(team.label)}
                                                    </option>
                                                `;
                    }
                )
                .join("")}

                                </select>

                            </div>

                        </div>
                    `
            : ""
        }

        </div>
    `;
}


function attachQuestControls() {

    const toggle =
        document.getElementById("hide-completed-toggle");

    const teamFilter =
        document.getElementById("team-filter-select");

    const collapseAll =
        document.getElementById("collapse-all");

    const expandAll =
        document.getElementById("expand-all");

    if (toggle) {

        toggle.addEventListener(
            "change",
            () => {

                hideCompleted =
                    toggle.checked;

                localStorage.setItem(
                    getCampaignStorageKey("hideCompleted"),
                    String(hideCompleted)
                );

                showQuests();
            }
        );
    }

    if (teamFilter) {

        teamFilter.addEventListener(
            "change",
            () => {

                setSelectedQuestTeam(teamFilter.value);

                showQuests();
            }
        );
    }

    if (collapseAll) {

        collapseAll.addEventListener(
            "click",
            () => {
                setAllCategoriesCollapsed(true);
            }
        );
    }

    if (expandAll) {

        expandAll.addEventListener(
            "click",
            () => {
                setAllCategoriesCollapsed(false);
            }
        );
    }
}


/* =========================================================
   QUEST CARD
   ========================================================= */

function renderQuestCard(quest) {

    const category =
        formatCategory(quest.type);

    const normalizedTeam =
        normalizeQuestTeam(quest.team);

    const team =
        normalizedTeam !== "shared"
            ? ` · ${formatTeam(quest.team)}`
            : "";

    const text =
        getQuestText();

    const characters =
        getQuestCharacters(quest);

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

                <span>
                    ${escapeHTML(quest.title)}
                </span>

                ${hasUnreadUpdate(quest)
            ? `
                            <span
                                class="quest-notification"
                                aria-label="${escapeHTML(text.labels.unreadUpdates)}"
                                title="${escapeHTML(text.labels.unreadUpdates)}"
                            ></span>
                        `
            : ""
        }

            </h2>

            <p>
                ${escapeHTML(quest.description)}
            </p>

            ${characters.length
            ? `
                        <div
                            class="quest-card-characters"
                            aria-label="${escapeHTML(text.labels.relevantCharactersAria)}"
                        >

                            <span class="quest-card-characters-label">
                                ${escapeHTML(text.labels.characters)}
                            </span>

                            ${characters
                .map(
                    character => `
                                        <span class="quest-character-chip">
                                            ${escapeHTML(character.name)}
                                        </span>
                                    `
                )
                .join("")}

                        </div>
                    `
            : ""
        }

        </button>
    `;
}


/* =========================================================
   QUEST DETAIL
   ========================================================= */

async function renderQuestDetail(quest) {

    const content =
        document.getElementById("content");

    const text =
        getQuestText();

    /*
        Load map data on demand so
        quest-to-map links work even
        before visiting Map.
    */

    if (typeof loadMapLocations === "function") {

        try {

            await loadMapLocations();

        } catch (error) {

            console.error(
                "Could not load locations for quest:",
                error
            );
        }
    }

    /*
        Only show locations that are currently relevant.

        Completed quests intentionally have no active
        locations displayed.
    */

    const questLocations =
        !isQuestCompleted(quest)

            ? (Array.isArray(quest.locations)
                ? quest.locations
                : []
            )
                .map(
                    locationId =>
                        mapLocations.find(
                            location =>
                                String(location.id) ===
                                String(locationId)
                        )
                )
                .filter(Boolean)

            : [];

    /*
        Only linked characters are shown.
    */

    const questCharacters =
        getQuestCharacters(quest);

    /*
        Objectives.
    */

    const objectives =
        Array.isArray(quest.objectives)
            ? quest.objectives
            : [];

    /*
        Hide completed objectives
        when enabled.
    */

    const visibleObjectives =
        hideCompleted
            ? objectives.filter(
                objective => !objective.completed
            )
            : objectives;

    /*
        Developments are only shown when there
        is actually something to display.
    */

    const developments =
        Array.isArray(quest.developments)
            ? quest.developments.filter(
                development =>
                    development &&
                    (
                        development.session ||
                        development.text
                    )
            )
            : [];

    content.innerHTML = `

        <button
            type="button"
            class="back-button"
            id="back-button"
        >
            ${escapeHTML(text.labels.back)}
        </button>

        <div class="quest-detail">

            <div class="quest-card-top">

                <span class="quest-category">
                    ${escapeHTML(formatCategory(quest.type))}
                </span>

                <span class="quest-status ${escapeHTML(quest.status)}">
                    ${escapeHTML(formatStatus(quest.status))}
                </span>

            </div>

            <div class="quest-detail-team">
                ${escapeHTML(formatTeam(quest.team))}
            </div>

            <h2>
                ${escapeHTML(quest.title)}
            </h2>

            <p class="quest-description">
                ${escapeHTML(quest.description)}
            </p>

            <h3>
                ${escapeHTML(text.labels.objectives)}
            </h3>

            <div class="objectives">

                ${visibleObjectives.length > 0
            ? visibleObjectives
                .map(renderObjective)
                .join("")
            : `
                            <p class="objectives-hidden">
                                ${escapeHTML(text.labels.allObjectivesCompleted)}
                            </p>
                        `
        }

            </div>

            ${questCharacters.length
            ? `
                        <h3>
                            ${escapeHTML(text.labels.relevantCharacters)}
                        </h3>

                        <div class="quest-detail-characters">

                            ${questCharacters
                .map(
                    character => `
                                        <button
                                            type="button"
                                            class="quest-detail-character"
                                            data-quest-character="${escapeHTML(character.id)}"
                                        >

                                            <span
                                                class="quest-character-marker"
                                                aria-hidden="true"
                                            >
                                                ✦
                                            </span>

                                            <span class="quest-detail-character-name">
                                                ${escapeHTML(character.name)}
                                            </span>

                                            <span
                                                class="quest-character-arrow"
                                                aria-hidden="true"
                                            >
                                                →
                                            </span>

                                        </button>
                                    `
                )
                .join("")}

                        </div>
                    `
            : ""
        }

            ${questLocations.length
            ? `
                        <h3>
                            ${escapeHTML(text.labels.relevantLocations)}
                        </h3>

                        <div class="quest-locations">

                            ${questLocations
                .map(
                    location => `
                                        <button
                                            type="button"
                                            class="quest-location-link"
                                            data-quest-location="${escapeHTML(location.id)}"
                                        >

                                            <span
                                                class="quest-location-icon"
                                                aria-hidden="true"
                                            >
                                                ⌖
                                            </span>

                                            <span>
                                                ${escapeHTML(location.name)}
                                            </span>

                                            <span
                                                class="quest-location-arrow"
                                                aria-hidden="true"
                                            >
                                                →
                                            </span>

                                        </button>
                                    `
                )
                .join("")}

                        </div>
                    `
            : ""
        }

            ${developments.length
            ? `
                        <h3>
                            ${escapeHTML(text.labels.recentDevelopments)}
                        </h3>

                        <div class="developments">

                            ${developments
                .map(renderDevelopment)
                .join("")}

                        </div>
                    `
            : ""
        }

        </div>
    `;

    document
        .getElementById("back-button")
        .addEventListener(
            "click",
            () => {
                showQuests();
            }
        );

    content
        .querySelectorAll("[data-quest-location]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openMapLocation(
                            button.dataset.questLocation
                        );

                    }
                );

            }
        );

    content
        .querySelectorAll("[data-quest-character]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const character =
                            questCharacterData.find(
                                character =>
                                    String(character.id) ===
                                    String(button.dataset.questCharacter)
                            );

                        if (!character) {

                            console.warn(
                                "Could not find linked character."
                            );

                            return;
                        }

                        /*
                            Make sure the character's
                            portrait has been resolved.
                        */

                        if (
                            typeof loadCharacterPortraits === "function" &&
                            typeof characterPortraits !== "undefined" &&
                            !characterPortraits[character.id]
                        ) {

                            await loadCharacterPortraits([character]);

                        }

                        if (typeof openCharacterProfile === "function") {
                            openCharacterProfile(character);
                        }

                    }
                );

            }
        );
}


/* =========================================================
   OBJECTIVES
   ========================================================= */

function isObjectiveFailed(objective) {

    // Objectives like "Dispose of Caedes Mortem. (FAILED)"
    // are marked completed in the data, but didn't succeed.
    return /\(\s*failed\s*\)/i.test(
        String(objective.text || "")
    );
}


function renderObjective(objective) {

    const failed =
        isObjectiveFailed(objective);

    // Strip the "(FAILED)" tag from the text; the ✗ icon
    // and .failed styling convey it instead.
    const displayText =
        failed
            ? String(objective.text)
                .replace(/\s*\(\s*failed\s*\)\s*/i, " ")
                .trim()
            : objective.text;

    const stateClass =
        failed
            ? "completed failed"
            : objective.completed
                ? "completed"
                : "";

    return `
        <div class="objective ${stateClass}">

            <span
                class="objective-checkbox"
                aria-hidden="true"
            >
                ${failed ? "✗" : objective.completed ? "✓" : ""}
            </span>

            <span class="objective-text">
                ${escapeHTML(displayText)}
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

    const text =
        getQuestText();

    const category =
        text.categories[type];

    if (category) {
        return (
            category.singular ||
            category.label
        );
    }

    return (
        String(type || "quest")
            .charAt(0)
            .toUpperCase() +
        String(type || "quest").slice(1)
    );
}


function formatTeam(team) {

    const normalizedTeam =
        normalizeQuestTeam(team);

    const match =
        getQuestTeams().find(
            configuredTeam =>
                normalizeQuestTeam(configuredTeam.id) ===
                normalizedTeam
        );

    if (match) {
        return match.label;
    }

    return "Shared";
}


function formatStatus(status) {

    const text =
        getQuestText();

    const normalizedStatus =
        String(status || "")
            .trim()
            .toLowerCase();

    if (
        text.statuses &&
        text.statuses[normalizedStatus]
    ) {
        return text.statuses[normalizedStatus];
    }

    if (!status) {
        return "";
    }

    return (
        String(status).charAt(0).toUpperCase() +
        String(status).slice(1)
    );
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "").replace(
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
