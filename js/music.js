/* =========================================================
   MUSIC
   ========================================================= */

let musicData = null;
let musicDataPromise = null;
let musicDataCampaignId = null;


/* =========================================================
   MUSIC CONFIGURATION
   ========================================================= */

const DEFAULT_MUSIC_TEXT = {
    eyebrow: "THE SOUND OF THE WORLD",
    title: "Campaign Music",
    description:
        "The music behind the campaign."
};


function getMusicText() {

    if (
        typeof activeCampaign === "undefined" ||
        !activeCampaign
    ) {
        return DEFAULT_MUSIC_TEXT;
    }

    return {
        ...DEFAULT_MUSIC_TEXT,
        ...(activeCampaign.text?.music || {})
    };
}


function getMusicCampaignId() {

    if (
        typeof activeCampaign !== "undefined" &&
        activeCampaign
    ) {
        return activeCampaign.id;
    }

    return "default";
}


/* =========================================================
   LOAD MUSIC DATA
   ========================================================= */

async function loadMusic() {

    const campaignId =
        getMusicCampaignId();


    /*
        Clear cached music if the active
        campaign changes.
    */

    if (
        musicDataCampaignId !==
        campaignId
    ) {

        musicData = null;
        musicDataPromise = null;

        musicDataCampaignId =
            campaignId;
    }


    if (
        musicData !== null
    ) {

        return musicData;
    }


    if (
        musicDataPromise
    ) {

        return musicDataPromise;
    }


    const musicPath =
        typeof getCampaignDataPath ===
            "function"
            ? getCampaignDataPath(
                "music"
            )
            : "campaigns/breaking-the-axis/data/music.json";


    if (!musicPath) {

        throw new Error(
            "No music data path configured for this campaign."
        );
    }


    musicDataPromise =
        fetch(musicPath)
            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Could not load music (${response.status})`
                    );
                }


                return response.json();
            })
            .then(data => {

                if (
                    !data ||
                    typeof data !== "object"
                ) {

                    throw new Error(
                        "music.json must contain an object."
                    );
                }


                musicData =
                    data;


                return musicData;
            })
            .catch(error => {

                musicDataPromise =
                    null;

                throw error;
            });


    return musicDataPromise;
}


/* =========================================================
   SHOW MUSIC
   ========================================================= */

async function showMusic() {

    const content =
        document.getElementById(
            "content"
        );


    if (!content) {

        console.error(
            "Music page could not load: #content was not found."
        );

        return;
    }


    const musicText =
        getMusicText();


    /*
        Initial loading state.
    */

    content.innerHTML = `
        <section class="page music-page">

            <div class="music-hero">

                <div
                    class="music-hero-icon"
                    aria-hidden="true"
                >
                    ♫
                </div>


                <div class="music-hero-content">

                    <span class="music-eyebrow">
                        ${escapeMusicHTML(
                            musicText.eyebrow
                        )}
                    </span>


                    <h1>
    ${escapeMusicHTML(
        musicText.title
    )}
</h1>

<p class="page-description">
    Loading the soundtrack of the campaign...
</p>

                </div>

            </div>

        </section>
    `;


    try {

        const music =
            await loadMusic();


        const sections =
            Array.isArray(
                music.sections
            )
                ? music.sections
                : [];


        const sectionHTML =
            sections
                .map(
                    (
                        section,
                        index
                    ) => {

                        const number =
                            String(
                                index + 1
                            ).padStart(
                                2,
                                "0"
                            );


                        /*
                            Allow optional icons
                            in music.json.
                        */

                        const icon =
                            section.icon ||
                            "♫";


                        return `
                            <article
                                class="music-section"
                            >

                                <div
                                    class="music-section-header"
                                >

                                    <div
                                        class="music-section-number"
                                    >
                                        ${number}
                                    </div>


                                    <div
                                        class="music-section-icon"
                                        aria-hidden="true"
                                    >
                                        ${escapeMusicHTML(
                                            icon
                                        )}
                                    </div>


                                    <div
                                        class="music-section-heading"
                                    >

                                        <span
                                            class="music-section-label"
                                        >
                                            SOUNDTRACK
                                        </span>


                                        <h2>
                                            ${escapeMusicHTML(
                                                section.title
                                            )}
                                        </h2>


                                        <p>
                                            ${escapeMusicHTML(
                                                section.description
                                            )}
                                        </p>

                                    </div>

                                </div>


                                ${
                                    section.playlist
                                        ? `
                                            <div
                                                class="music-player"
                                            >

                                                <div
                                                    class="music-player-topline"
                                                >

                                                    <span>
                                                        NOW PLAYING
                                                    </span>


                                                    <span
                                                        class="music-player-dot"
                                                    ></span>


                                                    <span>
                                                        SPOTIFY
                                                    </span>

                                                </div>


                                                <iframe
                                                    src="${escapeMusicAttribute(
                                                        section.playlist
                                                    )}"
                                                    width="100%"
                                                    height="500"
                                                    frameborder="0"
                                                    allowfullscreen
                                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                    loading="lazy"
                                                    title="${escapeMusicAttribute(
                                                        section.title
                                                    )} playlist"
                                                ></iframe>

                                            </div>
                                        `
                                        : `
                                            <div
                                                class="music-player-empty"
                                            >
                                                <div
                                                    class="music-empty-icon"
                                                    aria-hidden="true"
                                                >
                                                    ♫
                                                </div>

                                                <p>
                                                    No playlist has been added yet.
                                                </p>
                                            </div>
                                        `
                                }

                            </article>
                        `;
                    }
                )
                .join("");


        content.innerHTML = `
            <section class="page music-page">

                <div class="music-hero">

                    <div
                        class="music-hero-icon"
                        aria-hidden="true"
                    >
                        ♫
                    </div>


                    <div class="music-hero-content">

                        <span class="music-eyebrow">
                            ${escapeMusicHTML(
                                musicText.eyebrow
                            )}
                        </span>


                        <h1>
    ${escapeMusicHTML(
        musicText.title
    )}
</h1>


<p class="page-description">
    ${escapeMusicHTML(
        musicText.description
    )}
</p>

                    </div>

                </div>


                ${
                    sectionHTML
                        ? `
                            <div class="music-sections">
                                ${sectionHTML}
                            </div>
                        `
                        : `
                            <div class="music-empty">

                                <div
                                    class="music-empty-icon"
                                    aria-hidden="true"
                                >
                                    ♫
                                </div>


                                <h2>
                                    No music yet
                                </h2>


                                <p>
                                    The campaign soundtrack has not been added yet.
                                </p>

                            </div>
                        `
                }

            </section>
        `;


    } catch (error) {

        console.error(
            "Failed to load campaign music:",
            error
        );


        content.innerHTML = `
            <section class="page music-page">

                <div class="music-error">

                    <div
                        class="music-error-icon"
                        aria-hidden="true"
                    >
                        ♫
                    </div>


                    <h1>
                        Campaign Music
                    </h1>


                    <p class="page-description">
                        The campaign music could not be loaded.
                        Please try again later.
                    </p>

                </div>

            </section>
        `;
    }
}


/* =========================================================
   MUSIC HTML ESCAPING
   ========================================================= */

function escapeMusicHTML(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => {

            const entities = {

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
            };


            return entities[
                character
            ];
        }
    );
}


/* =========================================================
   MUSIC ATTRIBUTE ESCAPING
   ========================================================= */

function escapeMusicAttribute(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => {

            const entities = {

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
            };


            return entities[
                character
            ];
        }
    );
}
