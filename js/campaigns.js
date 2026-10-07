/* =========================================================
   CAMPAIGN SYSTEM
   ========================================================= */

const CAMPAIGN_REGISTRY_PATH =
    "campaigns/index.json";

let campaignRegistry = null;
let activeCampaign = null;
let activeCampaignMasterPath = null;
let activeCampaignRoot = null;


/* =========================================================
   LOAD JSON
   ========================================================= */

async function loadJSON(
    path,
    errorMessage
) {

    const response =
        await fetch(path);


    if (!response.ok) {

        throw new Error(
            `${errorMessage} (${response.status})`
        );
    }


    return await response.json();
}


/* =========================================================
   DETERMINE REQUESTED CAMPAIGN
   ========================================================= */

function getRequestedCampaignId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedCampaign =
        params.get(
            "campaign"
        );


    if (
        requestedCampaign
    ) {
        return requestedCampaign;
    }


    const savedCampaign =
        localStorage.getItem(
            "activeCampaign"
        );


    if (
        savedCampaign
    ) {
        return savedCampaign;
    }


    return null;
}


/* =========================================================
   LOAD ACTIVE CAMPAIGN
   ========================================================= */

async function loadCampaign() {

    campaignRegistry =
        await loadJSON(
            CAMPAIGN_REGISTRY_PATH,
            "Could not load campaign registry"
        );


    if (
        !campaignRegistry ||
        !Array.isArray(
            campaignRegistry.campaigns
        )
    ) {

        throw new Error(
            "Campaign registry is invalid."
        );
    }


    const requestedId =
        getRequestedCampaignId();


    const campaignId =
        requestedId ||
        campaignRegistry.defaultCampaign;


    let registryEntry =
        campaignRegistry.campaigns.find(
            campaign =>
                campaign.id ===
                campaignId
        );


    /*
        Invalid campaign → configured default.
    */

    if (
        !registryEntry
    ) {

        console.warn(
            `Campaign "${campaignId}" was not found. Falling back to "${campaignRegistry.defaultCampaign}".`
        );


        registryEntry =
            campaignRegistry.campaigns.find(
                campaign =>
                    campaign.id ===
                    campaignRegistry.defaultCampaign
            );
    }


    if (
        !registryEntry
    ) {

        throw new Error(
            "The default campaign could not be found."
        );
    }


    activeCampaignMasterPath =
        registryEntry.master;


    activeCampaign =
        await loadJSON(
            activeCampaignMasterPath,
            `Could not load campaign "${registryEntry.id}"`
        );


    if (
        !activeCampaign.id
    ) {

        throw new Error(
            "Campaign master is missing an id."
        );
    }


    activeCampaignRoot =
        activeCampaignMasterPath.substring(
            0,
            activeCampaignMasterPath.lastIndexOf("/") + 1
        );


    localStorage.setItem(
        "activeCampaign",
        activeCampaign.id
    );


    applyCampaignTheme();

    applyCampaignBranding();

    applyCampaignShell();


    return activeCampaign;
}


/* =========================================================
   CAMPAIGN PATH HELPERS
   ========================================================= */

function resolveCampaignPath(
    path
) {

    if (!path) {
        return null;
    }


    return new URL(
        path,
        new URL(
            activeCampaignRoot,
            window.location.href
        )
    ).href;
}


function getCampaignDataPath(
    key
) {

    if (
        !activeCampaign ||
        !activeCampaign.data ||
        !activeCampaign.data[key]
    ) {
        return null;
    }


    return resolveCampaignPath(
        activeCampaign.data[key]
    );
}


function getCampaignAssetPath(
    key
) {

    if (
        !activeCampaign ||
        !activeCampaign.assets ||
        !activeCampaign.assets[key]
    ) {
        return null;
    }


    return resolveCampaignPath(
        activeCampaign.assets[key]
    );
}


/* =========================================================
   CAMPAIGN STORAGE
   ========================================================= */

function getCampaignStorageKey(
    key
) {

    if (
        !activeCampaign
    ) {
        return key;
    }


    return (
        `axisChronicles:${activeCampaign.id}:${key}`
    );
}


/* =========================================================
   APPLY CAMPAIGN THEME
   ========================================================= */

function applyCampaignTheme() {

    if (
        !activeCampaign ||
        !activeCampaign.theme
    ) {
        return;
    }


    const theme =
        activeCampaign.theme;


    const cssVariables = {

        background:
            "--background",

        backgroundDeep:
            "--background-deep",

        panel:
            "--panel",

        panelLight:
            "--panel-light",

        panelHover:
            "--panel-hover",

        panelDark:
            "--panel-dark",

        accent:
            "--gold",

        accentLight:
            "--gold-light",

        accentBright:
            "--gold-bright",

        accentDark:
            "--gold-dark",

        accentShadow:
            "--gold-shadow",

        accentMuted:
            "--gold-muted",

        text:
            "--parchment",

        textBright:
            "--parchment-bright",

        muted:
            "--muted",

        mutedDark:
            "--muted-dark",

        secondary:
            "--burgundy",

        secondaryLight:
            "--burgundy-light",

        success:
            "--success",

        failure:
            "--failure",

        border:
            "--border",

        borderLight:
            "--border-light"
    };


    Object.entries(
        cssVariables
    ).forEach(
        ([themeKey, cssVariable]) => {

            if (
                theme[themeKey] ===
                undefined
            ) {
                return;
            }


            document.documentElement.style
                .setProperty(
                    cssVariable,
                    theme[themeKey]
                );
        }
    );
}


