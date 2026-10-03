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

    let questHTML = "";

    categories.forEach(category => {
        const categoryQuests = quests.filter(
            quest => quest.type === category.type
        );

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

function renderQuestCard(quest) {
    return `
        <button
            type="button"
            class="quest-card"
            data-quest-id="${escapeHTML(quest.id)}"
        >
            <div class="quest-card-top">
                <span class="quest-category">
                    ${escapeHTML(formatCategory(quest.type))}
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

function renderQuestDetail(quest) {
    const content = document.getElementById("content");

    content.innerHTML = `
        <button type="button" class="back-button" id="back-button">
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

            <h2>${escapeHTML(quest.title)}</h2>

            <p class="quest-description">
                ${escapeHTML(quest.description)}
            </p>

            <h3>Objectives</h3>

            <div class="objectives">
                ${quest.objectives.map(objective => `
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
                `).join("")}
            </div>

            <h3>Recent Developments</h3>

            <div class="developments">
                ${quest.developments && quest.developments.length
            ? quest.developments.map(item => `
                            <div class="development">
                                <span class="development-session">
                                    ${escapeHTML(item.session)}
                                </span>

                                <p>
                                    ${escapeHTML(item.text)}
                                </p>
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
}

function formatCategory(type) {
    const categories = {
        main: "Main Quest",
        side: "Side Quest",
        companion: "Companion Quest"
    };

    return categories[type] || "Quest";
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
