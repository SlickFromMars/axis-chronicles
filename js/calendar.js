let currentCalendarDate = new Date();

let calendarSessions = [];
let calendarSessionsPromise = null;
let calendarSessionsCampaignId = null;


/* =========================================================
   CALENDAR CONFIGURATION
   ========================================================= */

const DEFAULT_CALENDAR_TEXT = {
    eyebrow: "SESSION SCHEDULE",
    description:
        "Keep track of the journeys, encounters, and sessions ahead."
};

/* =========================================================
   CALENDAR PATHS
   ========================================================= */


function getCalendarText() {

    if (
        typeof activeCampaign === "undefined" ||
        !activeCampaign
    ) {
        return DEFAULT_CALENDAR_TEXT;
    }

    return {
        ...DEFAULT_CALENDAR_TEXT,
        ...(activeCampaign.text?.calendar || {})
    };
}


function getCalendarCampaignId() {

    if (
        typeof activeCampaign !== "undefined" &&
        activeCampaign
    ) {
        return activeCampaign.id;
    }

    return "default";
}


/* =========================================================
   CHARACTER BIRTHDAYS (OPTIONAL FEATURE)
   ========================================================= */

/*
    Enable per campaign in campaign.json:

        "birthdays": {
            "enabled": true
        }

    Optional settings:

        "label":    Text shown on a birthday ("Birthday").
        "icon":     Symbol used when a character has no portrait.
        "showAge":  Show "Turns 27" when the birthday includes a year.

    Characters store a birthday in data/characters.json:

        "birthday": "03-14"          (repeats every year)
        "birthday": "1998-03-14"     (same, and allows an age)

    Birthdays repeat every year on the calendar. A February 29
    birthday is shown on February 28 in years without a leap day.
*/

const DEFAULT_BIRTHDAY_CONFIG = {
    enabled: false,
    label: "Birthday",
    icon: "✦",
    showAge: true
};

/* Parsed birthdays for the active campaign. */
let calendarBirthdays = [];


function getBirthdayConfig() {

    if (
        typeof activeCampaign === "undefined" ||
        !activeCampaign ||
        !activeCampaign.birthdays ||
        typeof activeCampaign.birthdays !== "object"
    ) {
        return DEFAULT_BIRTHDAY_CONFIG;
    }

    return {
        ...DEFAULT_BIRTHDAY_CONFIG,
        ...activeCampaign.birthdays
    };
}


function isBirthdaysEnabled() {

    return getBirthdayConfig().enabled === true;
}


function isCalendarLeapYear(year) {

    return (
        year % 4 === 0 &&
        (year % 100 !== 0 || year % 400 === 0)
    );
}


/*
    Accepts "MM-DD" or "YYYY-MM-DD".
    Returns { month, day, year } (year may be null) or null
    if the value is not a real calendar date.
*/

function parseBirthday(value) {

    if (typeof value !== "string") {
        return null;
    }

    const match =
        value
            .trim()
            .match(
                /^(?:(\d{4})-)?(\d{1,2})-(\d{1,2})$/
            );

    if (!match) {
        return null;
    }

    const year =
        match[1]
            ? Number(match[1])
            : null;

    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12) {
        return null;
    }

    /*
        February allows 29 so a leap-day birthday is valid
        even when no year is given.
    */

    const daysInThisMonth =
        new Date(2000, month, 0).getDate();

    if (day < 1 || day > daysInThisMonth) {
        return null;
    }

    if (
        year !== null &&
        month === 2 &&
        day === 29 &&
        !isCalendarLeapYear(year)
    ) {
        return null;
    }

    return { month, day, year };
}


/*
    Text for a character's profile card, e.g. "March 14" or
    "March 14, 1998". Returns null when birthdays are off or the
    character has no valid birthday.
*/

