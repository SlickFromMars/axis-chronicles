/* =========================================================
   CHARACTER CONFIGURATION
   ========================================================= */

const DEFAULT_CHARACTER_CONFIG = {
    page: {
        eyebrow: "THE PEOPLE OF CAELORA",
        title: "Characters",
        description:
            "Heroes, allies, enemies, and others caught in the events of Breaking the Axis."
    },

    playerSection: {
        enabled: true,
        eyebrow: "THE CHOSEN FEW",
        title: "Player Characters",
        description:
            "The people at the heart of Breaking the Axis.",
        partyLabel: "PARTY"
    },

    categories: [
        {
            id: "gods",
            type: "god",
            label: "Gods and Deities",
            enabled: true
        },
        {
            id: "friends",
            type: "friend",
            label: "Friends",
            enabled: true
        },
        {
            id: "foes",
            type: "foe",
            label: "Foes",
            enabled: true
        }
    ]
};


function getCharacterConfig() {

    if (
        typeof activeCampaign === "undefined" ||
        !activeCampaign
    ) {
        return DEFAULT_CHARACTER_CONFIG;
    }

    const configured =
        activeCampaign.characters || {};

    const text =
        activeCampaign.text?.characters || {};

    return {

        ...DEFAULT_CHARACTER_CONFIG,

        ...configured,

        page: {
            ...DEFAULT_CHARACTER_CONFIG.page,
            ...(text.page || {})
        },

        playerSection: {
            ...DEFAULT_CHARACTER_CONFIG.playerSection,
            ...(configured.playerSection || {}),
            ...(text.players || {})
        },

        categories:
            Array.isArray(configured.categories)
                ? configured.categories
                : DEFAULT_CHARACTER_CONFIG.categories

    };
}


/* =========================================================
   CHARACTER UPDATE NOTIFICATIONS
   ========================================================= */

const CHARACTER_READ_KEY =
    "characterUpdatesRead";


function getCharacterReadStorageKey() {

    if (
        typeof getCampaignStorageKey ===
        "function"
    ) {
        return getCampaignStorageKey(
            CHARACTER_READ_KEY
        );
    }

    return CHARACTER_READ_KEY;
}

function resolveCharacterPortraitPath(
    portraitPath
) {

    if (!portraitPath) {
        return null;
    }

    return new URL(
        portraitPath,
        getCharacterPortraitManifestPath()
    ).href;
}


function getCharacterReadVersions() {

    const storageKey =
        getCharacterReadStorageKey();


    /*
        Preserve existing Breaking the Axis
        notification state when the campaign
        storage system is introduced.
    */

    if (
        typeof campaignRegistry !==
            "undefined" &&
        campaignRegistry &&
        typeof activeCampaign !==
            "undefined" &&
        activeCampaign &&
        activeCampaign.id ===
            campaignRegistry.defaultCampaign
    ) {

        const existingCampaignValue =
            localStorage.getItem(
                storageKey
            );

        const oldGlobalValue =
            localStorage.getItem(
                CHARACTER_READ_KEY
            );

        if (
            existingCampaignValue ===
                null &&
            oldGlobalValue !== null
        ) {
            localStorage.setItem(
                storageKey,
                oldGlobalValue
            );
        }
    }


    try {

        return JSON.parse(
            localStorage.getItem(
                storageKey
            )
        ) || {};

    } catch {

        return {};
    }
}


function hasUnreadCharacterUpdate(
    character
) {

    const readVersions =
        getCharacterReadVersions();

    const currentVersion =
        Number(
            character.updateVersion
        ) || 0;

    const readVersion =
        Number(
            readVersions[
                character.id
            ]
        ) || 0;

    return currentVersion >
        readVersion;
}


function markCharacterAsRead(
    character
) {

    const readVersions =
        getCharacterReadVersions();

    readVersions[
        character.id
    ] =
        Number(
            character.updateVersion
        ) || 0;


    localStorage.setItem(
        getCharacterReadStorageKey(),
        JSON.stringify(
            readVersions
        )
    );
}


/* =========================================================
   CHARACTER PORTRAITS
   ========================================================= */

const characterPortraits = {};

let characterPortraitManifestPromise =
    null;

let characterPortraitManifestCampaignId =
    null;


