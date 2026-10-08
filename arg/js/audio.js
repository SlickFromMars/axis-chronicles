const audio = document.getElementById("audio");

const playButton =
    document.getElementById("play-button");

const volumeButton =
    document.getElementById("volume-button");

const progress =
    document.getElementById("progress");

const volume =
    document.getElementById("volume");

const currentTime =
    document.getElementById("current-time");

const duration =
    document.getElementById("duration");

const status =
    document.getElementById("audio-status");

const waveform =
    document.getElementById("waveform");

const waveformBars =
    waveform.querySelectorAll("span");

const container =
    document.querySelector(".audio-record");


let previousVolume = 0.8;


/*
 * =========================================
 * TIME FORMAT
 * =========================================
 */

function formatTime(seconds) {

    if (!Number.isFinite(seconds)) {
        return "00:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        Math.floor(seconds % 60);

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


/*
 * =========================================
 * PLAY / PAUSE
 * =========================================
 */

function togglePlayback() {

    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }

}


/*
 * =========================================
 * PLAY EVENT
 * =========================================
 */

audio.addEventListener(
    "play",
    () => {

        playButton.textContent =
            "PAUSE";

        playButton.setAttribute(
            "aria-label",
            "Pause recording"
        );

        status.textContent =
            "STATUS: PLAYING";

        container.classList.add(
            "is-playing"
        );

    }
);


/*
 * =========================================
 * PAUSE EVENT
 * =========================================
 */

audio.addEventListener(
    "pause",
    () => {

        playButton.textContent =
            "PLAY";

        playButton.setAttribute(
            "aria-label",
            "Play recording"
        );

        status.textContent =
            "STATUS: PAUSED";

        container.classList.remove(
            "is-playing"
        );

    }
);


/*
 * =========================================
 * LOADED METADATA
 * =========================================
 */

audio.addEventListener(
    "loadedmetadata",
    () => {

        duration.textContent =
            formatTime(audio.duration);

        status.textContent =
            "STATUS: READY";

    }
);


/*
 * =========================================
 * TIME UPDATE
 * =========================================
 */

audio.addEventListener(
    "timeupdate",
    () => {

        if (!audio.duration) {
            return;
        }


        const percentage =
            (audio.currentTime / audio.duration) * 100;


        progress.value =
            percentage;


        currentTime.textContent =
            formatTime(audio.currentTime);


        updateWaveform(percentage);

    }
);


/*
 * =========================================
 * PROGRESS BAR
 * =========================================
 */

progress.addEventListener(
    "input",
    () => {

        if (!audio.duration) {
            return;
        }


        audio.currentTime =
            (progress.value / 100) *
            audio.duration;

    }
);


/*
 * =========================================
 * WAVEFORM
 * =========================================
 */

function updateWaveform(percentage) {

    const playedCount =
        Math.floor(
            (percentage / 100) *
            waveformBars.length
        );


    waveformBars.forEach(
        (bar, index) => {

            if (index < playedCount) {

                bar.classList.add(
                    "played"
                );

            } else {

                bar.classList.remove(
                    "played"
                );

            }

        }
    );
}


/*
 * =========================================
 * WAVEFORM SEEK
 * =========================================
 */

waveform.addEventListener(
    "click",
    event => {

        if (!audio.duration) {
            return;
        }


        const rect =
            waveform.getBoundingClientRect();


        const position =
            (event.clientX - rect.left) /
            rect.width;


        audio.currentTime =
            position * audio.duration;

    }
);


/*
 * =========================================
 * VOLUME
 * ========================================= */

volume.addEventListener(
    "input",
    () => {

        audio.volume =
            volume.value;


        if (audio.volume > 0) {

            previousVolume =
                audio.volume;

        }

        updateVolumeButton();

    }
);


/*
 * =========================================
 * MUTE
 * ========================================= */

volumeButton.addEventListener(
    "click",
    () => {

        if (audio.volume > 0) {

            previousVolume =
                audio.volume;

            audio.volume = 0;

        } else {

            audio.volume =
                previousVolume || 0.8;

        }


        volume.value =
            audio.volume;


        updateVolumeButton();

    }
);


function updateVolumeButton() {

    if (audio.volume === 0) {

        volumeButton.textContent =
            "MUTE";

        volumeButton.setAttribute(
            "aria-label",
            "Unmute audio"
        );

    } else {

        volumeButton.textContent =
            "VOL";

        volumeButton.setAttribute(
            "aria-label",
            "Mute audio"
        );

    }

}


/*
 * =========================================
 * ENDED
 * =========================================
 */

audio.addEventListener(
    "ended",
    () => {

        status.textContent =
            "STATUS: COMPLETE";

        updateWaveform(100);

    }
);


/*
 * =========================================
 * PLAY BUTTON
 * =========================================
 */

playButton.addEventListener(
    "click",
    togglePlayback
);


/*
 * =========================================
 * INITIAL STATE
 * =========================================
 */

audio.volume =
    0.8;

volume.value =
    0.8;

updateVolumeButton();