function getCharacterBirthdayText(character) {

    if (
        !isBirthdaysEnabled() ||
        !character ||
        character.birthday === undefined ||
        character.birthday === null
    ) {
        return null;
    }

    const parsed =
        parseBirthday(character.birthday);

    if (!parsed) {
        return null;
    }

    /* 2000 is a leap year, so Feb 29 formats correctly. */

    const text =
        new Date(2000, parsed.month - 1, parsed.day)
            .toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric" }
            );

    return parsed.year !== null
        ? `${text}, ${parsed.year}`
        : text;
}


function buildBirthdayList(characters) {

    if (!Array.isArray(characters)) {
        return [];
    }

    const birthdays = [];

    characters.forEach(character => {

        if (
            !character ||
            character.birthday === undefined ||
            character.birthday === null ||
            character.birthday === ""
        ) {
            return;
        }

        const parsed =
            parseBirthday(character.birthday);

        if (!parsed) {

            console.warn(
                `Ignoring invalid birthday "${character.birthday}" for ${character.name || character.id}. Use MM-DD or YYYY-MM-DD.`
            );

            return;
        }

        birthdays.push({
            character,
            ...parsed
        });
    });

    return birthdays;
}


/*
    Load the campaign's characters and portraits so birthdays
    can be placed on the calendar. A failure here must never
    break the calendar itself.
*/

async function loadCalendarBirthdays() {

    calendarBirthdays = [];

    if (!isBirthdaysEnabled()) {
        return;
    }

    if (typeof loadCharacters !== "function") {
        return;
    }

    try {

        const characters =
            await loadCharacters();

        calendarBirthdays =
            buildBirthdayList(characters);

        if (
            calendarBirthdays.length &&
            typeof loadCharacterPortraits ===
                "function"
        ) {

            try {

                await loadCharacterPortraits(
                    calendarBirthdays.map(
                        entry => entry.character
                    )
                );

            } catch (portraitError) {

                /* Birthdays still work without portraits. */

                console.warn(
                    "Birthday portraits could not be loaded.",
                    portraitError
                );
            }
        }

    } catch (error) {

        console.warn(
            "Character birthdays could not be loaded.",
            error
        );

        calendarBirthdays = [];
    }
}


function getBirthdaysForDate(
    year,
    month,
    day
) {

    return calendarBirthdays
        .filter(entry => {

            if (
                entry.month === month &&
                entry.day === day
            ) {
                return true;
            }

            /* Leap-day birthdays fall on Feb 28 otherwise. */

            return (
                entry.month === 2 &&
                entry.day === 29 &&
                month === 2 &&
                day === 28 &&
                !isCalendarLeapYear(year)
            );
        })
        .sort((a, b) =>
            String(a.character.name || "")
                .localeCompare(
                    String(b.character.name || "")
                )
        );
}


function countBirthdaysInMonth(
    year,
    month,
    daysInMonth
) {

    let count = 0;

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        count +=
            getBirthdaysForDate(
                year,
                month,
                day
            ).length;
    }

    return count;
}


/* Age turned in the given year, or null if it shouldn't be shown. */

function getBirthdayAge(entry, year) {

    return (
        getBirthdayConfig().showAge !== false &&
        entry.year !== null &&
        year - entry.year > 0
    )
        ? year - entry.year
        : null;
}


/*
    "Birthdays this month" panel shown under the calendar grid.
    Lists the displayed month's birthdays in date order. Clicking
    one opens the character's profile (handled by the shared
    data-birthday-character-id listener).
*/

