let currentCalendarDate = new Date();


/* =========================================================
   LOAD SESSIONS
   ========================================================= */

async function loadSessions() {
    const response = await fetch("data/sessions.json");

    if (!response.ok) {
        throw new Error("Could not load sessions");
    }

    return await response.json();
}


/* =========================================================
   SHOW CALENDAR
   ========================================================= */

async function showCalendar() {
    const content = document.getElementById("content");

    if (!content) {
        console.error("Calendar could not load: #content was not found.");
        return;
    }

    content.innerHTML = `
        <section class="calendar-page calendar-loading-page">
            <div class="calendar-loading">
                <div class="calendar-loading-mark">◆</div>
                <p>Loading session calendar...</p>
            </div>
        </section>
    `;

    try {
        const sessions = await loadSessions();

        renderCalendar(sessions);

    } catch (error) {
        console.error(error);

        content.innerHTML = `
            <section class="calendar-page">
                <div class="calendar-error">

                    <div class="calendar-error-icon">
                        !
                    </div>

                    <h1>Calendar Unavailable</h1>

                    <p>
                        The campaign calendar could not be loaded.
                        Check your session data file and try again.
                    </p>

                </div>
            </section>
        `;
    }
}


/* =========================================================
   RENDER CALENDAR
   ========================================================= */