/* =========================================================
   PORTRAIT MANIFEST PATH
   ========================================================= */

function getCharacterPortraitManifestPath() {

    if (
        typeof getCampaignAssetPath ===
        "function"
    ) {

        const configuredPath =
            getCampaignAssetPath(
                "portraitManifest"
            );

        if (configuredPath) {
            return configuredPath;
        }
    }


    /*
        Fallback keeps the original
        Breaking the Axis structure usable
        if the campaign master does not
        define the manifest yet.
    */

    if (
        typeof activeCampaignRoot !== "undefined" &&
        activeCampaignRoot
    ) {
        return resolveCampaignPath(
            "assets/characters/portrait-manifest.json"
        );
    }

    return null;
}


/* =========================================================
   LOAD PORTRAIT MANIFEST
   ========================================================= */

async function loadCharacterPortraitManifest() {

    const campaignId =
        typeof activeCampaign !==
            "undefined" &&
        activeCampaign
            ? activeCampaign.id
            : "default";


    /*
        Clear the cached manifest if the
        active campaign changes.
    */

    if (
        characterPortraitManifestCampaignId !==
        campaignId
    ) {

        characterPortraitManifestPromise =
            null;

        Object.keys(
            characterPortraits
        ).forEach(
            key => {
                delete characterPortraits[
                    key
                ];
            }
        );

        characterPortraitManifestCampaignId =
            campaignId;
    }


    if (
        !characterPortraitManifestPromise
    ) {

        characterPortraitManifestPromise =
            fetch(
                getCharacterPortraitManifestPath()
            )
                .then(response => {

                    if (!response.ok) {

                        throw new Error(
                            "Could not load character portrait manifest"
                        );
                    }

                    return response.json();
                })
                .catch(error => {

                    characterPortraitManifestPromise =
                        null;

                    throw error;
                });
    }


    return characterPortraitManifestPromise;
}


/* =========================================================
   FIND CHARACTER PORTRAIT
   ========================================================= */

async function findCharacterPortrait(
    character
) {

    if (
        !character ||
        !character.id
    ) {
        return null;
    }


    /*
        Avoid looking up the same character
        more than once.
    */

    if (
        Object.prototype.hasOwnProperty.call(
            characterPortraits,
            character.id
        )
    ) {
        return characterPortraits[
            character.id
        ];
    }


    const manifest =
        await loadCharacterPortraitManifest();


    const portrait =
    resolveCharacterPortraitPath(
        manifest[character.id]
    );


    characterPortraits[
        character.id
    ] = portrait;


    return portrait;
}


/* =========================================================
   LOAD ALL CHARACTER PORTRAITS
   ========================================================= */

async function loadCharacterPortraits(
    characters
) {

    const manifest =
        await loadCharacterPortraitManifest();


    characters.forEach(
        character => {

            if (
                !character ||
                !character.id
            ) {
                return;
            }


            characterPortraits[
    character.id
] =
    resolveCharacterPortraitPath(
        manifest[character.id]
    );
        }
    );
}


/* =========================================================
   LOAD CHARACTERS
   ========================================================= */

async function loadCharacters() {

    const characterPath =
        typeof getCampaignDataPath ===
            "function"
            ? getCampaignDataPath(
                "characters"
            )
            : "data/characters.json";


    if (!characterPath) {

        throw new Error(
            "No character data path configured for this campaign."
        );
    }


    const response =
        await fetch(
            characterPath
        );


    if (!response.ok) {

        throw new Error(
            "Could not load characters"
        );
    }


    return await response.json();
}


/* =========================================================
   SHOW CHARACTERS
   ========================================================= */

async function showCharacters() {

    const content =
        document.getElementById(
            "content"
        );


    if (!content) {
        return;
    }


    content.innerHTML = `
        <p class="loading">
            Loading characters...
        </p>
    `;


    try {

        const characters =
            await loadCharacters();


        await loadCharacterPortraits(
            characters
        );


        renderCharacterList(
            characters
        );


    } catch (error) {

        console.error(error);


        content.innerHTML = `
            <p class="error">
                The characters could not be loaded.
                Check your character data file
                and try again.
            </p>
        `;
    }
}


/* =========================================================
   RENDER CHARACTER LIST
   ========================================================= */