function renderBirthdaysThisMonth(
    year,
    month,
    daysInMonth,
    monthName,
    todayString
) {

    const items = [];

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        getBirthdaysForDate(year, month, day)
            .forEach(entry => items.push({ entry, day }));
    }

    if (!items.length) {
        return "";
    }

    const now = new Date();

    const isCurrentMonth =
        now.getFullYear() === year &&
        now.getMonth() + 1 === month;

    const title =
        isCurrentMonth
            ? "Birthdays this month"
            : `Birthdays in ${monthName}`;

    const rows =
        items
            .map(({ entry, day }) => {

                const character = entry.character;
                const name = character.name || "Unknown";

                const dateString =
                    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                const status =
                    dateString < todayString
                        ? "completed"
                        : dateString === todayString
                            ? "today"
                            : "upcoming";

                const age =
                    getBirthdayAge(entry, year);

                const portraitPath =
                    typeof characterPortraits !==
                        "undefined"
                        ? characterPortraits[character.id]
                        : null;

                const avatar =
                    portraitPath
                        ? `<img src="${escapeHTML(portraitPath)}" alt="" loading="lazy">`
                        : escapeHTML(getBirthdayConfig().icon);

                const dateLabel =
                    new Date(year, month - 1, day)
                        .toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                        );

                return `
                    <li>
                        <button
                            type="button"
                            class="birthday-list-item ${status}"
                            data-birthday-character-id="${escapeHTML(character.id)}"
                        >

                            <span
                                class="birthday-list-avatar"
                                aria-hidden="true"
                            >
                                ${avatar}
                            </span>

                            <span class="birthday-list-name">
                                ${escapeHTML(name)}
                            </span>

                            <span class="birthday-list-meta">
                                ${
                                    status === "today"
                                        ? "Today · "
                                        : ""
                                }${escapeHTML(dateLabel)}${
                                    age !== null
                                        ? ` · Turns ${age}`
                                        : ""
                                }
                            </span>

                        </button>
                    </li>
                `;
            })
            .join("");

    return `
        <section
            class="birthday-list"
            aria-label="${escapeHTML(title)}"
        >

            <h2 class="birthday-list-title">
                ${escapeHTML(title)}
            </h2>

            <ul class="birthday-list-items">
                ${rows}
            </ul>

        </section>
    `;
}


function renderCalendarBirthday(
    entry,
    year,
    dateString,
    todayString
) {

    const config = getBirthdayConfig();
    const character = entry.character;
    const name = character.name || "Unknown";

    const age =
        getBirthdayAge(entry, year);

    const status =
        dateString < todayString
            ? "completed"
            : dateString === todayString
                ? "today"
                : "upcoming";

    const portraitPath =
        typeof characterPortraits !==
            "undefined"
            ? characterPortraits[character.id]
            : null;

    const avatar =
        portraitPath
            ? `
                <img
                    src="${escapeHTML(portraitPath)}"
                    alt=""
                    loading="lazy"
                >
            `
            : escapeHTML(config.icon);

    const label =
        age !== null
            ? `Turns ${age}`
            : String(config.label);

    const accessibleLabel =
        age !== null
            ? `${name}'s ${config.label}, turns ${age}`
            : `${name}'s ${config.label}`;

    return `
        <button
            type="button"
            class="calendar-birthday ${status}"
            data-birthday-character-id="${escapeHTML(character.id)}"
            aria-label="${escapeHTML(accessibleLabel)}"
            title="${escapeHTML(accessibleLabel)}"
        >

            <span
                class="calendar-birthday-avatar"
                aria-hidden="true"
            >
                ${avatar}
            </span>

            <span class="calendar-birthday-content">

                <span class="calendar-birthday-label">
                    ${escapeHTML(label)}
                </span>

                <span class="calendar-birthday-name">
                    ${escapeHTML(name)}
                </span>

            </span>

        </button>
    `;
}


/* =========================================================
   LOAD SESSIONS
   ========================================================= */

