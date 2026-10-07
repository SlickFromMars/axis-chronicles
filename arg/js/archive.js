const STORAGE_KEY = "axisArchiveProgress";

let archiveData = null;
let responseData = null;

let currentSearch = "";


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
     * Records marked unlocked in the JSON
     * are available from the beginning.
     */

    if (record.unlocked === true) {
        return true;
    }

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

        const archiveResponse =
            await fetch("archive.json");

        if (!archiveResponse.ok) {
            throw new Error(
                `Failed to load archive: ${archiveResponse.status} `
            );
        }

        archiveData =
            await archiveResponse.json();


        const responsesResponse =
            await fetch("responses.json");

        if (!responsesResponse.ok) {
            throw new Error(
                `Failed to load responses: ${responsesResponse.status} `
            );
        }

        responseData =
            await responsesResponse.json();


        renderArchive();

        setupRecordControls();

        setupTerminalJump();

        setupConsole();

    } catch (error) {

        console.error(
            "Archive loading error:",
            error
        );

        const recordList =
            document.getElementById("record-list");

        if (recordList) {
            recordList.innerHTML = `
    < p class="loading" >
        ARCHIVE ERROR: RECORD DATABASE UNAVAILABLE
                </p >
    `;
        }
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
     * Determine recovered records.
     */

    const unlockedRecords =
        archiveData.records.filter(record =>
            isRecordUnlocked(record)
        );


    const totalRecords =
        archiveData.records.length;


    /*
     * Archive status.
     */

    document.getElementById(
        "archive-status"
    ).textContent =
        getArchiveStatus();


    /*
     * Records indexed.
     */

    document.getElementById(
        "records-indexed"
    ).textContent =
        `${unlockedRecords.length} / ${totalRecords}`;


    /*
     * Render records.
     */

    renderRecords(unlockedRecords);
}


/*
 * =========================================
 * RECORD SEARCH
 * =========================================
 */

function renderRecords(unlockedRecords) {

    const recordList =
        document.getElementById("record-list");

    if (!recordList) {
        return;
    }


    recordList.innerHTML = "";


    /*
     * Search only.
     */

    const visibleRecords =
        unlockedRecords.filter(record =>
            recordMatchesSearch(record)
        );


    /*
     * No results.
     */

    if (visibleRecords.length === 0) {

        const noResults =
            document.createElement("p");

        noResults.className =
            "no-results";


        if (unlockedRecords.length === 0) {

            noResults.textContent =
                "NO RECOVERED RECORDS.";

        } else {

            noResults.textContent =
                "NO RECORDS MATCH CURRENT SEARCH.";
        }


        recordList.appendChild(noResults);

    } else {

        visibleRecords.forEach(record => {

            renderRecord(
                record,
                recordList
            );

        });
    }


    /*
     * Update count.
     */

    updateRecordCount(
        visibleRecords.length,
        unlockedRecords.length
    );
}


/*
 * =========================================
 * SEARCH MATCHING
 * =========================================
 */

function recordMatchesSearch(record) {

    /*
     * Empty search shows all recovered records.
     */

    if (!currentSearch) {
        return true;
    }


    const searchText =
        currentSearch.toLowerCase();


    /*
     * Fields included in search.
     */

    const searchableText = [
        record.id,
        record.title,
        record.description,
        record.status
    ]
        .filter(value =>
            value !== undefined &&
            value !== null
        )
        .join(" ")
        .toLowerCase();


    return searchableText.includes(searchText);
}


/*
 * =========================================
 * RECORD COUNT
 * =========================================
 */

function updateRecordCount(
    visibleCount,
    recoveredCount
) {

    const countElement =
        document.getElementById("record-count");


    if (!countElement) {
        return;
    }


    if (currentSearch) {

        countElement.textContent =
            `${visibleCount} / ${recoveredCount} SHOWN`;

    } else {

        countElement.textContent =
            `${recoveredCount} RECOVERED`;
    }
}


/*
 * =========================================
 * RECORD CONTROLS
 * =========================================
 */

function setupRecordControls() {

    const searchInput =
        document.getElementById("record-search");

    const clearButton =
        document.getElementById("clear-search");


    /*
     * Search input.
     */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            event => {

                currentSearch =
                    event.target.value.trim();

                rerenderRecordsOnly();
            }
        );
    }


    /*
     * Clear search.
     */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                if (!searchInput) {
                    return;
                }

                searchInput.value = "";

                currentSearch = "";

                rerenderRecordsOnly();

                searchInput.focus();
            }
        );
    }
}


