/* =========================================================
   MUSIC
   ========================================================= */

async function showMusic() {
    const content = document.getElementById("content");

    if (!content) {
        console.error("Music page could not load: #content was not found.");
        return;
    }

    content.innerHTML = `
        <section class="page music-page">

            <div class="music-hero">

                <div class="music-hero-icon" aria-hidden="true">
                    ♫
                </div>

                <div class="music-hero-content">
                    <span class="music-eyebrow">
                        THE SOUND OF CAELORA
                    </span>

                    <h1>Campaign Music</h1>

                    <p class="page-description">
                        Loading the soundtrack of the campaign...
                    </p>
                </div>

            </div>

        </section>
    `;

    try {
        const response = await fetch("data/music.json");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const music = await response.json();

        const sections = Array.isArray(music.sections)
            ? music.sections
            : [];

        const sectionHTML = sections.map((section, index) => {
            const number = String(index + 1).padStart(2, "0");

            /*
             * Allow optional icons in music.json.
             * If none is provided, use a simple musical note.
             */
            const icon = section.icon || "♫";

            return `
                <article class="music-section">

                    <div class="music-section-header">

                        <div class="music-section-number">
                            ${number}
                        </div>

                        <div class="music-section-icon" aria-hidden="true">
                            ${escapeMusicHTML(icon)}
                        </div>

                        <div class="music-section-heading">
                            <span class="music-section-label">
                                SOUNDTRACK
                            </span>

                            <h2>
                                ${escapeMusicHTML(section.title)}
                            </h2>

                            <p>
                                ${escapeMusicHTML(section.description)}
                            </p>
                        </div>

                    </div>

                    <div class="music-player">

                        <div class="music-player-topline">
                            <span>
                                NOW PLAYING
                            </span>

                            <span class="music-player-dot"></span>

                            <span>
                                SPOTIFY
                            </span>
                        </div>

                        <iframe
                            src="${escapeMusicAttribute(section.playlist)}"
                            width="100%"
                            height="500"
                            frameborder="0"
                            allowfullscreen
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            title="${escapeMusicAttribute(section.title)} playlist">
                        </iframe>

                    </div>

                </article>
            `;
        }).join("");

        content.innerHTML = `
            <section class="page music-page">

                <div class="music-hero">

                    <div class="music-hero-icon" aria-hidden="true">
                        ♫
                    </div>

                    <div class="music-hero-content">

                        <span class="music-eyebrow">
                            THE SOUND OF CAELORA
                        </span>

                        <h1>
                            ${escapeMusicHTML(music.title)}
                        </h1>

                        <p class="page-description">
                            ${escapeMusicHTML(music.description)}
                        </p>

                    </div>

                </div>

                ${sectionHTML
                ? `<div class="music-sections">${sectionHTML}</div>`
                : `
                            <div class="music-empty">
                                <div class="music-empty-icon">♫</div>
                                <h2>No music yet</h2>
                                <p>
                                    The campaign soundtrack has not been
                                    added yet.
                                </p>
                            </div>
                        `
            }

            </section>
        `;

    } catch (error) {
        console.error("Failed to load campaign music:", error);

        content.innerHTML = `
            <section class="page music-page">

                <div class="music-error">

                    <div class="music-error-icon">
                        ♫
                    </div>

                    <h1>Campaign Music</h1>

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

function escapeMusicHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


/* =========================================================
   MUSIC ATTRIBUTE ESCAPING
   ========================================================= */

function escapeMusicAttribute(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}