async function loadSessions() {

    const campaignId =
        getCalendarCampaignId();


    /*
        Clear the cache if the active campaign changes.
    */

    if (
        calendarSessionsCampaignId !==
        campaignId
    ) {

        calendarSessions = [];
        calendarSessionsPromise = null;

        calendarSessionsCampaignId =
            campaignId;
    }


    if (
        Array.isArray(calendarSessions)
    ) {

        if (
            calendarSessions.length ||
            calendarSessionsPromise === null &&
            calendarSessionsCampaignId ===
                campaignId &&
            calendarSessions.length === 0
        ) {

            /*
                Do not use this shortcut until
                a campaign path has actually been
                requested below.
            */

        }
    }


    if (
        calendarSessionsPromise
    ) {
        return calendarSessionsPromise;
    }


    const sessionPath =
        typeof getCampaignDataPath ===
            "function"
            ? getCampaignDataPath(
                "sessions"
            )
            : "campaigns/breaking-the-axis/data/sessions.json";


    if (!sessionPath) {

        throw new Error(
            "No session data path configured for this campaign."
        );
    }


    calendarSessionsPromise =
        fetch(sessionPath)
            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `Could not load sessions (${response.status})`
                    );
                }


                return response.json();
            })
            .then(data => {

                if (
                    !Array.isArray(data)
                ) {

                    throw new Error(
                        "sessions.json must contain an array."
                    );
                }


                calendarSessions =
                    data;


                return calendarSessions;
            })
            .catch(error => {

                calendarSessionsPromise =
                    null;

                throw error;
            });


    return calendarSessionsPromise;
}


/* =========================================================
   CALENDAR PATHS
   ========================================================= */

function getCalendarFilePath() {

    if (
        typeof getCampaignDataPath === "function"
    ) {

        const configuredPath =
            getCampaignDataPath("calendar");

        if (configuredPath) {
            return configuredPath;
        }
    }

    /*
        Legacy fallback.

        This keeps the calendar functional if a campaign
        does not define an ICS file.
    */
    return "data/sessions.ics";
}

function hasCalendarFile() {

    return Boolean(
        getCalendarFilePath()
    );
}


/* =========================================================
   CALENDAR DOWNLOAD NAME
   ========================================================= */

function getCalendarDownloadName() {

    const campaignId =
        typeof activeCampaign !==
            "undefined" &&
        activeCampaign
            ? activeCampaign.id
            : "campaign";


    return `${String(
        campaignId
    )
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        ) || "campaign"}.ics`;
}


/* =========================================================
   SHOW CALENDAR
   ========================================================= */

async function showCalendar() {

    const content =
        document.getElementById(
            "content"
        );


    if (!content) {

        console.error(
            "Calendar could not load: #content was not found."
        );

        return;
    }


    content.innerHTML = `
        <section
            class="calendar-page
                   calendar-loading-page"
        >

            <div class="calendar-loading">

                <div
                    class="calendar-loading-mark"
                    aria-hidden="true"
                >
                    ◆
                </div>

                <p>
                    Loading session calendar...
                </p>

            </div>

        </section>
    `;


    try {

        const sessions =
            await loadSessions();


        await loadCalendarBirthdays();


        renderCalendar(
            sessions
        );


    } catch (error) {

        console.error(
            error
        );


        content.innerHTML = `
            <section class="calendar-page">

                <div class="calendar-error">

                    <div
                        class="calendar-error-icon"
                        aria-hidden="true"
                    >
                        !
                    </div>


                    <h1>
                        Calendar Unavailable
                    </h1>


                    <p>
                        The campaign calendar could not
                        be loaded. Check your session data
                        file and try again.
                    </p>

                </div>

            </section>
        `;
    }
}


/* =========================================================
   RENDER CALENDAR
   ========================================================= */

