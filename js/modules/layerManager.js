/************************************************
 * JazeeraMap
 * Layer Manager
 *
 * One code path loads BOTH kinds of layer:
 *  - "arcgis"  -> paginated fetch from a FeatureServer
 *  - "geojson" -> fetch of a local .geojson file
 *
 * Every layer gets, based on dataset.geomType:
 *  - polygon -> fill + outline
 *  - line    -> line
 *  - point   -> circle
 *
 * Clicking any feature:
 *  1. highlights it (via a dedicated "selection" source
 *     that sits on top of everything, so it works the
 *     same way regardless of geometry type or whether
 *     the source has stable IDs)
 *  2. opens a popup through PopupManager
 ************************************************/

const LayerManager = {

    map: null,

    // id -> { dataset, geojson }  (kept so search + query + future
    // features can look up what's currently loaded)
    loadedLayers: {},

    selectedFeature: null,

    initialize(map) {
        this.map = map;
        this._initSelectionLayer();
    },

    /****************************
     SELECTION HIGHLIGHT LAYER
     (created once, reused for every dataset)
    ****************************/
    _initSelectionLayer() {
        this.map.addSource("selection", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] }
        });

        this.map.addLayer({
            id: "selection-fill",
            type: "fill",
            source: "selection",
            filter: ["==", ["geometry-type"], "Polygon"],
            paint: { "fill-color": "#ffe600", "fill-opacity": 0.35 }
        });

        this.map.addLayer({
            id: "selection-line",
            type: "line",
            source: "selection",
            paint: { "line-color": "#ffb300", "line-width": 3 }
        });

        this.map.addLayer({
            id: "selection-point",
            type: "circle",
            source: "selection",
            filter: ["==", ["geometry-type"], "Point"],
            paint: {
                "circle-radius": 9,
                "circle-color": "#ffb300",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#3a2a00"
            }
        });
    },

    _raiseSelectionLayer() {
        ["selection-fill", "selection-line", "selection-point"].forEach(id => {
            if (this.map.getLayer(id)) this.map.moveLayer(id);
        });
    },

    selectFeature(feature) {
        this.selectedFeature = feature;
        this.map.getSource("selection").setData({
            type: "FeatureCollection",
            features: [feature]
        });
    },

    clearSelection() {
        this.selectedFeature = null;
        if (this.map.getSource("selection")) {
            this.map.getSource("selection").setData({
                type: "FeatureCollection",
                features: []
            });
        }
    },

    /****************************
     LOAD A DATASET
    ****************************/
    async load(dataset) {

        console.log("Loading:", dataset.name);

        try {
            const fullGeoJSON = dataset.type === "arcgis"
                ? await this._fetchArcGIS(dataset.url)
                : await this._fetchLocalGeoJSON(dataset.path);

            console.log("Features loaded:", fullGeoJSON.features.length);

            this._removeDatasetLayers(dataset.id);

            this.map.addSource(dataset.id, {
                type: "geojson",
                data: fullGeoJSON
            });

            this._addStyledLayers(dataset);
            this._bindInteractivity(dataset);
            this._raiseSelectionLayer();

            this.loadedLayers[dataset.id] = {
                dataset,
                geojson: fullGeoJSON
            };

            if (typeof SearchManager !== "undefined") {
                SearchManager.addFeatures(fullGeoJSON.features, dataset);
            }

            console.log("Layer added:", dataset.name);

        } catch (error) {
            console.error("Failed to load", dataset.name, error);
        }
    },

    async _fetchArcGIS(baseUrl) {
        let allFeatures = [];
        let offset = 0;
        const pageSize = 1000;

        while (true) {
            const url = `${baseUrl}/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson` +
                        `&resultOffset=${offset}&resultRecordCount=${pageSize}`;

            const response = await fetch(url);
            const geojson = await response.json();

            if (!geojson.features) {
                console.error("Service error:", geojson);
                break;
            }

            allFeatures.push(...geojson.features);

            if (geojson.features.length < pageSize) break;
            offset += pageSize;
        }

        return { type: "FeatureCollection", features: allFeatures };
    },

    async _fetchLocalGeoJSON(path) {
        const response = await fetch(path);
        return response.json();
    },

    _addStyledLayers(dataset) {
        const style = dataset.style || {};

        if (dataset.geomType === "polygon") {

            const fillColor = dataset.choropleth
                ? this._buildChoroplethExpression(dataset.choropleth)
                : (style.fill || "#00BFFF");

            this.map.addLayer({
                id: dataset.id + "-fill",
                type: "fill",
                source: dataset.id,
                paint: {
                    "fill-color": fillColor,
                    "fill-opacity": 0.55
                }
            });

            this.map.addLayer({
                id: dataset.id + "-outline",
                type: "line",
                source: dataset.id,
                paint: {
                    "line-color": style.outline || "#003366",
                    "line-width": 1
                }
            });

        } else if (dataset.geomType === "line") {

            this.map.addLayer({
                id: dataset.id + "-line",
                type: "line",
                source: dataset.id,
                paint: {
                    "line-color": style.line || "#333333",
                    "line-width": 1.5
                }
            });

        } else if (dataset.geomType === "point") {

            this.map.addLayer({
                id: dataset.id + "-point",
                type: "circle",
                source: dataset.id,
                paint: {
                    "circle-radius": 5,
                    "circle-color": style.fill || "#00BFFF",
                    "circle-stroke-width": 1,
                    "circle-stroke-color": style.outline || "#003366"
                }
            });
        }
    },

    _buildChoroplethExpression(choropleth) {
        const expr = ["step", ["to-number", ["get", choropleth.field]]];
        choropleth.stops.forEach(([value, color], i) => {
            if (i === 0) {
                expr.push(color);
            } else {
                expr.push(value, color);
            }
        });
        return expr;
    },

    _interactiveLayerId(dataset) {
        if (dataset.geomType === "polygon") return dataset.id + "-fill";
        if (dataset.geomType === "line") return dataset.id + "-line";
        return dataset.id + "-point";
    },

    _bindInteractivity(dataset) {
        const layerId = this._interactiveLayerId(dataset);

        this.map.on("click", layerId, (e) => {
            if (!e.features.length) return;

            const feature = e.features[0];
            this.selectFeature(feature);

            if (typeof PopupManager !== "undefined") {
                PopupManager.show(e.lngLat, feature.properties);
            }
        });

        this.map.on("mouseenter", layerId, () => {
            this.map.getCanvas().style.cursor = "pointer";
        });

        this.map.on("mouseleave", layerId, () => {
            this.map.getCanvas().style.cursor = "";
        });
    },

    _removeDatasetLayers(id) {
        ["-fill", "-outline", "-line", "-point"].forEach(suffix => {
            if (this.map.getLayer(id + suffix)) this.map.removeLayer(id + suffix);
        });
        if (this.map.getSource(id)) this.map.removeSource(id);
    },

    /****************************
     REMOVE A DATASET
    ****************************/
    remove(id) {
        console.log("Removing:", id);

        this._removeDatasetLayers(id);
        delete this.loadedLayers[id];

        // if the selected feature belonged to this layer, clear it
        if (this.selectedFeature && this.selectedFeature.layer && this.selectedFeature.layer.source === id) {
            this.clearSelection();
        }
    }

};

// Backwards-compatible alias in case anything still refers to the old name
const DatasetManager = LayerManager;