/*
 * =========================================
 * RE-RENDER RECORDS
 * =========================================
 */

function rerenderRecordsOnly() {

    if (!archiveData) {
        return;
    }


    const unlockedRecords =
        archiveData.records.filter(record =>
            isRecordUnlocked(record)
        );


    renderRecords(unlockedRecords);
}


/*
 * =========================================
 * TERMINAL JUMP
 * =========================================
 */

function setupTerminalJump() {

    const jumpButtons =
        document.querySelectorAll(".terminal-jump");


    if (!jumpButtons.length) {
        return;
    }


    jumpButtons.forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const terminal =
                    document.querySelector(
                        ".archive-console"
                    );


                if (!terminal) {
                    return;
                }


                terminal.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });


                const input =
                    document.getElementById(
                        "console-code"
                    );


                if (input) {

                    setTimeout(() => {
                        input.focus();
                    }, 500);

                }
            }
        );

    });
}


/*
 * =========================================
 * RECORD RENDERING
 * =========================================
 */

function renderRecord(
    record,
    recordList
) {

    const article =
        document.createElement("article");

    article.className =
        "record";


    /*
     * Missing records.
     */

    if (record.status === "missing") {
        article.classList.add("missing");
    }


    /*
     * Record number.
     */

    const number =
        document.createElement("div");

    number.className =
        "record-number";

    number.textContent =
        record.id;


    /*
     * Record content.
     */

    const content =
        document.createElement("div");

    content.className =
        "record-content";


    /*
     * Title.
     */

    const title =
        document.createElement("h3");


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
     * Description.
     */

    const description =
        document.createElement("p");

    description.textContent =
        record.description;


    /*
     * Status.
     */

    const status =
        document.createElement("span");

    status.className =
        "record-meta";

    status.textContent =
        `STATUS: ${record.status.toUpperCase()}`;


    /*
     * Assemble.
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
     * Terminal commands.
     */

    if (code === "CLEAR PROGRESS") {
        clearProgress();
        return;
    }


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
     * Special responses.
     */

    const specialResponses =
        responseData?.specialResponses || {};


    if (
        Object.prototype.hasOwnProperty.call(
            specialResponses,
            code
        )
    ) {

        saveProgress(progress);

        addConsoleMessage(
            specialResponses[code],
            "warning"
        );

        return;
    }


    /*
     * Find matching locked record.
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
     * Invalid code.
     */

    if (!record) {

        saveProgress(progress);


        const responses =
            responseData?.defaults?.invalidCode || [
                "ACCESS DENIED."
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


        /*
         * Attempt hints.
         */

        const hints =
            responseData?.defaults?.attemptHints || [];


        const hint =
            hints.find(
                entry =>
                    entry.attempt ===
                    progress.attempts
            );


        if (hint) {

            addConsoleMessage(
                hint.message,
                hint.type || "warning"
            );
        }


        return;
    }


    /*
     * Unlock record.
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
     * Success messages.
     */

    addConsoleMessage(
        responseData?.defaults?.accessGranted ||
        "ACCESS GRANTED.",
        "success"
    );


    addConsoleMessage(
        (
            responseData?.defaults?.recordRecovered ||
            "RECORD {id} RECOVERED."
        ).replace(
            "{id}",
            record.id
        ),
        "success"
    );


    /*
     * Update archive.
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


    if (progress.unlockedRecords.length === 0) {

        addConsoleMessage(
            responseData?.defaults?.clearNoProgress ||
            "NO RECOVERED PROGRESS FOUND.",
            "warning"
        );

        return;
    }


    const confirmed =
        window.confirm(
            "CLEAR ALL ARCHIVE PROGRESS?\n\n" +
            "This will erase all recovered records " +
            "and cannot be undone."
        );


    if (!confirmed) {

        addConsoleMessage(
            responseData?.defaults?.clearCancelled ||
            "CLEAR OPERATION CANCELLED.",
            "warning"
        );

        return;
    }


    /*
     * Remove progress.
     */

    localStorage.removeItem(
        STORAGE_KEY
    );


    /*
     * Reset search too.
     */

    currentSearch = "";

    const searchInput =
        document.getElementById(
            "record-search"
        );

    if (searchInput) {
        searchInput.value = "";
    }


    /*
     * Update archive.
     */

    renderArchive();


    /*
     * Terminal response.
     */

    addConsoleMessage(
        responseData?.defaults?.clearSuccess ||
        "ARCHIVE PROGRESS CLEARED.",
        "success"
    );


    addConsoleMessage(
        responseData?.defaults?.clearRestored ||
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


    if (!output) {
        return;
    }


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
