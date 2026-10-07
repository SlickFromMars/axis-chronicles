const STORAGE_KEY = "axisArchiveProgress";

let archiveData = null;


/*
 * =========================================
 * PROGRESS
 * =========================================
 */

function getProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return {
                unlockedRecords: [],
                attempts: 0,
                codesEntered: []
            };
        }

        return JSON.parse(saved);

    } catch (error) {
        console.warn("Archive progress could not be loaded.");

        return {
            unlockedRecords: [],
            attempts: 0,
            codesEntered: []
        };
    }
}


function saveProgress(progress) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progress)
    );
}


function isRecordUnlocked(record) {
    /*
     * Records marked unlocked in the JSON are
     * available from the beginning.
     */

    if (record.unlocked === true) {
        return true;
    }


    /*
     * Check the player's saved progress.
     */

    const progress = getProgress();

    return progress.unlockedRecords.includes(record.id);
}


/*
 * =========================================
 * ARCHIVE STATUS
 * =========================================
 */

function getArchiveStatus() {
    const totalRecords =
        archiveData.records.length;

    const unlockedRecords =
        archiveData.records.filter(record =>
            isRecordUnlocked(record)
        ).length;


    if (unlockedRecords === totalRecords) {
        return "FULLY RECOVERED";
    }


    if (unlockedRecords > 1) {
        return "PARTIALLY RECOVERED";
    }


    return "RECOVERY INCOMPLETE";
}


/*
 * =========================================
 * LOAD ARCHIVE
 * =========================================
 */

async function loadArchive() {
    try {
        const response =
            await fetch("archive.json");

        if (!response.ok) {
            throw new Error(
                `Failed to load archive: ${response.status}`
            );
        }

        archiveData =
            await response.json();


        renderArchive();

        setupConsole();

    } catch (error) {
        console.error(
            "Archive loading error:",
            error
        );

        document.getElementById(
            "record-list"
        ).innerHTML = `
            <p class="loading">
                ARCHIVE ERROR: RECORD DATABASE UNAVAILABLE
            </p>
        `;
    }
}


/*
 * =========================================
 * RENDER ARCHIVE
 * =========================================
 */

function renderArchive() {

    /*
     * Archive information
     */

    document.getElementById(
        "archive-title"
    ).textContent =
        archiveData.title;


    document.getElementById(
        "archive-subtitle"
    ).textContent =
        archiveData.subtitle;


    /*
     * Dynamically calculate recovery state.
     */

    const unlockedRecords =
        archiveData.records.filter(record =>
            isRecordUnlocked(record)
        );


    const totalRecords =
        archiveData.records.length;


    const status =
        getArchiveStatus();


    document.getElementById(
        "archive-status"
    ).textContent =
        status;


    /*
     * Dynamically calculate the number
     * of records currently recovered.
     */

    document.getElementById(
        "records-indexed"
    ).textContent =
        `${unlockedRecords.length} / ${totalRecords}`;


    /*
     * Records
     */

    const recordList =
        document.getElementById(
            "record-list"
        );

    recordList.innerHTML = "";


    /*
     * Only display records the player
     * has actually recovered.
     */

    unlockedRecords.forEach(record => {
        renderRecord(
            record,
            recordList
        );
    });
}


/*
 * =========================================
 * RECORD RENDERING
 * =========================================
 */

function renderRecord(record, recordList) {

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

    number.className =
        "record-number";

    number.textContent =
        record.id;


    /*
     * Record content
     */

    const content =
        document.createElement("div");

    content.className =
        "record-content";


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

        link.href =
            record.link;

        link.textContent =
            record.title;

        title.appendChild(link);

    } else {

        title.textContent =
            record.title;
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

    status.className =
        "record-meta";

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
}


/*
 * =========================================
 * CONSOLE
 * =========================================
 */

function setupConsole() {

    const form =
        document.getElementById(
            "console-form"
        );

    const input =
        document.getElementById(
            "console-code"
        );


    if (!form || !input) {
        return;
    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const code =
                input.value.trim();

            if (!code) {
                return;
            }

            processCode(code);

            input.value = "";

            input.focus();
        }
    );
}


/*
 * =========================================
 * CODE PROCESSING
 * =========================================
 */

