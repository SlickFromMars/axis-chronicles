async function loadArchive() {
    try {
        const response = await fetch("archive.json");

        if (!response.ok) {
            throw new Error(
                `Failed to load archive: ${response.status}`
            );
        }

        const archive = await response.json();

        renderArchive(archive);
    } catch (error) {
        console.error("Archive loading error:", error);

        document.getElementById("record-list").innerHTML = `
            <p class="loading">
                ARCHIVE ERROR: RECORD DATABASE UNAVAILABLE
            </p>
        `;
    }
}

function renderArchive(archive) {
    /*
     * Archive information
     */

    document.getElementById("archive-title").textContent =
        archive.title;

    document.getElementById("archive-subtitle").textContent =
        archive.subtitle;

    document.getElementById("archive-status").textContent =
        archive.status;

    document.getElementById("records-indexed").textContent =
        archive.recordsIndexed;

    document.getElementById("last-updated").textContent =
        archive.lastUpdated;


    /*
     * Records
     */

    const recordList =
        document.getElementById("record-list");

    recordList.innerHTML = "";


    archive.records.forEach(record => {
        const article =
            document.createElement("article");

        article.className = "record";


        /*
         * Missing records get a different appearance.
         */

        if (record.status === "missing") {
            article.classList.add("missing");
        }


        /*
         * Record number
         */

        const number =
            document.createElement("div");

        number.className = "record-number";

        number.textContent = record.id;


        /*
         * Record content
         */

        const content =
            document.createElement("div");

        content.className = "record-content";


        /*
         * Title
         */

        const title =
            document.createElement("h3");


        /*
         * Records with links become clickable.
         */

        if (record.link) {
            const link =
                document.createElement("a");

            link.href = record.link;

            link.textContent = record.title;

            title.appendChild(link);
        } else {
            title.textContent = record.title;
        }


        /*
         * Description
         */

        const description =
            document.createElement("p");

        description.textContent =
            record.description;


        /*
         * Status
         */

        const status =
            document.createElement("span");

        status.className = "record-meta";

        status.textContent =
            `STATUS: ${record.status.toUpperCase()}`;


        /*
         * Assemble record
         */

        content.appendChild(title);

        content.appendChild(description);

        content.appendChild(status);

        article.appendChild(number);

        article.appendChild(content);

        recordList.appendChild(article);
    });
}

loadArchive();
