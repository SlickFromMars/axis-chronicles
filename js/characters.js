/* =========================================================
   CHARACTER UPDATE NOTIFICATIONS
   ========================================================= */

const CHARACTER_READ_KEY = "characterUpdatesRead";


function getCharacterReadVersions() {

    try {
        return JSON.parse(
            localStorage.getItem(
                CHARACTER_READ_KEY
            )
        ) || {};

    } catch {
        return {};
    }
}


function hasUnreadCharacterUpdate(character) {

    const readVersions =
        getCharacterReadVersions();

    const currentVersion =
        Number(character.updateVersion) || 0;

    const readVersion =
        Number(
            readVersions[character.id]
        ) || 0;

    return currentVersion > readVersion;
}


function markCharacterAsRead(character) {

    const readVersions =
        getCharacterReadVersions();

    readVersions[character.id] =
        Number(character.updateVersion) || 0;

    localStorage.setItem(
        CHARACTER_READ_KEY,
        JSON.stringify(readVersions)
    );
}


/* =========================================================
   CHARACTER PORTRAITS
   ========================================================= */

const CHARACTER_IMAGE_PATH =
    "assets/images/characters/";

const CHARACTER_IMAGE_EXTENSIONS = [
    "png",
    "jpg",
    "jpeg",
    "webp"
];


/*
 * Stores the portrait path for each character.
 *
 * Example:
 *
 * quill -> assets/images/characters/quill.png
 *
 * If no matching image exists, the value is null.
 */
const characterPortraits = {};


async function findCharacterPortrait(character) {

    if (!character.id) {
        return null;
    }

    for (
        const extension
        of CHARACTER_IMAGE_EXTENSIONS
    ) {

        const path =
            `${CHARACTER_IMAGE_PATH}${character.id}.${extension}`;

        const exists =
            await checkImageExists(path);

        if (exists) {
            return path;
        }
    }

    return null;
}


function checkImageExists(path) {

    return new Promise(resolve => {

        const image =
            new Image();

        image.onload = () => {
            resolve(true);
        };

        image.onerror = () => {
            resolve(false);
        };

        image.src = path;
    });
}


async function loadCharacterPortraits(
    characters
) {

    const checks =
        characters.map(
            async character => {

                const portrait =
                    await findCharacterPortrait(
                        character
                    );

                characterPortraits[
                    character.id
                ] = portrait;
            }
        );

    await Promise.all(checks);
}


/* =========================================================
   LOAD CHARACTERS
   ========================================================= */

async function loadCharacters() {

    const response =
        await fetch(
            "data/characters.json"
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

    content.innerHTML = `
        <p class="loading">
            Loading characters...
        </p>
    `;

    try {

        const characters =
            await loadCharacters();

        /*
         * Find all portraits before rendering.
         */
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

    const players =
        characters.filter(
            character =>
                character.type === "player"
        );

    const friends =
        characters.filter(
            character =>
                character.type === "friend"
        );

    const foes =
        characters.filter(
            character =>
                character.type === "foe"
        );

    content.innerHTML = `
        <section class="characters-page">

            <div class="characters-heading">

                <div class="eyebrow">
                    THE PEOPLE OF CAELORA
                </div>

                <h1>
                    Characters
                </h1>

                <p>
                    Heroes, allies, enemies, and others
                    caught in the events of
                    Breaking the Axis.
                </p>

            </div>

            ${renderCharacterCategory(
        "Player Characters",
        players,
        "players"
    )}

            ${renderCharacterCategory(
        "Friends",
        friends,
        "friends"
    )}

            ${renderCharacterCategory(
        "Foes",
        foes,
        "foes"
    )}

        </section>
    `;


    /* =====================================================
       CHARACTER CARDS
       ===================================================== */

    content
        .querySelectorAll(
            "[data-character-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const character =
                        characters.find(
                            character =>
                                character.id ===
                                button.dataset.characterId
                        );

                    if (!character) {
                        return;
                    }

                    /*
                     * Mark the current version
                     * as read.
                     */
                    markCharacterAsRead(
                        character
                    );

                    /*
                     * Remove the red notification
                     * immediately.
                     */
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
        });


    /* =====================================================
       COLLAPSIBLE CATEGORIES
       ===================================================== */

    content
        .querySelectorAll(
            "[data-character-category]"
        )
        .forEach(section => {

            const toggle =
                section.querySelector(
                    ".character-category-toggle"
                );

            const grid =
                section.querySelector(
                    ".character-grid"
                );

            if (!toggle || !grid) {
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
                        String(!isCollapsed)
                    );

                    grid.setAttribute(
                        "aria-hidden",
                        String(isCollapsed)
                    );
                }
            );
        });
}


/* =========================================================
   CHARACTER CATEGORY
   ========================================================= */

function renderCharacterCategory(
    title,
    characters,
    categoryId
) {

    if (characters.length === 0) {
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
                        ${escapeHTML(title)}
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
   CHARACTER CARD
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
                    class="character-card-portrait unknown"
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

            <div class="character-card-image">

                ${portrait}

                ${notification}

            </div>

            <div class="character-card-content">

                <h3 class="character-card-title">
                    ${escapeHTML(name)}
                </h3>

                <p class="character-card-role">
                    ${escapeHTML(subtitle)}
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
                    class="character-profile-portrait unknown"
                    aria-label="Portrait unknown"
                >
                    ?
                </div>
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
                .map(note => `
                    <li>
                        ${escapeHTML(note)}
                    </li>
                `)
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
                    class="character-profile-quote"
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
            class="character-profile-card"
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
                        ${escapeHTML(type)}
                    </div>

                    <h2 id="character-profile-name">
                        ${escapeHTML(name)}
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
                    ${escapeHTML(status)}
                </div>

                <p
                    class="character-profile-description"
                >
                    ${escapeHTML(
        description
    )}
                </p>

                ${quote}


                <div
                    class="character-profile-details"
                >

                    <div>

                        <span>
                            Race
                        </span>

                        <strong>
                            ${escapeHTML(race)}
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


                ${notesSection}

            </div>

        </div>
    `;


    document.body.appendChild(
        overlay
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
        character.type === "player"
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
        character.type === "player"
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

    if (event.key === "Escape") {
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

    switch (team) {

        case "team-one":
            return "Team One";

        case "team-two":
            return "Team Two";

        case "shared":
            return "Shared";

        default:
            return "Unknown";
    }
}
