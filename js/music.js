/* =========================================================
   MUSIC
   ========================================================= */

function showMusic() {
    document.getElementById("content").innerHTML = `
        <section class="page music-page">

            <h1>
                Campaign Music
            </h1>

            <p class="page-description">
                The music behind the world of Caelora.
            </p>


            <div class="music-section">

                <h2>
                    Campaign Inspiration
                </h2>

                <p>
                    Songs that inspired the characters,
                    locations, stories, and atmosphere
                    of Breaking the Axis.
                </p>

                <iframe
                    style="border-radius: 12px"
                    src="https://open.spotify.com/embed/playlist/2n4tFMIR5GfEudPK51svuO?utm_source=generator&si=53fa386e79614ed9"
                    width="100%"
                    height="500"
                    frameborder="0"
                    allowfullscreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>

            </div>


            <div class="music-section">

                <h2>
                    Session Soundtrack
                </h2>

                <p>
                    Music used during our actual sessions.
                </p>

                <iframe
                    style="border-radius: 12px"
                    src="https://open.spotify.com/embed/playlist/4WpsBbXWCIL5zXoZzuM4Ck?utm_source=generator&theme=0&si=27fd1ec0b0db4e89"
                    width="100%"
                    height="500"
                    frameborder="0"
                    allowfullscreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>

            </div>

        </section>
    `;
}