function renderCharacterList(
    characters
) {

    const content =
        document.getElementById(
            "content"
        );


    if (!content) {
        return;
    }


    const config =
        getCharacterConfig();


    const players =
        characters.filter(
            character =>
                character.type ===
                "player"
        );


    const configuredCategories =
        config.categories
            .filter(
                category =>
                    category.enabled !== false
            );


    content.innerHTML = `
        <section class="characters-page">

            <!-- =========================================
                 PAGE HEADER
                 ========================================= -->

            <div class="characters-heading">

                <div class="eyebrow">
                    ${escapeHTML(
                        config.page.eyebrow
                    )}
                </div>

                <h1>
                    ${escapeHTML(
                        config.page.title
                    )}
                </h1>

                <p>
                    ${escapeHTML(
                        config.page.description
                    )}
                </p>

            </div>


            <!-- =========================================
                 PLAYER CHARACTERS
                 ========================================= -->

            ${
                config.playerSection.enabled !== false
                    ? renderPlayerCharacters(
                        players
                    )
                    : ""
            }


            <!-- =========================================
                 OTHER CHARACTERS
                 ========================================= -->

            ${
                configuredCategories
                    .map(category => {

                        const categoryCharacters =
                            characters.filter(
                                character =>
                                    character.type ===
                                    category.type
                            );


                        return renderCharacterCategory(
                            category.label,
                            categoryCharacters,
                            category.id
                        );
                    })
                    .join("")
            }

        </section>
    `;


    /* =====================================================
       CHARACTER CARDS
       ===================================================== */

    content
        .querySelectorAll(
            "[data-character-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const character =
                            characters.find(
                                character =>
                                    character.id ===
                                    button.dataset
                                        .characterId
                            );


                        if (!character) {
                            return;
                        }


                        markCharacterAsRead(
                            character
                        );


                        const notification =
                            button.querySelector(
                                ".character-notification"
                            );


                        if (notification) {
                            notification.remove();
                        }


                        openCharacterProfile(
                            character
                        );
                    }
                );
            }
        );


    /* =====================================================
       COLLAPSIBLE CATEGORIES
       ===================================================== */

    content
        .querySelectorAll(
            "[data-character-category]"
        )
        .forEach(
            section => {

                const toggle =
                    section.querySelector(
                        ".character-category-toggle"
                    );


                const grid =
                    section.querySelector(
                        ".character-grid"
                    );


                if (
                    !toggle ||
                    !grid
                ) {
                    return;
                }


                toggle.addEventListener(
                    "click",
                    () => {

                        const isCollapsed =
                            section.classList.toggle(
                                "collapsed"
                            );


                        toggle.setAttribute(
                            "aria-expanded",
                            String(
                                !isCollapsed
                            )
                        );


                        grid.setAttribute(
                            "aria-hidden",
                            String(
                                isCollapsed
                            )
                        );
                    }
                );
            }
        );
}


/* =========================================================
   PLAYER CHARACTERS
   ========================================================= */

function renderPlayerCharacters(
    players
) {

    if (
        players.length === 0
    ) {
        return "";
    }


    const config =
        getCharacterConfig();


    const playerSection =
        config.playerSection;


    const teams =
        getCharacterTeams();


    const renderedTeams = [];


    const assignedCharacterIds =
        new Set();


    teams.forEach(
        team => {

            const teamCharacters =
                players.filter(
                    character => {

                        const matches =
                            String(
                                character.team
                            ) ===
                            String(
                                team.id
                            );


                        if (matches) {

                            assignedCharacterIds.add(
                                character.id
                            );
                        }


                        return matches;
                    }
                );


            if (
                teamCharacters.length === 0
            ) {
                return;
            }


            renderedTeams.push(
                renderPlayerTeam(
                    team.label,
                    teamCharacters,
                    team.id,
                    team.description ||
                        "",
                    team.symbol ||
                        "◆"
                )
            );
        }
    );


    /*
        Preserve the original behavior:
        characters with no recognized team
        fall into Shared when Shared exists.
    */

    const unassignedPlayers =
        players.filter(
            character =>
                !assignedCharacterIds.has(
                    character.id
                )
        );


    if (
        unassignedPlayers.length > 0
    ) {

        const sharedTeam =
            teams.find(
                team =>
                    team.id ===
                    "shared"
            );


        renderedTeams.push(
            renderPlayerTeam(
                sharedTeam
                    ? sharedTeam.label
                    : "Shared",
                unassignedPlayers,
                sharedTeam
                    ? sharedTeam.id
                    : "shared",
                sharedTeam
                    ? (
                        sharedTeam.description ||
                        ""
                    )
                    : "Characters connected to both teams.",
                sharedTeam
                    ? (
                        sharedTeam.symbol ||
                        "◆"
                    )
                    : "◆"
            )
        );
    }


    return `
        <section class="player-characters-section">

            <div class="player-characters-heading">

                <div>

                    <div class="eyebrow">
                        ${escapeHTML(
                            playerSection.eyebrow
                        )}
                    </div>

                    <h2>
                        ${escapeHTML(
                            playerSection.title
                        )}
                    </h2>

                    <p>
                        ${escapeHTML(
                            playerSection.description
                        )}
                    </p>

                </div>

                <div
                    class="player-characters-mark"
                    aria-hidden="true"
                >
                    ✦
                </div>

            </div>


            <div class="player-team-sections">

                ${renderedTeams.join("")}

            </div>

        </section>
    `;
}


