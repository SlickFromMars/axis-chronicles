
let allQuests = [];
let currentTeam = "all";

async function initializeJournal() {
    const content = document.getElementById("content");

    try {
        allQuests = await loadQuests();
        showQuests();
    } catch (error) {
        console.error(error);
        content.innerHTML = `
            <p class="error">
                The journal could not be loaded.
                Check your data files and try again.
            </p>
        `;
    }
}

function showQuests() {
    const filteredQuests = allQuests.filter(quest =>
        currentTeam === "all" ||
        quest.team === currentTeam ||
        quest.team === "shared"
    );

    renderQuestList(filteredQuests);
}

function setTeam(team) {
    currentTeam = team;
    showQuests();

    document.querySelectorAll("[data-team]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.team === team
        );
    });

    document.querySelectorAll("[data-page]").forEach(button => {
        button.classList.remove("active");
    });
}

document.querySelectorAll("[data-team]").forEach(button => {
    button.addEventListener("click", () => {
        setTeam(button.dataset.team);
    });
});

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        const page = button.dataset.page;

        document.querySelectorAll(".nav-item")
            .forEach(item => item.classList.remove("active"));

        button.classList.add("active");

        currentTeam = "all";

        if (page === "quests") {
            showQuests();
        } else {
            document.getElementById("content").innerHTML = `
                <div class="placeholder">
                    <h2>${escapeHTML(
                        page.charAt(0).toUpperCase() + page.slice(1)
                    )}</h2>
                    <p>This section will be added in a future stage.</p>
                </div>
            `;
        }
    });
});

initializeJournal();