/* =========================================================
   CAMPAIGN BRANDING / METADATA
   ========================================================= */

function applyCampaignBranding() {

    if (!activeCampaign) {
        return;
    }


    const name =
        activeCampaign.name ||
        "Campaign Journal";


    const shortName =
        activeCampaign.shortName ||
        name;


    const homeText =
        activeCampaign.text?.home ||
        {};


    const social =
        activeCampaign.social ||
        {};


    const title =
        social.title ||
        `${name} | ${shortName}`;


    const description =
        social.description ||
        homeText.description ||
        `The campaign journal for ${name}.`;


    const imageAlt =
        social.imageAlt ||
        name;


    /*
        Build a canonical URL for the active campaign.

        We intentionally remove the hash because hashes
        are page state rather than campaign identity.
    */

    const campaignURL =
        new URL(
            window.location.href
        );


    campaignURL.searchParams.set(
        "campaign",
        activeCampaign.id
    );


    campaignURL.hash =
        "";


    const campaignURLString =
        campaignURL.href;


    /* -----------------------------------------------------
       Browser title
       ----------------------------------------------------- */

    document.title =
        title;


    /* -----------------------------------------------------
       Theme color
       ----------------------------------------------------- */

    setMetaContent(
        'meta[name="theme-color"]',
        activeCampaign.theme?.background ||
        ""
    );


    /* -----------------------------------------------------
       Description
       ----------------------------------------------------- */

    setMetaContent(
        'meta[name="description"]',
        description
    );


    /* -----------------------------------------------------
       Canonical
       ----------------------------------------------------- */

    const canonical =
        document.querySelector(
            'link[rel="canonical"]'
        );


    if (canonical) {

        canonical.href =
            campaignURLString;
    }


    /* -----------------------------------------------------
       Open Graph
       ----------------------------------------------------- */

    setMetaContent(
        'meta[property="og:site_name"]',
        shortName
    );


    setMetaContent(
        'meta[property="og:title"]',
        title
    );


    setMetaContent(
        'meta[property="og:description"]',
        description
    );


    setMetaContent(
        'meta[property="og:url"]',
        campaignURLString
    );


    setMetaContent(
        'meta[property="og:image:alt"]',
        imageAlt
    );


    const socialPreview =
        getCampaignAssetPath(
            "socialPreview"
        );


    if (socialPreview) {

        setMetaContent(
            'meta[property="og:image"]',
            socialPreview
        );


        setMetaContent(
            'meta[property="og:image:secure_url"]',
            socialPreview
        );


        setMetaContent(
            'meta[name="twitter:image"]',
            socialPreview
        );
    }


    /* -----------------------------------------------------
       Twitter
       ----------------------------------------------------- */

    setMetaContent(
        'meta[name="twitter:title"]',
        title
    );


    setMetaContent(
        'meta[name="twitter:description"]',
        description
    );


    /* -----------------------------------------------------
       FAVICON
       ----------------------------------------------------- */

    const favicon =
        getCampaignAssetPath(
            "favicon"
        );


    if (favicon) {

        /*
            Remove any existing favicon links so the browser
            cannot continue using the default campaign icon.
        */

        document
            .querySelectorAll(
                'link[rel="icon"]'
            )
            .forEach(
                link => link.remove()
            );


        /*
            Create a fresh favicon link for the active
            campaign.

            The campaign ID is used as a cache-buster so
            different campaigns cannot accidentally share
            the same cached favicon.
        */

        const faviconLink =
            document.createElement(
                "link"
            );


        faviconLink.rel =
            "icon";


        faviconLink.type =
            "image/png";


        const faviconVersion =
            activeCampaign.assets?.faviconVersion ||
            "1";


        faviconLink.href =
            `${favicon}?v=${encodeURIComponent(
                `${activeCampaign.id}-${faviconVersion}`
            )}`;


        document.head.appendChild(
            faviconLink
        );
    }


    /* -----------------------------------------------------
       Apple title
       ----------------------------------------------------- */

    setMetaContent(
        'meta[name="apple-mobile-web-app-title"]',
        shortName
    );


    /* -----------------------------------------------------
       Apple icon
       ----------------------------------------------------- */

    const appleIcon =
        getCampaignAssetPath(
            "appIcon180"
        );


    if (appleIcon) {

        let appleIconLink =
            document.querySelector(
                'link[rel="apple-touch-icon"]'
            );


        /*
            Create the element if it doesn't already exist.
        */

        if (!appleIconLink) {

            appleIconLink =
                document.createElement(
                    "link"
                );


            appleIconLink.rel =
                "apple-touch-icon";


            document.head.appendChild(
                appleIconLink
            );
        }


        appleIconLink.href =
            appleIcon;
    }


    /* -----------------------------------------------------
       PWA manifest
       ----------------------------------------------------- */

    const manifestPath =
        activeCampaign.manifest
            ? resolveCampaignPath(
                activeCampaign.manifest
            )
            : getCampaignAssetPath(
                "manifest"
            );


    if (manifestPath) {

        let manifestLink =
            document.querySelector(
                'link[rel="manifest"]'
            );


        /*
            Create the manifest link if necessary.
        */

        if (!manifestLink) {

            manifestLink =
                document.createElement(
                    "link"
                );


            manifestLink.rel =
                "manifest";


            document.head.appendChild(
                manifestLink
            );
        }


        manifestLink.href =
            manifestPath;
    }
}