/* =========================================================
   PLAYER TEAMS
   ========================================================= */

function getCharacterTeams() {

    if (
        typeof activeCampaign !==
            "undefined" &&
        activeCampaign &&
        activeCampaign.party &&
        Array.isArray(
            activeCampaign.party.teams
        )
    ) {

        return activeCampaign.party.teams;
    }


    return [
        {
            id: "team-one",
            label: "Team One",
            symbol: "I",
            description: ""
        },

        {
            id: "team-two",
            label: "Team Two",
            symbol: "II",
            description: ""
        },

        {
            id: "shared",
            label: "Shared",
            symbol: "◆",
            description:
                "Characters connected to both teams."
        }
    ];
}


/* =========================================================
   PLAYER TEAM
   ========================================================= */

function renderPlayerTeam(
    title,
    characters,
    teamId,
    description,
    symbol
) {

    if (
        characters.length === 0
    ) {
        return "";
    }


    return `
        <section
            class="
                player-team
                ${escapeHTML(
                    getSafeTeamClass(
                        teamId
                    )
                )}
            "
            data-player-team="${escapeHTML(
                teamId
            )}"
        >

            <div class="player-team-header">

                <div class="player-team-heading">

                    <span
                        class="player-team-symbol"
                    >
                        ${escapeHTML(
                            symbol
                        )}
                    </span>


                    <div>

                        <div
                            class="player-team-eyebrow"
                        >
                            ${escapeHTML(
                                getCharacterConfig()
                                    .playerSection
                                    .partyLabel
                            )}
                        </div>


                        <h3>
                            ${escapeHTML(
                                title
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                description
                            )}
                        </p>

                    </div>

                </div>


                <span
                    class="player-team-count"
                >
                    ${characters.length}
                </span>

            </div>


            <div
                class="player-character-grid"
            >

                ${characters
                    .map(
                        renderPlayerCard
                    )
                    .join("")}

            </div>

        </section>
    `;
}


/* =========================================================
   SAFE TEAM CLASS
   ========================================================= */

function getSafeTeamClass(
    teamId
) {

    return String(
        teamId ||
        "team"
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9_-]+/g,
            "-"
        );
}


/* =========================================================
   PLAYER CARD
   ========================================================= */

