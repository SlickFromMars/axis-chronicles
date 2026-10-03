/* =========================================================
   MUSIC
   ========================================================= */

async function showMusic() {
    const content = document.getElementById("content");

    content.innerHTML = `
        <section class="page music-page">
            <h1>Campaign Music</h1>
            <p class="page-description">Loading campaign music...</p>
        </section>
    `;

    try {
        const response = await fetch("data/music.json");

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const music = await response.json();

        const sections = music.sections.map(section => `
            <div class="music-section">
                <h2>${escapeMusicHTML(section.title)}</h2>

                <p>
                    ${escapeMusicHTML(section.description)}
                </p>

                <iframe
                    style="border-radius: 12px"
                    src="${escapeMusicHTML(section.playlist)}"
                    width="100%"
                    height="500"
                    frameborder="0"
                    allowfullscreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>
            </div>
        `).join("");

        content.innerHTML = `
            <section class="page music-page">
                <h1>${escapeMusicHTML(music.title)}</h1>

                <p class="page-description">
                    ${escapeMusicHTML(music.description)}
                </p>

                ${sections}
            </section>
        `;

    } catch (error) {
        console.error("Failed to load campaign music:", error);

        content.innerHTML = `
            <section class="page music-page">
                <h1>Campaign Music</h1>

                <p class="page-description">
                    The campaign music could not be loaded.
                    Please try again later.
                </p>
            </section>
        `;
    }
}


/* Escape text before inserting JSON values into HTML */
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
