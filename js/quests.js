let hideCompleted =
    localStorage.getItem("hideCompleted") === "true";


/* =========================================================
   LOAD QUESTS
   ========================================================= */

async function loadQuests() {
    const response = await fetch("data/quests.json");

    if (!response.ok) {
        throw new Error("Could not load quests");
    }

    return await response.json();
}


/* =========================================================
   QUEST LIST
   ========================================================= */

function renderQuestList(quests) {
    const content = document.getElementById("content");

    /*
        Hide completed quests when enabled.
    */
    const visibleQuests = hideCompleted
        ? quests.filter(quest => quest.status !== "completed")
        : quests;

    let questHTML = renderQuestControls();

    if (visibleQuests.length === 0) {
        questHTML += `
            <p class="empty-state">
                No quests have been recorded here yet.
            </p>
        `;

        content.innerHTML = questHTML;

        attachQuestControls();

        return;
    }

    const categories = [
        {
            type: "main",
            label: "Main Quests"
        },
        {
            type: "side",
            label: "Side Quests"
        },
        {
            type: "companion",
            label: "Companion Quests"
        }
    ];

    categories.forEach(category => {
        const categoryQuests = visibleQuests
            .filter(quest => quest.type === category.type)
            .sort((a, b) => {
                const teamOrder = {
                    one: 1,
                    two: 2,
                    shared: 3
                };

                const teamDifference =
                    (teamOrder[a.team] || 99) -
                    (teamOrder[b.team] || 99);

                if (teamDifference !== 0) {
                    return teamDifference;
                }

                return a.title.localeCompare(
                    b.title,
                    undefined,
                    { sensitivity: "base" }
                );
            });

        if (categoryQuests.length === 0) {
            return;
        }

        questHTML += `
            <section class="quest-category">
                <h2 class="quest-category-heading">
                    ${category.label}
                </h2>

                <div class="quest-list">
                    ${categoryQuests.map(renderQuestCard).join("")}
                </div>
            </section>
        `;
    });

    content.innerHTML = questHTML;

    /*
        Quest card click handlers
    */
    content
        .querySelectorAll("[data-quest-id]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const quest = quests.find(
                    q => q.id === button.dataset.questId
                );

                if (quest) {
                    renderQuestDetail(quest);
                }
            });
        });

    attachQuestControls();
}


/* =========================================================
   QUEST CONTROLS
   ========================================================= */

function renderQuestControls() {
    return `
        <div class="quest-controls">
            <label class="quest-toggle">
                <input
                    type="checkbox"
                    id="hide-completed-toggle"
                    ${hideCompleted ? "checked" : ""}
                >

                <span class="quest-toggle-box">
                    ${hideCompleted ? "✓" : ""}
                </span>

                <span class="quest-toggle-text">
                    Hide Completed
                </span>
            </label>
        </div>
    `;
}


function attachQuestControls() {
    const toggle = document.getElementById(
        "hide-completed-toggle"
    );

    if (!toggle) {
        return;
    }

    toggle.addEventListener("change", () => {
        hideCompleted = toggle.checked;

        /*
            Save the setting so it survives page refreshes.
        */
        localStorage.setItem(
            "hideCompleted",
            String(hideCompleted)
        );

        /*
            Re-render the quest list using the new setting.
        */
        showQuests();
    });
}


/* =========================================================
   QUEST CARD
   ========================================================= */

function renderQuestCard(quest) {
    const category = formatCategory(quest.type);

    const team = quest.team !== "shared"
        ? ` · ${formatTeam(quest.team)}`
        : "";

    return `
        <button
            type="button"
            class="quest-card"
            data-quest-id="${escapeHTML(quest.id)}"
        >
            <div class="quest-card-top">
                <span class="quest-category">
                    ${escapeHTML(category + team)}
                </span>

                <span class="quest-status ${escapeHTML(quest.status)}">
                    ${escapeHTML(formatStatus(quest.status))}
                </span>
            </div>

            <h2>${escapeHTML(quest.title)}</h2>

            <p>${escapeHTML(quest.description)}</p>
        </button>
    `;
}


/* =========================================================
   QUEST DETAIL
   ========================================================= */

