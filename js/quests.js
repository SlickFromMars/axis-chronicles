
async function loadQuests() {
    const response = await fetch("data/quests.json");

    if (!response.ok) {
        throw new Error("Could not load quests");
    }

    return await response.json();
}

function renderQuestList(quests) {
    const content = document.getElementById("content");

    if (quests.length === 0) {
        content.innerHTML = `
            <p class="empty-state">
                No quests have been recorded here yet.
            </p>
        `;
        return;
    }

    content.innerHTML = `
        <div class="quest-list">
            ${quests.map(quest => `
                <button class="quest-card"
                        data-quest-id="${quest.id}">
                    <div class="quest-card-top">
                        <span class="quest-category">
                            ${escapeHTML(quest.category)}
                            QUEST
                        </span>
                        <span class="quest-status ${escapeHTML(quest.status)}">
                            ${escapeHTML(formatStatus(quest.status))}
                        </span>
                    </div>
                    <h2>${escapeHTML(quest.title)}</h2>
                    <p>${escapeHTML(quest.description)}</p>
                </button>
            `).join("")}
        </div>
    `;

    content.querySelectorAll("[data-quest-id]")
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
}

function renderQuestDetail(quest) {
    const content = document.getElementById("content");

    content.innerHTML = `
        <button class="back-button" id="back-button">
            ← Back to quests
        </button>

        <div class="quest-detail">
            <div class="quest-card-top">
                <span class="quest-category">
                    ${escapeHTML(quest.category)} QUEST
                </span>
                <span class="quest-status ${escapeHTML(quest.status)}">
                    ${escapeHTML(formatStatus(quest.status))}
                </span>
            </div>

            <h2>${escapeHTML(quest.title)}</h2>
            <p class="quest-description">
                ${escapeHTML(quest.description)}
            </p>

            <h3>Objectives</h3>
            <div class="objectives">
                ${quest.objectives.map((objective, index) => `
                    <label class="objective">
                        <input type="checkbox"
                            data-objective="${index}"
                            ${objective.completed ? "checked" : ""}>
                        <span>${escapeHTML(objective.text)}</span>
                    </label>
                `).join("")}
            </div>

            <h3>Recent Developments</h3>
            <div class="developments">
                ${quest.developments.length
                    ? quest.developments.map(item => `
                        <div class="development">
                            <span>SESSION ${escapeHTML(item.session)}</span>
                            <p>${escapeHTML(item.text)}</p>
                        </div>
                    `).join("")
                    : "<p>No developments recorded.</p>"
                }
            </div>
        </div>
    `;

    document.getElementById("back-button")
        .addEventListener("click", () => {
            showQuests();
        });

    content.querySelectorAll("[data-objective]")
        .forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                const index = Number(checkbox.dataset.objective);
                quest.objectives[index].completed = checkbox.checked;
            });
        });
}

function formatStatus(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}