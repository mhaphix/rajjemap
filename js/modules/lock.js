/************************************************
 * JazeeraMap
 * Lock Screen (client-side password gate)
 *
 * IMPORTANT: this is a casual deterrent only, not real
 * security. The password below is visible to anyone who
 * views the page source or opens browser dev tools — it
 * is not checked against a server. Do not use this to
 * protect anything sensitive; it only keeps out people
 * who wouldn't otherwise think to look.
 *
 * To change the password: edit SITE_PASSWORD below.
 * To require login again on every visit instead of just
 * once per browser: delete the sessionStorage lines.
 ************************************************/

const SITE_PASSWORD = "Ruvaa3553?"; // <-- edit this

(function () {
    const STORAGE_KEY = "jazeeramap_unlocked";

    const lockScreen = document.getElementById("lockScreen");
    const appContent = document.getElementById("appContent");
    const form = document.getElementById("lockForm");
    const input = document.getElementById("lockPassword");
    const error = document.getElementById("lockError");

    function unlock() {
        lockScreen.style.display = "none";
        appContent.style.display = "grid";
        sessionStorage.setItem(STORAGE_KEY, "true");
    }

    // already unlocked earlier this browser session?
    if (sessionStorage.getItem(STORAGE_KEY) === "true") {
        unlock();
    } else {
        appContent.style.display = "none";
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (input.value === SITE_PASSWORD) {
            error.style.display = "none";
            unlock();
        } else {
            error.style.display = "block";
            input.value = "";
            input.focus();
        }
    });
})();