function renderQuestDetail(quest) {
    const content = document.getElementById("content");

    /*
        Hide completed objectives when the global setting
        is enabled.
    */
    const visibleObjectives = hideCompleted
        ? quest.objectives.filter(
            objective => !objective.completed
        )
        : quest.objectives;

    content.innerHTML = `
        <button
            type="button"
            class="back-button"
            id="back-button"
        >
            ← Back to quests
        </button>

        <div class="quest-detail">

            <div class="quest-card-top">
                <span class="quest-category">
                    ${escapeHTML(formatCategory(quest.type))}
                </span>

                <span class="quest-status ${escapeHTML(quest.status)}">
                    ${escapeHTML(formatStatus(quest.status))}
                </span>
            </div>

            <div class="quest-detail-team">
                ${escapeHTML(formatTeam(quest.team))}
            </div>

            <h2>${escapeHTML(quest.title)}</h2>

            <p class="quest-description">
                ${escapeHTML(quest.description)}
            </p>

            <h3>Objectives</h3>

            <div class="objectives">
                ${visibleObjectives.length > 0
            ? visibleObjectives
                .map(renderObjective)
                .join("")
            : `
                            <p class="objectives-hidden">
                                All objectives have been completed.
                            </p>
                        `
        }
            </div>

            <h3>Recent Developments</h3>

            <div class="developments">
                ${quest.developments &&
            quest.developments.length
            ? quest.developments
                .map(renderDevelopment)
                .join("")
            : `
                            <p>
                                No developments recorded.
                            </p>
                        `
        }
            </div>

        </div>
    `;

    document
        .getElementById("back-button")
        .addEventListener("click", () => {
            showQuests();
        });
}


/* =========================================================
   OBJECTIVES
   ========================================================= */

function renderObjective(objective) {
    return `
        <div class="objective ${objective.completed ? "completed" : ""
        }">

            <span
                class="objective-checkbox"
                aria-hidden="true"
            >
                ${objective.completed ? "✓" : ""}
            </span>

            <span class="objective-text">
                ${escapeHTML(objective.text)}
            </span>

        </div>
    `;
}


/* =========================================================
   DEVELOPMENTS
   ========================================================= */

function renderDevelopment(development) {
    return `
        <div class="development">

            <span class="development-session">
                ${escapeHTML(development.session)}
            </span>

            <p>
                ${escapeHTML(development.text)}
            </p>

        </div>
    `;
}


/* =========================================================
   FORMATTING
   ========================================================= */

function formatCategory(type) {
    const categories = {
        main: "Main Quest",
        side: "Side Quest",
        companion: "Companion Quest"
    };

    return categories[type] || "Quest";
}


function formatTeam(team) {
    const teams = {
        one: "Team One",
        two: "Team Two",
        shared: "Shared"
    };

    return teams[team] || "Shared";
}


function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


/* =========================================================
   CALENDAR
   ========================================================= */

async function loadSessions() {
    const response = await fetch("data/sessions.json");

    if (!response.ok) {
        throw new Error("Could not load sessions");
    }

    return await response.json();
}


async function showCalendar() {
    const content = document.getElementById("content");

    content.innerHTML = `
        <p class="loading">
            Loading calendar...
        </p>
    `;

    try {
        const sessions = await loadSessions();

        renderCalendar(sessions);
    } catch (error) {
        console.error(error);

        content.innerHTML = `
            <p class="error">
                The calendar could not be loaded.
                Check your session data file and try again.
            </p>
        `;
    }
}


/* =========================================================
   RENDER CALENDAR
   ========================================================= */

