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
 *
 * NEW: a layer dropdown next to the search box lets you scope
 * a search to one specific loaded layer, or "All Layers". The
 * same underlying query() method is reused by NavigationManager
 * for the From/To fields in the directions panel.
 ************************************************/

const SearchManager = {

    map: null,

    // { feature, dataset, searchText }
    index: [],

    debounceTimer: null,
    activeLayerFilter: "all",

    initialize(map) {
        this.map = map;

        const input = document.getElementById("globalSearch");
        const resultBox = document.getElementById("searchSuggestions");
        const layerFilter = document.getElementById("searchLayerFilter");

        input.addEventListener("input", () => {
            clearTimeout(this.debounceTimer);
            const value = input.value;
            this.debounceTimer = setTimeout(() => {
                this._runSearch(value, input, resultBox);
            }, 150);
        });

        layerFilter.addEventListener("change", () => {
            this.activeLayerFilter = layerFilter.value;
            if (input.value.trim().length >= 2) {
                this._runSearch(input.value, input, resultBox);
            }
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
        this._refreshLayerFilterOptions();
    },

    /************************************************
     * REMOVE A LAYER'S FEATURES FROM THE INDEX
     * (call this if you unload/toggle off a layer and
     * don't want stale results appearing in search)
     ************************************************/
    removeDataset(datasetId) {
        this.index = this.index.filter(entry => entry.dataset.id !== datasetId);

        if (this.activeLayerFilter === datasetId) {
            this.activeLayerFilter = "all";
            const layerFilter = document.getElementById("searchLayerFilter");
            if (layerFilter) layerFilter.value = "all";
        }

        this._refreshLayerFilterOptions();
    },

    _refreshLayerFilterOptions() {
        const layerFilter = document.getElementById("searchLayerFilter");
        if (!layerFilter) return;

        const loadedDatasets = [...new Map(
            this.index.map(entry => [entry.dataset.id, entry.dataset])
        ).values()];

        const current = layerFilter.value;

        layerFilter.innerHTML = `<option value="all">All Layers</option>` +
            loadedDatasets.map(d => `<option value="${d.id}">${d.name}</option>`).join("");

        const stillLoaded = loadedDatasets.some(d => d.id === current);
        layerFilter.value = stillLoaded ? current : "all";
        this.activeLayerFilter = layerFilter.value;
    },

    /************************************************
     * CORE QUERY (reusable — used by the main search
     * box AND by NavigationManager's From/To fields)
     ************************************************/
    query(text, layerId = "all", limit = 15) {
        const needle = text.toLowerCase().trim();
        if (needle.length < 2) return [];

        return this.index
            .filter(entry => layerId === "all" || entry.dataset.id === layerId)
            .filter(entry => entry.searchText.includes(needle))
            .slice(0, limit);
    },

    _runSearch(raw, input, resultBox) {
        resultBox.innerHTML = "";

        if (raw.trim().length < 2) {
            resultBox.style.display = "none";
            return;
        }

        resultBox.style.display = "block";

        const results = this.query(raw, this.activeLayerFilter);

        if (!results.length) {
            resultBox.innerHTML = `<div class="suggestion no-result">No matches found</div>`;
            return;
        }

        results.forEach(entry => {
            resultBox.appendChild(this._buildSuggestion(entry, input, resultBox));
        });
    },

    _buildSuggestion(entry, input, resultBox) {
        const name = this.getDisplayName(entry.feature);
        const p = entry.feature.properties;
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

    // Shared "best guess" display name for a feature, used by both the
    // main search suggestions and the navigation panel's suggestions.
    getDisplayName(feature) {
        const p = feature.properties;
        return (
            p.islandName || p.IslandName || p.ISLANDNAME || p.islandname ||
            p.hname || p.HouseName ||
            p.ReefName || p.reefName ||
            p.NAME || p.Name || p.name ||
            "Unnamed Feature"
        );
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

    // Returns a single representative [lng, lat] for any feature —
    // used by NavigationManager, which needs one coordinate per
    // origin/destination regardless of geometry type.
    getCoordinate(feature) {
        const bounds = new maplibregl.LngLatBounds();
        this._extendBoundsForGeometry(bounds, feature.geometry);
        if (bounds.isEmpty()) return null;
        const center = bounds.getCenter();
        return [center.lng, center.lat];
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