function renderCalendar(
    sessions
) {

    const content =
        document.getElementById(
            "content"
        );


    if (!content) {
        return;
    }


    const calendarText =
        getCalendarText();


    const year =
        currentCalendarDate.getFullYear();


    const month =
        currentCalendarDate.getMonth();


    const monthName =
        new Intl.DateTimeFormat(
            "en-US",
            {
                month: "long"
            }
        ).format(
            currentCalendarDate
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const today =
        new Date();


    const todayString =
        formatCalendarDate(
            today
        );


    const monthSessions =
        sessions.filter(
            session => {

                if (
                    !session.date
                ) {
                    return false;
                }


                const [
                    sessionYear,
                    sessionMonth
                ] =
                    session.date
                        .split("-")
                        .map(Number);


                return (
                    sessionYear ===
                        year &&
                    sessionMonth ===
                        month + 1
                );
            }
        );


    const upcomingCount =
        monthSessions.filter(
            session =>
                session.date >=
                todayString
        ).length;


    const pastCount =
        monthSessions.filter(
            session =>
                session.date <
                todayString
        ).length;


    const birthdaysEnabled =
        isBirthdaysEnabled();


    const monthBirthdayCount =
        birthdaysEnabled
            ? countBirthdaysInMonth(
                year,
                month + 1,
                daysInMonth
            )
            : 0;


    const calendarFileAvailable =
        hasCalendarFile();


    let calendarHTML = `

        <section class="calendar-page">

            <!-- =========================================
                 CALENDAR HEADER
                 ========================================= -->

            <div class="calendar-heading">

                <div class="calendar-heading-top">

                    <div>

                        <div class="eyebrow">
                            ${escapeHTML(
                                calendarText.eyebrow
                            )}
                        </div>


                        <h1>
                            ${escapeHTML(
                                monthName
                            )}

                            <span>
                                ${year}
                            </span>
                        </h1>


                        <p
                            class="calendar-description"
                        >
                            ${escapeHTML(
                                calendarText.description
                            )}
                        </p>

                    </div>


                    <div
                        class="calendar-heading-mark"
                        aria-hidden="true"
                    >
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
                            <span>
                                ←
                            </span>
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
                            <span>
                                →
                            </span>
                        </button>

                    </div>


                    <div class="calendar-actions">

                        ${
                            calendarFileAvailable
                                ? `
                                    <button
                                        type="button"
                                        class="calendar-subscribe"
                                        id="calendar-subscribe"
                                    >
                                        <span
                                            aria-hidden="true"
                                        >
                                            ↗
                                        </span>

                                        Subscribe
                                    </button>


                                    <a
                                        class="calendar-download"
                                        id="calendar-download"
                                        href="${escapeHTML(
                                            getCalendarFilePath()
                                        )}"
                                        download="${escapeHTML(
                                            getCalendarDownloadName()
                                        )}"
                                    >
                                        <span
                                            aria-hidden="true"
                                        >
                                            ↓
                                        </span>

                                        Download
                                    </a>
                                `
                                : ""
                        }

                    </div>

                </div>


                <!-- =====================================
                     MONTH SUMMARY
                     ===================================== -->

                <div class="calendar-summary">

                    <div
                        class="calendar-summary-item"
                    >

                        <strong>
                            ${monthSessions.length}
                        </strong>


                        <span>
                            ${
                                monthSessions.length ===
                                1
                                    ? "Session"
                                    : "Sessions"
                            }
                        </span>

                    </div>


                    <div
                        class="calendar-summary-divider"
                    ></div>


                    <div
                        class="calendar-summary-item"
                    >

                        <strong>
                            ${upcomingCount}
                        </strong>


                        <span>
                            Upcoming
                        </span>

                    </div>


                    <div
                        class="calendar-summary-divider"
                    ></div>


                    <div
                        class="calendar-summary-item"
                    >

                        <strong>
                            ${pastCount}
                        </strong>


                        <span>
                            Completed
                        </span>

                    </div>

                    ${
                        birthdaysEnabled
                            ? `
                                <div
                                    class="calendar-summary-divider"
                                ></div>


                                <div
                                    class="calendar-summary-item"
                                >

                                    <strong>
                                        ${monthBirthdayCount}
                                    </strong>


                                    <span>
                                        ${
                                            monthBirthdayCount === 1
                                                ? "Birthday"
                                                : "Birthdays"
                                        }
                                    </span>

                                </div>
                            `
                            : ""
                    }

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

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

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
            `${year}-${String(
                month + 1
            ).padStart(
                2,
                "0"
            )}-${String(
                day
            ).padStart(
                2,
                "0"
            )}`;


        const daySessions =
            sessions.filter(
                session =>
                    session.date ===
                    date
            );


        const dayBirthdays =
            birthdaysEnabled
                ? getBirthdaysForDate(
                    year,
                    month + 1,
                    day
                )
                : [];


        const isToday =
            date ===
            todayString;


        const isPast =
            date <
            todayString;


        const dayClasses = [
            "calendar-day",
            isToday
                ? "today"
                : "",
            isPast
                ? "past"
                : "",
            daySessions.length ||
            dayBirthdays.length
                ? "has-events"
                : ""
        ]
            .filter(Boolean)
            .join(" ");


        calendarHTML += `

            <div
                class="${dayClasses}"
                data-calendar-date="${date}"
            >

                <div
                    class="calendar-day-header"
                >

                    <span
                        class="calendar-date"
                    >
                        ${day}
                    </span>


                    ${
                        isToday
                            ? `
                                <span
                                    class="calendar-today-marker"
                                >
                                    TODAY
                                </span>
                            `
                            : ""
                    }

                </div>


                ${
                    daySessions.length ||
                    dayBirthdays.length
                        ? `
                            <div
                                class="calendar-events"
                            >
                                ${dayBirthdays
                                    .map(
                                        entry =>
                                            renderCalendarBirthday(
                                                entry,
                                                year,
                                                date,
                                                todayString
                                            )
                                    )
                                    .join("")}

                                ${daySessions
                                    .map(
                                        renderCalendarSession
                                    )
                                    .join("")}
                            </div>
                        `
                        : `
                            <div
                                class="calendar-empty-day"
                            >
                            </div>
                        `
                }

            </div>
        `;
    }


    calendarHTML += `

                </div>

            </div>


            ${
                birthdaysEnabled
                    ? renderBirthdaysThisMonth(
                        year,
                        month + 1,
                        daysInMonth,
                        monthName,
                        todayString
                    )
                    : ""
            }


            <!-- =========================================
                 LEGEND
                 ========================================= -->

            <div class="calendar-footer">

                <div
                    class="calendar-footer-note"
                >
                    ${
                        birthdaysEnabled
                            ? "Select a session or birthday to view its details."
                            : "Select a session to view its details."
                    }
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