function renderPlayerCard(
    character
) {

    const portraitPath =
        characterPortraits[
            character.id
        ];


    const portrait =
        portraitPath
            ? `
                <img
                    src="${escapeHTML(
                        portraitPath
                    )}"
                    alt="${escapeHTML(
                        character.name ||
                        "Unknown"
                    )}"
                    class="character-card-portrait"
                    loading="lazy"
                >
            `
            : `
                <div
                    class="
                        character-card-portrait
                        unknown
                    "
                    aria-label="Portrait unknown"
                >
                    ?
                </div>
            `;


    const name =
        character.name ||
        "Unknown";


    const subtitle =
        getCharacterSubtitle(
            character
        );


    const notification =
        hasUnreadCharacterUpdate(
            character
        )
            ? `
                <span
                    class="character-notification"
                    aria-label="Unread updates"
                    title="Unread updates"
                ></span>
            `
            : "";


    return `
        <button
            type="button"
            class="
                character-card
                player-character-card
            "
            data-character-id="${escapeHTML(
                character.id
            )}"
        >

            <div class="character-card-image">

                ${portrait}


                <div
                    class="player-card-aura"
                    aria-hidden="true"
                ></div>


                <div
                    class="player-card-rank"
                    aria-hidden="true"
                >
                    PLAYER
                </div>


                ${notification}

            </div>


            <div
                class="character-card-content"
            >

                <h3
                    class="character-card-title"
                >
                    ${escapeHTML(
                        name
                    )}
                </h3>


                <p
                    class="character-card-role"
                >
                    ${escapeHTML(
                        subtitle
                    )}
                </p>


                <span
                    class="player-card-team"
                >
                    ${escapeHTML(
                        formatCharacterTeam(
                            character.team
                        )
                    )}
                </span>

            </div>

        </button>
    `;
}


/* =========================================================
   NORMAL CHARACTER CATEGORY
   ========================================================= */

function renderCharacterCategory(
    title,
    characters,
    categoryId
) {

    if (
        characters.length === 0
    ) {
        return "";
    }


    return `
        <section
            class="character-category"
            data-character-category="${escapeHTML(
                categoryId
            )}"
        >

            <button
                type="button"
                class="character-category-toggle"
                aria-expanded="true"
                aria-controls="character-grid-${escapeHTML(
                    categoryId
                )}"
            >

                <span
                    class="character-category-heading"
                >

                    <span
                        class="character-category-title"
                    >
                        ${escapeHTML(
                            title
                        )}
                    </span>


                    <span
                        class="character-category-count"
                    >
                        ${characters.length}
                    </span>

                </span>


                <span
                    class="character-category-chevron"
                    aria-hidden="true"
                >
                    ◆
                </span>

            </button>


            <div
                class="character-grid"
                id="character-grid-${escapeHTML(
                    categoryId
                )}"
            >

                ${characters
                    .map(
                        renderCharacterCard
                    )
                    .join("")}

            </div>

        </section>
    `;
}


/* =========================================================
   NORMAL CHARACTER CARD
   ========================================================= */

function renderCharacterCard(
    character
) {

    const portraitPath =
        characterPortraits[
            character.id
        ];


    const portrait =
        portraitPath
            ? `
                <img
                    src="${escapeHTML(
                        portraitPath
                    )}"
                    alt="${escapeHTML(
                        character.name ||
                        "Unknown"
                    )}"
                    class="character-card-portrait"
                    loading="lazy"
                >
            `
            : `
                <div
                    class="
                        character-card-portrait
                        unknown
                    "
                    aria-label="Portrait unknown"
                >
                    ?
                </div>
            `;


    const name =
        character.name ||
        "Unknown";


    const subtitle =
        getCharacterSubtitle(
            character
        );


    const notification =
        hasUnreadCharacterUpdate(
            character
        )
            ? `
                <span
                    class="character-notification"
                    aria-label="Unread updates"
                    title="Unread updates"
                ></span>
            `
            : "";


    return `
        <button
            type="button"
            class="character-card"
            data-character-id="${escapeHTML(
                character.id
            )}"
        >

            <div
                class="character-card-image"
            >

                ${portrait}

                ${notification}

            </div>


            <div
                class="character-card-content"
            >

                <h3
                    class="character-card-title"
                >
                    ${escapeHTML(
                        name
                    )}
                </h3>


                <p
                    class="character-card-role"
                >
                    ${escapeHTML(
                        subtitle
                    )}
                </p>

            </div>

        </button>
    `;
}


/* =========================================================
   CHARACTER SUBTITLE
   ========================================================= */

function getCharacterSubtitle(
    character
) {

    const race =
        character.race ||
        "Unknown";


    const characterClass =
        character.class ||
        "Unknown";


    return `${race} • ${characterClass}`;
}


/* =========================================================
   OPEN CHARACTER PROFILE
   ========================================================= */

