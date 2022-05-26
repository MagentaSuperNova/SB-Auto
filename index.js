// Declare varibles

// The last loaded project, if any.
let lastResult = null;

let idStart;
let idEnd;
let result;
let debug;

// Element references
const startInput = document.querySelector('#start');
const endInput = document.querySelector('#end');
const progressBarFill = document.querySelector('#progress-bar-fill');
const progressBarContainer = document.querySelector('#progress-bar');
const downloadLinkEl = document.querySelector('#download-link');
const button = document.querySelector('#startButton');
const message = document.querySelector('#progress-msg');

// Toggles debug mode
function debugToggle(bool) {

    debug = bool;

    if (debug) {
        return "Debug mode is enabled."
    } else {
        return "Debug mode is disabled."
    }

}

// Loops through all of the IDs
async function startAuto() {

    if (debug) {
        console.log("STARTED")
    }

    disableInputs(true);

    idStart = Number(startInput.value)
    idEnd = Number(endInput.value)

    if (!(idStart < idEnd && idStart > 0)) {
        setProgress("INVALID")
        disableInputs(false);
        return
    }
    
    const clearLogs = setInterval(function () {console.clear()}, 60000);

    for (let i = idStart; i < (idEnd + 1); i++) {

        setProgress(i);

        await loadInput(i, "sb");

        if (!(result == "OK")) {
            await loadInput(i, "sb2");

            if (!(result == "OK")) {
                await loadInput(i, "sb3");

                if (!(result == "OK")) {
                    if (debug) {
                        console.log("PROJECT NOT AVAILABLE - SKIPPED")
                    }
                }
            }
        }
    }
    clearInterval(clearLogs)
    setProgress("DONE")
    disableInputs(false);
}

// Toggles the inputs
function disableInputs(bool) {

    startInput.disabled = bool
    endInput.disabled = bool
    button.disabled = bool

}

// Listen for button click
button.addEventListener('click', startAuto);

// Sets the current progress
function setProgress(id) {
    let per = Math.round(((id - idStart) / (idEnd - idStart)) * 100)
    let total = (idEnd - idStart) + 1
    let current = id - idStart + 1
    if (id == "INVALID") {
        progressBarFill.style.width = '10%';
        message.innerHTML = "Invalid input."
        return
    }
    if (id == "DONE") {
        progressBarFill.style.width = '100%';
        message.innerHTML = `100% | All done. ${total} projects were downloaded. (${idStart} - ${idEnd})`
        return
    }
    if (per < 11) {
        progressBarFill.style.width = 10 + '%';
    } else {
        progressBarFill.style.width = per + '%';
    }
    message.innerHTML = `${per}% | Downloading project ${id}. (${current} of ${total})`
}

// Downloads a project
async function loadInput(id, type) {

    if (debug) {
        console.log(`Starting download of project ${id} as .${type}`)
    }

    await downloadProject(id, type)
        .then(() => {
            if (debug) {
                console.log(`SUCCESS - Project ${id} was downloaded as .${type}`)
            }
            result = "OK"
        })
        .catch((err) => {
            if (debug) {
                console.error(err);
            }
            let error = '\u274c Project is not available as a .' + type;
            if (err && err.message) {
                if (err.probableType) {
                    error += ' (It is available as a .' + err.probableType + ')';
                } else if (err.message.includes('404') && type === 'sb3') {
                    error += ' (Project does not exist)';
                }
            }
            if (debug) {
                console.log(`FAIL - Project ${id} was unable to be downloaded as .${type}`)
            }
            result = "ERR"
        });
}
// Starts loading a project. Downloads it when complete.
function downloadProject(id, type) {
    lastResult = null;
    return SBDL.loadProject(id, type)
        .then((r) => {
            lastResult = r;

            // Convert the result to a Blob so it's easier to download.
            // The result can either give us a list of files to put in an archive, or an ArrayBuffer.

            if (r.type === 'zip') {
                return SBDL.createArchive(r.files);
            } else if (r.type === 'buffer') {
                return new Blob([r.buffer]);
            } else {
                throw new Error('unknown type: ' + r.type);
            }
        })
        .then((blob) => {
            const url = URL.createObjectURL(blob);
            const filename = lastResult.title + '.' + lastResult.extension;
            const size = blob.size / 1024 / 1024;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.textContent = 'Download ' + filename + ' (' + size.toFixed(2) + ' MiB)';
            downloadLinkEl.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
}
