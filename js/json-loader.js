
/* Shared JSON loader for Axis Chronicles */

window.loadJSON = async function (path) {
    console.log("Loading " + path);
    const response = await fetch(path, {
        cache: "no-cache"
    });

    if (!response.ok) {
        throw new Error(
            `Failed to load JSON "${path}": ` +
            `${response.status} ${response.statusText}`
        );
    }

    try {
        return await response.json();
    } catch (error) {
        throw new Error(
            `Invalid JSON response from "${path}": ${error.message}`
        );
    }
};