function openCharacterProfile(
    character
) {

    const existingProfile =
        document.getElementById(
            "character-profile"
        );


    if (existingProfile) {
        existingProfile.remove();
    }


    const portraitPath =
        characterPortraits[
            character.id
        ];


    const portrait =
        portraitPath
            ? `
                <img
                    src="${escapeHTML(
                        portraitPath
                    )}"
                    alt="${escapeHTML(
                        character.name ||
                        "Unknown"
                    )}"
                    class="character-profile-portrait"
                >
            `
            : `
                <div
                    class="
                        character-profile-portrait
                        unknown
                    "
                    aria-label="Portrait unknown"
                >
                    ?
                </div>
            `;


    /* =====================================================
       RELEVANT QUESTS
       ===================================================== */

    const relevantQuests =
        (
            Array.isArray(allQuests)
                ? allQuests
                : []
        )
            .filter(
                quest =>
                    Array.isArray(
                        quest.characters
                    ) &&
                    quest.characters.some(
                        characterRef => {

                            const id =
                                characterRef &&
                                typeof characterRef ===
                                    "object"
                                    ? characterRef.id
                                    : characterRef;


                            return String(
                                id
                            ) ===
                            String(
                                character.id
                            );
                        }
                    )
            );


    const relevantQuestsSection = `
        <section
            class="character-profile-quests"
        >

            <h3>
                Relevant Quests
            </h3>


            ${
                relevantQuests.length
                    ? `
                        <div
                            class="
                                character-profile-quest-list
                            "
                        >

                            ${relevantQuests
                                .map(
                                    quest =>
                                        `
                                        <button
                                            type="button"
                                            class="
                                                character-profile-quest
                                            "
                                            data-character-quest-id="${escapeHTML(
                                                quest.id
                                            )}"
                                        >

                                            <span
                                                class="
                                                    character-profile-quest-copy
                                                "
                                            >

                                                <strong>
                                                    ${escapeHTML(
                                                        quest.title ||
                                                        "Untitled Quest"
                                                    )}
                                                </strong>

                                                <span>
                                                    ${escapeHTML(
                                                        quest.status ||
                                                        "Status unknown"
                                                    )}
                                                </span>

                                            </span>


                                            <span
                                                class="
                                                    character-profile-quest-arrow
                                                "
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
                    : `
                        <p
                            class="
                                character-profile-quests-empty
                            "
                        >
                            No quests are currently linked
                            to this character.
                        </p>
                    `
            }

        </section>
    `;


    /* =====================================================
       NOTES
       ===================================================== */

    const hasNotes =
        Array.isArray(
            character.notes
        ) &&
        character.notes.length > 0;


    const notes =
        hasNotes
            ? character.notes
                .map(
                    note => `
                        <li>
                            ${escapeHTML(
                                note
                            )}
                        </li>
                    `
                )
                .join("")
            : "";


    const notesSection =
        hasNotes
            ? `
                <div
                    class="character-profile-notes"
                >

                    <h3>
                        Known Information
                    </h3>


                    <ul>
                        ${notes}
                    </ul>

                </div>
            `
            : "";


    /* =====================================================
       BASIC INFORMATION
       ===================================================== */

    const quote =
        character.quote
            ? `
                <blockquote
                    class="
                        character-profile-quote
                    "
                >
                    "${escapeHTML(
                        character.quote
                    )}"
                </blockquote>
            `
            : "";


    const name =
        character.name ||
        "Unknown";


    const description =
        character.description ||
        "Unknown";


    const status =
        character.status ||
        "Unknown";


    const race =
        character.race ||
        "Unknown";


    const characterClass =
        character.class ||
        "Unknown";


    const type =
        formatCharacterType(
            character.type
        );


    const infoLabel =
        getCharacterInfoLabel(
            character
        );


    const infoValue =
        getCharacterInfoValue(
            character
        );


    /* =====================================================
       PROFILE OVERLAY
       ===================================================== */

    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "character-profile";


    overlay.id =
        "character-profile";


    overlay.innerHTML = `
        <div
            class="
                character-profile-card
                ${
                    character.type ===
                    "player"
                        ? "player-profile-card"
                        : ""
                }
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="character-profile-name"
        >

            <button
                type="button"
                class="character-profile-close"
                id="character-profile-close"
                aria-label="Close character profile"
            >
                ×
            </button>


            <div
                class="character-profile-header"
            >

                ${portrait}


                <div
                    class="character-profile-heading"
                >

                    <div class="eyebrow">
                        ${escapeHTML(
                            type
                        )}
                    </div>


                    ${
                        character.type ===
                        "player"
                            ? `
                                <div
                                    class="
                                        player-profile-team
                                    "
                                >
                                    ${escapeHTML(
                                        formatCharacterTeam(
                                            character.team
                                        )
                                    )}
                                </div>
                            `
                            : ""
                    }


                    <h2
                        id="character-profile-name"
                    >
                        ${escapeHTML(
                            name
                        )}
                    </h2>


                    <p>
                        ${escapeHTML(
                            getCharacterSubtitle(
                                character
                            )
                        )}
                    </p>

                </div>

            </div>


            <div
                class="character-profile-body"
            >

                <div
                    class="character-profile-status"
                >
                    ${escapeHTML(
                        status
                    )}
                </div>


                <p
                    class="
                        character-profile-description
                    "
                >
                    ${escapeHTML(
                        description
                    )}
                </p>


                ${quote}


                <div
                    class="
                        character-profile-details
                    "
                >

                    <div>

                        <span>
                            Race
                        </span>


                        <strong>
                            ${escapeHTML(
                                race
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Class
                        </span>


                        <strong>
                            ${escapeHTML(
                                characterClass
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            ${escapeHTML(
                                infoLabel
                            )}
                        </span>


                        <strong>
                            ${escapeHTML(
                                infoValue
                            )}
                        </strong>

                    </div>

                </div>


                ${relevantQuestsSection}


                ${notesSection}

            </div>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    overlay
        .querySelectorAll(
            "[data-character-quest-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const quest =
                            (
                                Array.isArray(
                                    allQuests
                                )
                                    ? allQuests
                                    : []
                            ).find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        button.dataset
                                            .characterQuestId
                                    )
                            );


                        if (!quest) {
                            return;
                        }


                        closeCharacterProfile();


                        if (
                            typeof navigateTo ===
                            "function"
                        ) {

                            currentTeam =
                                "all";


                            navigateTo(
                                "quests"
                            );
                        }


                        if (
                            typeof renderQuestDetail ===
                            "function"
                        ) {

                            renderQuestDetail(
                                quest
                            );
                        }
                    }
                );
            }
        );


    const closeButton =
        document.getElementById(
            "character-profile-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeCharacterProfile
        );
    }


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeCharacterProfile();
            }
        }
    );


    document.addEventListener(
        "keydown",
        handleCharacterProfileEscape
    );


    document.body.classList.add(
        "character-profile-open"
    );
}


/* =========================================================
   CHARACTER INFO LABEL
   ========================================================= */

function getCharacterInfoLabel(
    character
) {

    if (
        character.type ===
        "player"
    ) {

        return "Team";
    }


    return "Location";
}


/* =========================================================
   CHARACTER INFO VALUE
   ========================================================= */

function getCharacterInfoValue(
    character
) {

    if (
        character.type ===
        "player"
    ) {

        return formatCharacterTeam(
            character.team
        );
    }


    return character.location ||
        "Unknown";
}


/* =========================================================
   CLOSE CHARACTER PROFILE
   ========================================================= */

function closeCharacterProfile() {

    const profile =
        document.getElementById(
            "character-profile"
        );


    if (profile) {
        profile.remove();
    }


    document.body.classList.remove(
        "character-profile-open"
    );


    document.removeEventListener(
        "keydown",
        handleCharacterProfileEscape
    );
}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

function handleCharacterProfileEscape(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        closeCharacterProfile();
    }
}


/* =========================================================
   CHARACTER TYPE
   ========================================================= */

function formatCharacterType(
    type
) {

    switch (type) {

        case "player":
            return "Player Character";

        case "god":
            return "God/Deity";

        case "friend":
            return "Friend";

        case "foe":
            return "Foe";

        default:
            return "Unknown";
    }
}


/* =========================================================
   CHARACTER TEAM
   ========================================================= */

function formatCharacterTeam(
    team
) {

    const configuredTeam =
        getCharacterTeams().find(
            configured =>
                String(
                    configured.id
                ) ===
                String(team)
        );


    if (
        configuredTeam
    ) {

        return configuredTeam.label;
    }


    return "Unknown";
}