function processCode(inputCode) {

    const code =
        inputCode
            .trim()
            .toUpperCase();


    /*
     * Terminal commands
     */

    if (code === "CLEAR PROGRESS") {
        clearProgress();
        return;
    }


    /*
     * Optional shorter version.
     */

    if (code === "CLEAR") {
        clearProgress();
        return;
    }


    const progress =
        getProgress();


    /*
     * Track attempts.
     */

    progress.attempts++;

    progress.codesEntered.push(code);


    /*
     * Find a locked record whose code
     * matches the submitted code.
     */

    const record =
        archiveData.records.find(candidate => {

            if (isRecordUnlocked(candidate)) {
                return false;
            }

            if (!candidate.code) {
                return false;
            }

            return (
                candidate.code.toUpperCase() ===
                code
            );
        });


    /*
     * No matching code.
     */

    if (!record) {

        saveProgress(progress);

        const responses = [
            "ACCESS DENIED.",
            "CODE NOT RECOGNIZED.",
            "NO MATCH FOUND IN ARCHIVE INDEX.",
            "INVALID ARCHIVAL REFERENCE.",
            "THAT CODE DOES NOT CORRESPOND TO A RECOVERED RECORD.",
            "ACCESS DENIED. PLEASE REFER TO THE AVAILABLE MATERIAL.",
            "NOTHING FOUND.",
            "THE ARCHIVE DOES NOT RECOGNIZE THAT ENTRY.",
            "VERA WOULD BE DISAPPOINTED."
        ];


        const response =
            responses[
                Math.floor(
                    Math.random() *
                    responses.length
                )
            ];


        addConsoleMessage(
            response,
            "error"
        );


        if (progress.attempts === 10) {

            addConsoleMessage(
                "PERHAPS THE AVAILABLE RECORDS CONTAIN THE ANSWER.",
                "warning"
            );
        }


        return;
    }


    /*
     * Unlock the record.
     */

    if (
        !progress.unlockedRecords.includes(
            record.id
        )
    ) {
        progress.unlockedRecords.push(
            record.id
        );
    }


    saveProgress(progress);


    /*
     * Notify the player.
     */

    addConsoleMessage(
        "ACCESS GRANTED.",
        "success"
    );

    addConsoleMessage(
        `RECORD ${record.id} RECOVERED.`,
        "success"
    );


    /*
     * Re-render the archive so that
     * the status and record count update
     * immediately.
     */

    renderArchive();
}


/*
 * =========================================
 * CLEAR PROGRESS
 * =========================================
 */

function clearProgress() {

    const progress =
        getProgress();


    /*
     * Don't erase anything if the player
     * hasn't actually unlocked anything.
     */

    if (progress.unlockedRecords.length === 0) {

        addConsoleMessage(
            "NO RECOVERED PROGRESS FOUND.",
            "warning"
        );

        return;
    }


    /*
     * Require confirmation.
     */

    const confirmed =
        window.confirm(
            "CLEAR ALL ARCHIVE PROGRESS?\n\n" +
            "This will erase all recovered records " +
            "and cannot be undone."
        );


    if (!confirmed) {

        addConsoleMessage(
            "CLEAR OPERATION CANCELLED.",
            "warning"
        );

        return;
    }


    /*
     * Remove saved progress.
     */

    localStorage.removeItem(
        STORAGE_KEY
    );


    /*
     * Update the archive immediately.
     */

    renderArchive();


    /*
     * Terminal response.
     */

    addConsoleMessage(
        "ARCHIVE PROGRESS CLEARED.",
        "success"
    );

    addConsoleMessage(
        "RECOVERY STATE RESTORED TO INITIAL CONDITION.",
        "success"
    );
}



/*
 * =========================================
 * CONSOLE OUTPUT
 * =========================================
 */

function addConsoleMessage(
    message,
    type = ""
) {

    const output =
        document.getElementById(
            "console-output"
        );


    const line =
        document.createElement("div");


    if (type) {
        line.classList.add(type);
    }


    line.textContent =
        `> ${message}`;


    output.appendChild(line);


    output.scrollTop =
        output.scrollHeight;
}


/*
 * =========================================
 * START
 * =========================================
 */

loadArchive();