function attachCalendarListeners(
    sessions
) {

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


    if (
        previousButton
    ) {

        previousButton.addEventListener(
            "click",
            () => {

                currentCalendarDate.setMonth(
                    currentCalendarDate.getMonth() -
                    1
                );


                renderCalendar(
                    sessions
                );
            }
        );
    }


    if (
        nextButton
    ) {

        nextButton.addEventListener(
            "click",
            () => {

                currentCalendarDate.setMonth(
                    currentCalendarDate.getMonth() +
                    1
                );


                renderCalendar(
                    sessions
                );
            }
        );
    }


    if (
        todayButton
    ) {

        todayButton.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date();


                renderCalendar(
                    sessions
                );
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


    if (
        subscribeButton
    ) {

        subscribeButton.addEventListener(
            "click",
            async () => {

                const calendarURL =
                    getCalendarFilePath();


                if (!calendarURL) {
                    return;
                }


                try {

                    await navigator.clipboard.writeText(
                        calendarURL
                    );


                    subscribeButton.innerHTML = `
                        <span
                            aria-hidden="true"
                        >
                            ✓
                        </span>

                        URL Copied
                    `;


                    subscribeButton.classList.add(
                        "copied"
                    );


                    setTimeout(
                        () => {

                            /*
                                Don't assume that the
                                button still exists after
                                the timeout.
                            */

                            if (
                                !document.body.contains(
                                    subscribeButton
                                )
                            ) {
                                return;
                            }


                            subscribeButton.innerHTML = `
                                <span
                                    aria-hidden="true"
                                >
                                    ↗
                                </span>

                                Subscribe
                            `;


                            subscribeButton.classList.remove(
                                "copied"
                            );

                        },
                        2000
                    );


                } catch (error) {

                    console.error(
                        error
                    );


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
        .querySelectorAll(
            "[data-session-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const session =
                            sessions.find(
                                session =>
                                    session.id ===
                                    button.dataset
                                        .sessionId
                            );


                        if (
                            session
                        ) {

                            openSessionPreview(
                                session
                            );
                        }
                    }
                );
            }
        );


    /* =====================================================
       BIRTHDAY CLICK HANDLERS
       ===================================================== */

    document
        .querySelectorAll(
            "[data-birthday-character-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const entry =
                            calendarBirthdays.find(
                                item =>
                                    String(
                                        item.character.id
                                    ) ===
                                    button.dataset
                                        .birthdayCharacterId
                            );


                        if (
                            entry &&
                            typeof openCharacterProfile ===
                                "function"
                        ) {

                            openCharacterProfile(
                                entry.character
                            );
                        }
                    }
                );
            }
        );
}


