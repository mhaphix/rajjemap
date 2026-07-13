/************************************************
 * JazeeraMap
 * Search Manager
 *
 * FIXES vs the old version:
 * 1. The old code ran JSON.stringify(feature.properties)
 *    on EVERY feature, on EVERY keystroke. With 90k+
 *    address points loaded this froze the browser while
 *    typing. Now each feature is stringified ONCE when
 *    it's indexed (in addFeatures), not on every keystroke,
 *    and input is debounced.
 * 2. zoomToFeature only handled Polygon/MultiPolygon, so
 *    clicking a search result for a Point (e.g. an address)
 *    silently did nothing. Bounds are now built generically
 *    for any geometry type.
 * 3. Clicking a result now also highlights the feature via
 *    LayerManager, matching the "click on map = select" behavior.
 ************************************************/

const SearchManager = {

    map: null,

    // { feature, dataset, searchText }
    index: [],

    debounceTimer: null,

    initialize(map) {
        this.map = map;

        const input = document.getElementById("globalSearch");
        const resultBox = document.getElementById("searchSuggestions");

        input.addEventListener("input", () => {
            clearTimeout(this.debounceTimer);
            const value = input.value;
            this.debounceTimer = setTimeout(() => {
                this._runSearch(value, input, resultBox);
            }, 150);
        });

        // close suggestions when clicking outside the search box
        document.addEventListener("click", (e) => {
            if (!e.target.closest("#search")) {
                resultBox.style.display = "none";
            }
        });
    },

    /************************************************
     * INDEX FEATURES (called once per layer load)
     ************************************************/
    addFeatures(features, dataset) {
        features.forEach(feature => {
            this.index.push({
                feature,
                dataset,
                searchText: JSON.stringify(feature.properties).toLowerCase()
            });
        });

        console.log("🔍 Search indexed:", this.index.length, "features total");
    },

    /************************************************
     * REMOVE A LAYER'S FEATURES FROM THE INDEX
     * (call this if you unload/toggle off a layer and
     * don't want stale results appearing in search)
     ************************************************/
    removeDataset(datasetId) {
        this.index = this.index.filter(entry => entry.dataset.id !== datasetId);
    },

    _runSearch(raw, input, resultBox) {
        const text = raw.toLowerCase().trim();
        resultBox.innerHTML = "";

        if (text.length < 2) {
            resultBox.style.display = "none";
            return;
        }

        resultBox.style.display = "block";

        const results = this.index
            .filter(entry => entry.searchText.includes(text))
            .slice(0, 15);

        if (!results.length) {
            resultBox.innerHTML = `<div class="suggestion no-result">No matches found</div>`;
            return;
        }

        results.forEach(entry => {
            resultBox.appendChild(this._buildSuggestion(entry, input, resultBox));
        });
    },

    _buildSuggestion(entry, input, resultBox) {
        const p = entry.feature.properties;

        const name =
            p.islandName || p.IslandName || p.ISLANDNAME || p.islandname ||
            p.hname || p.HouseName ||
            p.ReefName || p.reefName ||
            p.NAME || p.Name || p.name ||
            "Unnamed Feature";

        const code = p.FCODE || p.fcode || p.ReefCode || p.reefCode || p.CODE || p.block_code || "";
        const atoll = p.atoll || p.Atoll || p.ATOLL || "";

        const div = document.createElement("div");
        div.className = "suggestion";
        div.innerHTML = `
            <b>🏝 ${name}</b>
            <br>
            <small>${entry.dataset.name} &nbsp;${code ? "· " + code : ""} &nbsp;${atoll}</small>
        `;

        div.onclick = () => {
            input.value = name;
            resultBox.innerHTML = "";
            resultBox.style.display = "none";
            this.zoomToFeature(entry.feature);
        };

        return div;
    },

    /************************************************
     * ZOOM TO RESULT (any geometry type)
     ************************************************/
    zoomToFeature(feature) {
        const bounds = new maplibregl.LngLatBounds();
        this._extendBoundsForGeometry(bounds, feature.geometry);

        if (bounds.isEmpty()) {
            console.warn("Could not compute bounds for feature", feature);
            return;
        }

        this.map.fitBounds(bounds, { padding: 100, maxZoom: 17 });

        if (typeof LayerManager !== "undefined") {
            LayerManager.selectFeature(feature);
        }

        if (typeof PopupManager !== "undefined") {
            PopupManager.show(bounds.getCenter(), feature.properties);
        }
    },

    // Recursively walks any GeoJSON geometry (Point, LineString, Polygon,
    // and their Multi* equivalents) and extends the given bounds.
    _extendBoundsForGeometry(bounds, geometry) {
        if (!geometry) return;

        const walk = (coords) => {
            if (typeof coords[0] === "number") {
                bounds.extend(coords);
            } else {
                coords.forEach(walk);
            }
        };

        walk(geometry.coordinates);
    }

};