function renderCalendar(sessions) {
    const content = document.getElementById("content");

    const now = new Date();

    const year = now.getFullYear();
    const month = now.getMonth();

    const monthName = new Intl.DateTimeFormat("en-US", {
        month: "long"
    }).format(now);

    const firstDay = new Date(
        year,
        month,
        1
    ).getDay();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    let calendarHTML = `
        <section class="calendar-page">

            <div class="calendar-heading">

                <div class="eyebrow">
                    SESSION SCHEDULE
                </div>

                <h1>
                    ${monthName} ${year}
                </h1>

                <div class="calendar-actions">

                    <button
                        type="button"
                        class="calendar-subscribe"
                        id="calendar-subscribe"
                    >
                        Subscribe to Calendar
                    </button>

                    <a
                        class="calendar-download"
                        href="data/sessions.ics"
                        download="breaking-the-axis.ics"
                    >
                        Download Calendar
                    </a>

                </div>

            </div>

            <div class="calendar">

                <div class="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>

                <div class="calendar-grid">
    `;

    /*
        Empty cells before the first day.
    */
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `
            <div class="calendar-day empty"></div>
        `;
    }

    /*
        Days of the month.
    */
    for (let day = 1; day <= daysInMonth; day++) {
        const date =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const daySessions = sessions.filter(
            session => session.date === date
        );

        calendarHTML += `
            <div class="calendar-day">

                <span class="calendar-date">
                    ${day}
                </span>

                <div class="calendar-events">
                    ${daySessions
                .map(renderCalendarSession)
                .join("")
            }
                </div>

            </div>
        `;
    }

    calendarHTML += `
                </div>
            </div>

        </section>
    `;

    content.innerHTML = calendarHTML;


    /* =====================================================
       CALENDAR SUBSCRIPTION
       ===================================================== */

    const subscribeButton =
        document.getElementById("calendar-subscribe");

    subscribeButton.addEventListener("click", async () => {
        const calendarURL = new URL(
            "data/sessions.ics",
            window.location.href
        ).href;

        try {
            await navigator.clipboard.writeText(
                calendarURL
            );

            subscribeButton.textContent =
                "Calendar URL Copied!";

            setTimeout(() => {
                subscribeButton.textContent =
                    "Subscribe to Calendar";
            }, 2000);

        } catch (error) {
            console.error(error);

            prompt(
                "Copy this calendar subscription URL:",
                calendarURL
            );
        }
    });


    /* =====================================================
       SESSION CLICK HANDLERS
       ===================================================== */

    content
        .querySelectorAll("[data-session-id]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const session = sessions.find(
                    session =>
                        session.id === button.dataset.sessionId
                );

                if (session) {
                    openSessionPreview(session);
                }
            });
        });
}


/* =========================================================
   CALENDAR SESSION
   ========================================================= */

function renderCalendarSession(session) {
    return `
        <button
            type="button"
            class="calendar-event ${escapeHTML(session.team)}"
            data-session-id="${escapeHTML(session.id)}"
        >
            <span class="calendar-event-team">
                ${escapeHTML(formatTeam(session.team))}
            </span>

            <span class="calendar-event-title">
                Chapter ${escapeHTML(session.chapter)}
                — ${escapeHTML(session.title)}
            </span>

            <span class="calendar-event-time">
                ${escapeHTML(formatSessionTime(session.time))}
            </span>
        </button>
    `;
}


/* =========================================================
   SESSION PREVIEW
   ========================================================= */

function openSessionPreview(session) {
    const existingPreview =
        document.getElementById("session-preview");

    if (existingPreview) {
        existingPreview.remove();
    }

    const overlay = document.createElement("div");

    overlay.className = "session-preview";
    overlay.id = "session-preview";

    const sessionDate = new Date(
        `${session.date}T00:00:00`
    );

    const formattedDate =
        sessionDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });

    overlay.innerHTML = `
        <div class="session-preview-card">

            <button
                type="button"
                class="session-preview-close"
                id="session-preview-close"
                aria-label="Close session preview"
            >
                ×
            </button>

            <div class="eyebrow">
                ${escapeHTML(formatTeam(session.team))}
            </div>

            <h2>
                ${escapeHTML(session.title)}
            </h2>

            <div class="session-preview-details">

                <div>
                    <span>Date</span>

                    <strong>
                        ${escapeHTML(formattedDate)}
                    </strong>
                </div>

                <div>
                    <span>Time</span>

                    <strong>
                        ${escapeHTML(
        formatSessionTime(session.time)
    )}
                    </strong>
                </div>

                <div>
                    <span>Chapter</span>

                    <strong>
                        ${escapeHTML(
        String(session.chapter)
    )}
                    </strong>
                </div>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    document
        .getElementById("session-preview-close")
        .addEventListener(
            "click",
            closeSessionPreview
        );

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeSessionPreview();
        }
    });

    document.addEventListener(
        "keydown",
        handleSessionPreviewEscape
    );
}


function closeSessionPreview() {
    const preview =
        document.getElementById("session-preview");

    if (preview) {
        preview.remove();
    }

    document.removeEventListener(
        "keydown",
        handleSessionPreviewEscape
    );
}


function handleSessionPreviewEscape(event) {
    if (event.key === "Escape") {
        closeSessionPreview();
    }
}


/* =========================================================
   SESSION TIME
   ========================================================= */

function formatSessionTime(time) {
    const [hours, minutes] =
        time.split(":").map(Number);

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);

    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });
}