function renderCalendar(sessions) {
    const content = document.getElementById("content");

    if (!content) {
        return;
    }

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();

    const monthName =
        new Intl.DateTimeFormat("en-US", {
            month: "long"
        }).format(currentCalendarDate);

    const firstDay =
        new Date(year, month, 1).getDay();

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    const today =
        new Date();

    const todayString =
        formatCalendarDate(today);


    const monthSessions =
        sessions.filter(session => {

            if (!session.date) {
                return false;
            }

            const [sessionYear, sessionMonth] =
                session.date.split("-").map(Number);

            return (
                sessionYear === year &&
                sessionMonth === month + 1
            );
        });


    const upcomingCount =
        monthSessions.filter(session =>
            session.date >= todayString
        ).length;


    const pastCount =
        monthSessions.filter(session =>
            session.date < todayString
        ).length;


    let calendarHTML = `
        <section class="calendar-page">

            <!-- =========================================
                 CALENDAR HEADER
                 ========================================= -->

            <div class="calendar-heading">

                <div class="calendar-heading-top">

                    <div>
                        <div class="eyebrow">
                            SESSION SCHEDULE
                        </div>

                        <h1>
                            ${escapeHTML(monthName)}
                            <span>${year}</span>
                        </h1>

                        <p class="calendar-description">
                            Keep track of the journeys,
                            encounters, and sessions ahead.
                        </p>
                    </div>

                    <div class="calendar-heading-mark" aria-hidden="true">
                        ◈
                    </div>

                </div>


                <!-- =====================================
                     MONTH NAVIGATION
                     ===================================== -->

                <div class="calendar-toolbar">

                    <div class="calendar-navigation">

                        <button
                            type="button"
                            class="calendar-nav-button"
                            id="calendar-previous"
                            aria-label="Previous month"
                        >
                            <span>←</span>
                        </button>

                        <button
                            type="button"
                            class="calendar-today-button"
                            id="calendar-today"
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            class="calendar-nav-button"
                            id="calendar-next"
                            aria-label="Next month"
                        >
                            <span>→</span>
                        </button>

                    </div>


                    <div class="calendar-actions">

                        <button
                            type="button"
                            class="calendar-subscribe"
                            id="calendar-subscribe"
                        >
                            <span aria-hidden="true">↗</span>
                            Subscribe
                        </button>

                        <a
                            class="calendar-download"
                            href="data/sessions.ics"
                            download="breaking-the-axis.ics"
                        >
                            <span aria-hidden="true">↓</span>
                            Download
                        </a>

                    </div>

                </div>


                <!-- =====================================
                     MONTH SUMMARY
                     ===================================== -->

                <div class="calendar-summary">

                    <div class="calendar-summary-item">

                        <strong>
                            ${monthSessions.length}
                        </strong>

                        <span>
                            ${monthSessions.length === 1
            ? "Session"
            : "Sessions"
        }
                        </span>

                    </div>

                    <div class="calendar-summary-divider"></div>

                    <div class="calendar-summary-item">

                        <strong>
                            ${upcomingCount}
                        </strong>

                        <span>
                            Upcoming
                        </span>

                    </div>

                    <div class="calendar-summary-divider"></div>

                    <div class="calendar-summary-item">

                        <strong>
                            ${pastCount}
                        </strong>

                        <span>
                            Completed
                        </span>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 CALENDAR
                 ========================================= -->

            <div class="calendar-shell">

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


    /* =====================================================
       EMPTY CELLS
       ===================================================== */

    for (let i = 0; i < firstDay; i++) {

        calendarHTML += `
            <div class="calendar-day empty">
            </div>
        `;
    }


    /* =====================================================
       DAYS OF MONTH
       ===================================================== */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        const daySessions =
            sessions.filter(
                session => session.date === date
            );


        const isToday =
            date === todayString;


        const isPast =
            date < todayString;


        const dayClasses = [
            "calendar-day",
            isToday ? "today" : "",
            isPast ? "past" : "",
            daySessions.length ? "has-events" : ""
        ]
            .filter(Boolean)
            .join(" ");


        calendarHTML += `
            <div
                class="${dayClasses}"
                data-calendar-date="${date}"
            >

                <div class="calendar-day-header">

                    <span class="calendar-date">
                        ${day}
                    </span>

                    ${isToday
                ? `
                                <span class="calendar-today-marker">
                                    TODAY
                                </span>
                            `
                : ""
            }

                </div>

                ${daySessions.length
                ? `
                            <div class="calendar-events">
                                ${daySessions
                    .map(renderCalendarSession)
                    .join("")}
                            </div>
                        `
                : `
                            <div class="calendar-empty-day">
                            </div>
                        `
            }

            </div>
        `;
    }


    calendarHTML += `
                </div>
            </div>


            <!-- =========================================
                 LEGEND
                 ========================================= -->

            <div class="calendar-footer">
                <div class="calendar-footer-note">
                    Select a session to view its details.
                </div>

            </div>

        </section>
    `;


    content.innerHTML =
        calendarHTML;


    attachCalendarListeners(
        sessions
    );
}


/* =========================================================
   CALENDAR LISTENERS
   ========================================================= */

function attachCalendarListeners(sessions) {

    const previousButton =
        document.getElementById(
            "calendar-previous"
        );

    const nextButton =
        document.getElementById(
            "calendar-next"
        );

    const todayButton =
        document.getElementById(
            "calendar-today"
        );


    if (previousButton) {

        previousButton.addEventListener(
            "click",
            () => {

                currentCalendarDate.setMonth(
                    currentCalendarDate.getMonth() - 1
                );

                renderCalendar(sessions);
            }
        );
    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            () => {

                currentCalendarDate.setMonth(
                    currentCalendarDate.getMonth() + 1
                );

                renderCalendar(sessions);
            }
        );
    }


    if (todayButton) {

        todayButton.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date();

                renderCalendar(sessions);
            }
        );
    }


    /* =====================================================
       CALENDAR SUBSCRIPTION
       ===================================================== */

    const subscribeButton =
        document.getElementById(
            "calendar-subscribe"
        );


    if (subscribeButton) {

        subscribeButton.addEventListener(
            "click",
            async () => {

                const calendarURL =
                    new URL(
                        "data/sessions.ics",
                        window.location.href
                    ).href;


                try {

                    await navigator.clipboard.writeText(
                        calendarURL
                    );


                    subscribeButton.innerHTML = `
                        <span aria-hidden="true">✓</span>
                        URL Copied
                    `;


                    subscribeButton.classList.add(
                        "copied"
                    );


                    setTimeout(() => {

                        subscribeButton.innerHTML = `
                            <span aria-hidden="true">↗</span>
                            Subscribe
                        `;

                        subscribeButton.classList.remove(
                            "copied"
                        );

                    }, 2000);


                } catch (error) {

                    console.error(error);

                    prompt(
                        "Copy this calendar subscription URL:",
                        calendarURL
                    );
                }
            }
        );
    }


    /* =====================================================
       SESSION CLICK HANDLERS
       ===================================================== */

    document
        .querySelectorAll("[data-session-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const session =
                        sessions.find(
                            session =>
                                session.id ===
                                button.dataset.sessionId
                        );


                    if (session) {
                        openSessionPreview(
                            session
                        );
                    }
                }
            );
        });
}


/* =========================================================
   CALENDAR SESSION
   ========================================================= */

function renderCalendarSession(session) {

    const sessionDate =
        session.date || "";


    const today =
        formatCalendarDate(
            new Date()
        );


    const status =
        sessionDate < today
            ? "completed"
            : sessionDate === today
                ? "today"
                : "upcoming";


    return `
        <button
            type="button"
            class="
                calendar-event
                ${escapeHTML(session.team || "")}
                ${status}
            "
            data-session-id="${escapeHTML(session.id)}"
        >

            <span class="calendar-event-accent"></span>

            <span class="calendar-event-content">

                <span class="calendar-event-team">
                    ${escapeHTML(
        formatTeam(
            session.team
        )
    )}
                </span>

                <span class="calendar-event-title">
                    ${escapeHTML(
        session.title
    )}
                </span>

                <span class="calendar-event-time">
                    ${escapeHTML(
        formatSessionTime(
            session.time
        )
    )}
                </span>

            </span>

        </button>
    `;
}


/* =========================================================
   SESSION PREVIEW
   ========================================================= */

function openSessionPreview(session) {

    closeSessionPreview();


    const overlay =
        document.createElement("div");


    overlay.className =
        "session-preview";


    overlay.id =
        "session-preview";


    const sessionDate =
        new Date(
            `${session.date}T00:00:00`
        );


    const formattedDate =
        sessionDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    const today =
        formatCalendarDate(
            new Date()
        );


    let statusText =
        "UPCOMING";

    let statusClass =
        "upcoming";


    if (session.date < today) {

        statusText =
            "COMPLETED";

        statusClass =
            "completed";

    } else if (session.date === today) {

        statusText =
            "TODAY";

        statusClass =
            "today";
    }


    overlay.innerHTML = `
        <div
            class="
                session-preview-card
                ${statusClass}
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-preview-title"
        >

            <button
                type="button"
                class="session-preview-close"
                id="session-preview-close"
                aria-label="Close session preview"
            >
                ×
            </button>


            <div class="session-preview-top">

                <div class="session-preview-mark">
                    ◈
                </div>

                <div>

                    <div class="eyebrow">
                        ${escapeHTML(
        formatTeam(
            session.team
        )
    )}
                    </div>

                    <span
                        class="
                            session-preview-status
                            ${statusClass}
                        "
                    >
                        ${statusText}
                    </span>

                </div>

            </div>


            <h2 id="session-preview-title">
                ${escapeHTML(
        session.title
    )}
            </h2>


            <div class="session-preview-divider"></div>


            <div class="session-preview-details">

                <div class="session-preview-detail">

                    <span class="session-preview-detail-icon">
                        ◷
                    </span>

                    <div>

                        <span>
                            Date
                        </span>

                        <strong>
                            ${escapeHTML(
        formattedDate
    )}
                        </strong>

                    </div>

                </div>


                <div class="session-preview-detail">

                    <span class="session-preview-detail-icon">
                        ⌚
                    </span>

                    <div>

                        <span>
                            Time
                        </span>

                        <strong>
                            ${escapeHTML(
        formatSessionTime(
            session.time
        )
    )}
                        </strong>

                    </div>

                </div>


                <div class="session-preview-detail">

                    <span class="session-preview-detail-icon">
                        §
                    </span>

                    <div>

                        <span>
                            Chapter
                        </span>

                        <strong>
                            ${escapeHTML(
        String(
            session.chapter
        )
    )}
                        </strong>

                    </div>

                </div>

            </div>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    const closeButton =
        document.getElementById(
            "session-preview-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeSessionPreview
        );
    }


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {
                closeSessionPreview();
            }
        }
    );


    document.addEventListener(
        "keydown",
        handleSessionPreviewEscape
    );


    document.body.classList.add(
        "session-preview-open"
    );


    if (closeButton) {
        closeButton.focus();
    }
}


/* =========================================================
   CLOSE SESSION PREVIEW
   ========================================================= */

function closeSessionPreview() {

    const preview =
        document.getElementById(
            "session-preview"
        );


    if (preview) {
        preview.remove();
    }


    document.body.classList.remove(
        "session-preview-open"
    );


    document.removeEventListener(
        "keydown",
        handleSessionPreviewEscape
    );
}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

function handleSessionPreviewEscape(event) {

    if (event.key === "Escape") {
        closeSessionPreview();
    }
}


/* =========================================================
   SESSION TIME
   ========================================================= */

function formatSessionTime(time) {

    if (!time) {
        return "Time TBD";
    }


    const [hours, minutes] =
        time.split(":").map(Number);


    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return time;
    }


    const date =
        new Date();


    date.setHours(
        hours,
        minutes,
        0,
        0
    );


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

function formatCalendarDate(date) {

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[
                character
            ];
        }
    );
}
