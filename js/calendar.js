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

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();

    const monthName =
        new Intl.DateTimeFormat("en-US", {
            month: "long"
        }).format(currentCalendarDate);

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

                <div class="calendar-title-row">

                    <h1>
                        ${monthName} ${year}
                    </h1>

                    <div class="calendar-navigation">

                        <button
                            type="button"
                            class="calendar-nav-button"
                            id="calendar-previous"
                            aria-label="Previous month"
                        >
                            ←
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
                            →
                        </button>

                    </div>

                </div>

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


    /* =====================================================
       EMPTY CELLS
       ===================================================== */

    for (let i = 0; i < firstDay; i++) {

        calendarHTML += `
            <div class="calendar-day empty"></div>
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
       MONTH NAVIGATION
       ===================================================== */

    document
        .getElementById("calendar-previous")
        .addEventListener("click", () => {

            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() - 1
            );

            renderCalendar(sessions);
        });


    document
        .getElementById("calendar-next")
        .addEventListener("click", () => {

            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() + 1
            );

            renderCalendar(sessions);
        });


    document
        .getElementById("calendar-today")
        .addEventListener("click", () => {

            currentCalendarDate = new Date();

            renderCalendar(sessions);
        });


    /* =====================================================
       CALENDAR SUBSCRIPTION
       ===================================================== */

    const subscribeButton =
        document.getElementById(
            "calendar-subscribe"
        );

    subscribeButton.addEventListener(
        "click",
        async () => {

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
        }
    );


    /* =====================================================
       SESSION CLICK HANDLERS
       ===================================================== */

    content
        .querySelectorAll("[data-session-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const session = sessions.find(
                        session =>
                            session.id ===
                            button.dataset.sessionId
                    );

                    if (session) {
                        openSessionPreview(session);
                    }
                }
            );
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
                ${escapeHTML(
        formatTeam(session.team)
    )}
            </span>

            <span class="calendar-event-title">
                ${escapeHTML(session.title)}
            </span>

            <span class="calendar-event-time">
                ${escapeHTML(
        formatSessionTime(session.time)
    )}
            </span>

        </button>
    `;
}


/* =========================================================
   SESSION PREVIEW
   ========================================================= */

function openSessionPreview(session) {
    const existingPreview =
        document.getElementById(
            "session-preview"
        );

    if (existingPreview) {
        existingPreview.remove();
    }


    const overlay =
        document.createElement("div");

    overlay.className =
        "session-preview";

    overlay.id =
        "session-preview";


    const sessionDate = new Date(
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
                ${escapeHTML(
        formatTeam(session.team)
    )}
            </div>

            <h2>
                ${escapeHTML(session.title)}
            </h2>

            <div class="session-preview-details">

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

                <div>

                    <span>
                        Chapter
                    </span>

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
        .getElementById(
            "session-preview-close"
        )
        .addEventListener(
            "click",
            closeSessionPreview
        );


    overlay.addEventListener(
        "click",
        event => {

            if (event.target === overlay) {
                closeSessionPreview();
            }

        }
    );


    document.addEventListener(
        "keydown",
        handleSessionPreviewEscape
    );
}


function closeSessionPreview() {
    const preview =
        document.getElementById(
            "session-preview"
        );

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

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}