/* =========================================================
   META HELPER
   ========================================================= */

function setMetaContent(
    selector,
    value
) {

    if (
        value ===
        undefined ||
        value ===
        null
    ) {
        return;
    }


    const element =
        document.querySelector(
            selector
        );


    if (
        element
    ) {

        element.setAttribute(
            "content",
            String(value)
        );
    }
}


/* =========================================================
   APPLY CAMPAIGN SHELL
   ========================================================= */

function applyCampaignShell() {

    if (
        !activeCampaign
    ) {
        return;
    }


    const text =
        activeCampaign.text ||
        {};


    /* -----------------------------------------------------
       Header
       ----------------------------------------------------- */

    const brand =
        document.getElementById(
            "campaign-brand"
        );


    if (
        brand &&
        text.header?.brand
    ) {

        brand.textContent =
            text.header.brand;
    }


    const headerLabel =
        document.getElementById(
            "campaign-header-label"
        );


    if (
        headerLabel &&
        text.header?.label
    ) {

        headerLabel.textContent =
            text.header.label;
    }


    /* -----------------------------------------------------
       Navigation heading
       ----------------------------------------------------- */

    const navigationHeading =
        document.getElementById(
            "campaign-navigation-heading"
        );


    if (
        navigationHeading &&
        text.navigation?.heading
    ) {

        navigationHeading.textContent =
            text.navigation.heading;
    }


    /* -----------------------------------------------------
       Home
       ----------------------------------------------------- */

    const homeEyebrow =
        document.getElementById(
            "campaign-home-eyebrow"
        );


    const homeTitle =
        document.getElementById(
            "campaign-home-title"
        );


    const homeDescription =
        document.getElementById(
            "campaign-home-description"
        );


    if (
        homeEyebrow &&
        text.home?.eyebrow
    ) {

        homeEyebrow.textContent =
            text.home.eyebrow;
    }


    if (
        homeTitle &&
        text.home?.title
    ) {

        homeTitle.textContent =
            text.home.title;
    }


    if (
        homeDescription &&
        text.home?.description
    ) {

        homeDescription.textContent =
            text.home.description;
    }


    /* -----------------------------------------------------
       Navigation tabs
       ----------------------------------------------------- */

    const tabs =
        Array.isArray(
            activeCampaign.tabs
        )
            ? activeCampaign.tabs
            : [];


    const enabledPages =
        new Set(
            tabs
                .filter(
                    tab =>
                        tab.enabled !== false
                )
                .map(
                    tab =>
                        tab.id
                )
        );


    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            button => {

                const page =
                    button.dataset.page;


                const tab =
                    tabs.find(
                        candidate =>
                            candidate.id ===
                            page
                    );


                const enabled =
                    enabledPages.has(
                        page
                    );


                button.style.display =
                    enabled
                        ? ""
                        : "none";


                button.setAttribute(
                    "aria-hidden",
                    String(
                        !enabled
                    )
                );


                if (!tab) {
                    return;
                }


                button.innerHTML = `
                    <span>
                        ${escapeCampaignHTML(
                    tab.icon || ""
                )}
                    </span>

                    ${escapeCampaignHTML(
                    tab.label || page
                )}
                `;
            }
        );
}


/* =========================================================
   ENABLED PAGES
   ========================================================= */

function getEnabledCampaignPages() {

    if (
        !activeCampaign ||
        !Array.isArray(
            activeCampaign.tabs
        )
    ) {

        return [
            "quests"
        ];
    }


    return activeCampaign.tabs
        .filter(
            tab =>
                tab.enabled !== false
        )
        .map(
            tab =>
                tab.id
        );
}


function getCampaignDefaultPage() {

    const enabledPages =
        getEnabledCampaignPages();


    if (
        activeCampaign &&
        activeCampaign.defaultPage &&
        enabledPages.includes(
            activeCampaign.defaultPage
        )
    ) {

        return activeCampaign.defaultPage;
    }


    return (
        enabledPages[0] ||
        "quests"
    );
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeCampaignHTML(
    value
) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        character => ({

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
        })[
            character
        ]
    );
}
