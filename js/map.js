/* =========================================================
   MAP
   ========================================================= */

function showMap() {
    document.getElementById("content").innerHTML = `
        <section class="page map-page">

            <h1>
                World Map
            </h1>

            <div class="map-container">

                <img
                    src="assets/images/caelora.png"
                    alt="Map of the world of Breaking the Axis"
                    class="world-map"
                    id="world-map-image"
                >

            </div>

        </section>
    `;

    document
        .getElementById("world-map-image")
        .addEventListener(
            "click",
            openMapViewer
        );
}


/* =========================================================
   MAP VIEWER
   ========================================================= */

function openMapViewer() {
    const overlay =
        document.createElement("div");

    overlay.className =
        "map-viewer";

    overlay.id =
        "map-viewer";


    overlay.innerHTML = `
        <button
            type="button"
            class="map-viewer-close"
            id="map-viewer-close"
            aria-label="Close map"
        >
            ×
        </button>

        <img
            src="assets/images/caelora.png"
            alt="Expanded map of the world of Breaking the Axis"
            class="map-viewer-image"
        >
    `;


    document.body.appendChild(overlay);


    document
        .getElementById("map-viewer-close")
        .addEventListener(
            "click",
            closeMapViewer
        );


    overlay.addEventListener(
        "click",
        event => {

            if (event.target === overlay) {
                closeMapViewer();
            }

        }
    );


    document.addEventListener(
        "keydown",
        handleMapEscape
    );
}


function closeMapViewer() {
    const viewer =
        document.getElementById(
            "map-viewer"
        );

    if (viewer) {
        viewer.remove();
    }

    document.removeEventListener(
        "keydown",
        handleMapEscape
    );
}


function handleMapEscape(event) {
    if (event.key === "Escape") {
        closeMapViewer();
    }
}