/* =========================================================
   CALENDAR SESSION
   ========================================================= */

function renderCalendarSession(
    session
) {

    const sessionDate =
        session.date ||
        "";


    const today =
        formatCalendarDate(
            new Date()
        );


    const status =
        sessionDate <
            today
            ? "completed"
            : sessionDate ===
                today
                ? "today"
                : "upcoming";


    return `

        <button
            type="button"
            class="
                calendar-event
                ${escapeHTML(
                    session.team ||
                    ""
                )}
                ${status}
            "
            data-session-id="${escapeHTML(
                session.id
            )}"
        >

            <span
                class="calendar-event-accent"
            ></span>


            <span
                class="calendar-event-content"
            >

                <span
                    class="calendar-event-team"
                >
                    ${escapeHTML(
                        formatTeam(
                            session.team
                        )
                    )}
                </span>


                <span
                    class="calendar-event-title"
                >
                    ${escapeHTML(
                        session.title
                    )}
                </span>


                <span
                    class="calendar-event-time"
                >
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

function openSessionPreview(
    session
) {

    closeSessionPreview();


    const overlay =
        document.createElement(
            "div"
        );


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


    if (
        session.date <
        today
    ) {

        statusText =
            "COMPLETED";


        statusClass =
            "completed";


    } else if (
        session.date ===
        today
    ) {

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


            <div
                class="session-preview-top"
            >

                <div
                    class="session-preview-mark"
                    aria-hidden="true"
                >
                    ◈
                </div>


                <div>

                    <div
                        class="eyebrow"
                    >
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


            <h2
                id="session-preview-title"
            >
                ${escapeHTML(
                    session.title
                )}
            </h2>


            <div
                class="session-preview-divider"
            ></div>


            <div
                class="session-preview-details"
            >

                <div
                    class="session-preview-detail"
                >

                    <span
                        class="session-preview-detail-icon"
                        aria-hidden="true"
                    >
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


                <div
                    class="session-preview-detail"
                >

                    <span
                        class="session-preview-detail-icon"
                        aria-hidden="true"
                    >
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


                ${
                    session.chapter !==
                    undefined &&
                    session.chapter !==
                    null &&
                    session.chapter !==
                    ""
                        ? `
                            <div
                                class="session-preview-detail"
                            >

                                <span
                                    class="session-preview-detail-icon"
                                    aria-hidden="true"
                                >
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
                        `
                        : ""
                }

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


    if (
        closeButton
    ) {

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


    if (
        closeButton
    ) {

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


    if (
        preview
    ) {

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

function handleSessionPreviewEscape(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        closeSessionPreview();
    }
}


/* =========================================================
   SESSION TIME
   ========================================================= */

function formatSessionTime(
    time
) {

    if (!time) {
        return "Time TBD";
    }


    const [
        hours,
        minutes
    ] =
        time
            .split(":")
            .map(Number);


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

function formatCalendarDate(
    date
) {

    return [
        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => {

            const entities = {

                "&":
                    "&amp;",

                "<":
                    "&lt;",

                ">":
                    "&gt;",

                '"':
                    "&quot;",

                "'":
                    "&#39;"
            };


            return entities[
                character
            ];
        }
    );
}
