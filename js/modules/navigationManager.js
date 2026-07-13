/************************************************
 * JazeeraMap
 * Navigation Manager
 *
 * Powers the "Get Directions" panel:
 *  - From: current location, typed search (any loaded layer),
 *          or a point picked directly on the map
 *  - To:   typed search (any loaded layer), or a point picked
 *          on the map
 *  - "Get Directions" opens Google Maps with both points filled in
 *
 * Both fields show live suggestions as you type, reusing
 * SearchManager's index (so it understands island names,
 * addresses, plot house names, etc. — anything already loaded).
 ************************************************/

const NavigationManager = {

    map: null,

    origin: null,      // { lng, lat, label }
    destination: null, // { lng, lat, label }

    pickMode: null,    // "origin" | "destination" | null

    markers: { origin: null, destination: null },

    debounceTimer: null,

    initialize(map) {
        this.map = map;

        this._cacheDom();
        this._bindOpenClose();
        this._bindInputs();
        this._bindActionButtons();
        this._bindMapPicking();
    },

    _cacheDom() {
        this.overlay = document.getElementById("navPanelOverlay");
        this.panel = document.getElementById("navPanel");
        this.originInput = document.getElementById("navOriginInput");
        this.destinationInput = document.getElementById("navDestinationInput");
        this.originSuggestions = document.getElementById("navOriginSuggestions");
        this.destinationSuggestions = document.getElementById("navDestinationSuggestions");
        this.pickHint = document.getElementById("navPickHint");
        this.goBtn = document.getElementById("navGoBtn");
    },

    /****************************
     OPEN / CLOSE
    ****************************/
    _bindOpenClose() {
        document.getElementById("navigateOpenBtn").addEventListener("click", () => this.open());
        document.getElementById("navPanelClose").addEventListener("click", () => this.close());
        this.overlay.addEventListener("click", () => this.close());
    },

    open() {
        this.overlay.classList.add("active");
        this.panel.classList.add("active");

        // pre-fill origin with live location if we already have it
        if (!this.origin && typeof LocationManager !== "undefined" && LocationManager.currentPosition) {
            this._setOrigin(
                LocationManager.currentPosition.lng,
                LocationManager.currentPosition.lat,
                "📍 Current location"
            );
        }
    },

    close() {
        this.overlay.classList.remove("active");
        this.panel.classList.remove("active");
        this._cancelPickMode();
    },

    /****************************
     TEXT INPUTS + SUGGESTIONS
    ****************************/
    _bindInputs() {
        this.originInput.addEventListener("input", () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this._renderSuggestions(this.originInput.value, this.originSuggestions, "origin");
            }, 150);
        });

        this.destinationInput.addEventListener("input", () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this._renderSuggestions(this.destinationInput.value, this.destinationSuggestions, "destination");
            }, 150);
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".navField")) {
                this.originSuggestions.style.display = "none";
                this.destinationSuggestions.style.display = "none";
            }
        });
    },

    _renderSuggestions(text, box, which) {
        box.innerHTML = "";

        if (text.trim().length < 2) {
            box.style.display = "none";
            return;
        }

        const results = SearchManager.query(text, "all", 10);
        box.style.display = "block";

        if (!results.length) {
            box.innerHTML = `<div class="suggestion no-result">No matches found</div>`;
            return;
        }

        results.forEach(entry => {
            const name = SearchManager.getDisplayName(entry.feature);
            const div = document.createElement("div");
            div.className = "suggestion";
            div.innerHTML = `<b>${name}</b><br><small>${entry.dataset.name}</small>`;

            div.onclick = () => {
                const coord = SearchManager.getCoordinate(entry.feature);
                if (!coord) return;

                if (which === "origin") {
                    this._setOrigin(coord[0], coord[1], name);
                } else {
                    this._setDestination(coord[0], coord[1], name);
                }

                box.innerHTML = "";
                box.style.display = "none";
            };

            box.appendChild(div);
        });
    },

    /****************************
     ACTION BUTTONS
    ****************************/
    _bindActionButtons() {
        document.getElementById("navUseLocationBtn").addEventListener("click", () => {
            if (typeof LocationManager === "undefined") return;

            if (LocationManager.currentPosition) {
                this._setOrigin(
                    LocationManager.currentPosition.lng,
                    LocationManager.currentPosition.lat,
                    "📍 Current location"
                );
            } else {
                this.pickHint.textContent = "Requesting your location…";
                this.pickHint.classList.add("active");
                LocationManager.requestLocation();

                // give the browser's permission prompt a moment, then check again
                const check = setInterval(() => {
                    if (LocationManager.currentPosition) {
                        clearInterval(check);
                        this._setOrigin(
                            LocationManager.currentPosition.lng,
                            LocationManager.currentPosition.lat,
                            "📍 Current location"
                        );
                        this.pickHint.classList.remove("active");
                    }
                }, 500);
                setTimeout(() => clearInterval(check), 15000);
            }
        });

        document.getElementById("navPickOriginBtn").addEventListener("click", () => {
            this._enterPickMode("origin");
        });

        document.getElementById("navPickDestinationBtn").addEventListener("click", () => {
            this._enterPickMode("destination");
        });

        document.getElementById("navSwapBtn").addEventListener("click", () => {
            const o = this.origin;
            const d = this.destination;
            this.origin = null;
            this.destination = null;
            if (d) this._setOrigin(d.lng, d.lat, d.label);
            if (o) this._setDestination(o.lng, o.lat, o.label);
        });

        this.goBtn.addEventListener("click", () => {
            if (!this.origin || !this.destination) return;

            const url = `https://www.google.com/maps/dir/?api=1` +
                `&origin=${this.origin.lat},${this.origin.lng}` +
                `&destination=${this.destination.lat},${this.destination.lng}` +
                `&travelmode=driving`;

            window.open(url, "_blank", "noopener");
        });
    },

    /****************************
     PICK A POINT ON THE MAP
    ****************************/
    _bindMapPicking() {
        this.map.on("click", (e) => {
            if (!this.pickMode) return;

            const label = `📌 ${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`;

            if (this.pickMode === "origin") {
                this._setOrigin(e.lngLat.lng, e.lngLat.lat, label);
            } else {
                this._setDestination(e.lngLat.lng, e.lngLat.lat, label);
            }

            this._cancelPickMode();
        });
    },

    _enterPickMode(which) {
        this.pickMode = which;
        this.pickHint.textContent = `Click anywhere on the map to set the ${which === "origin" ? "starting point" : "destination"}…`;
        this.pickHint.classList.add("active");
        this.map.getCanvas().style.cursor = "crosshair";
    },

    _cancelPickMode() {
        this.pickMode = null;
        this.pickHint.classList.remove("active");
        this.map.getCanvas().style.cursor = "";
    },

    /****************************
     SET ORIGIN / DESTINATION
    ****************************/
    _setOrigin(lng, lat, label) {
        this.origin = { lng, lat, label };
        this.originInput.value = label;
        this._placeMarker("origin", lng, lat);
        this._updateGoButton();
    },

    _setDestination(lng, lat, label) {
        this.destination = { lng, lat, label };
        this.destinationInput.value = label;
        this._placeMarker("destination", lng, lat);
        this._updateGoButton();
    },

    _placeMarker(which, lng, lat) {
        if (this.markers[which]) this.markers[which].remove();

        const el = document.createElement("div");
        el.className = which === "origin" ? "nav-marker nav-marker-origin" : "nav-marker nav-marker-destination";
        el.innerHTML = `<span>${which === "origin" ? "A" : "B"}</span>`;

        this.markers[which] = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(this.map);
    },

    _updateGoButton() {
        this.goBtn.disabled = !(this.origin && this.destination);
    }

};
