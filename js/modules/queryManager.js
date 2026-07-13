/************************************************
 * JazeeraMap
 * Query Manager
 *
 * A first version of attribute querying, built to be
 * extended later (e.g. spatial queries, combined
 * AND/OR conditions, "select by drawn area", etc).
 *
 * How it works today:
 *   QueryManager.run(layerId, field, operator, value)
 *   -> filters that layer's already-loaded features
 *      client-side and highlights all matches using
 *      the same "selection" source LayerManager uses
 *      for click-to-select.
 *
 * Wired to a small panel in the sidebar (see ui.js /
 * index.html for the "#queryPanel" markup).
 ************************************************/

const QueryManager = {

    map: null,

    initialize(map) {
        this.map = map;
    },

    /**
     * @param {string} layerId  a dataset id, must already be loaded
     * @param {string} field    property name to test
     * @param {string} operator one of "=", "contains", ">", "<", ">=", "<="
     * @param {string} value    value to compare against
     * @returns {Array} matching GeoJSON features
     */
    run(layerId, field, operator, value) {
        const layer = LayerManager.loadedLayers[layerId];

        if (!layer) {
            console.warn("Query: layer not loaded yet ->", layerId);
            return [];
        }

        const matches = layer.geojson.features.filter(feature => {
            const fieldValue = feature.properties[field];
            if (fieldValue === undefined || fieldValue === null) return false;
            return this._compare(fieldValue, operator, value);
        });

        this.highlight(matches);
        return matches;
    },

    _compare(fieldValue, operator, value) {
        switch (operator) {
            case "=":
                return String(fieldValue).toLowerCase() === String(value).toLowerCase();
            case "contains":
                return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
            case ">":
                return parseFloat(fieldValue) > parseFloat(value);
            case "<":
                return parseFloat(fieldValue) < parseFloat(value);
            case ">=":
                return parseFloat(fieldValue) >= parseFloat(value);
            case "<=":
                return parseFloat(fieldValue) <= parseFloat(value);
            default:
                return false;
        }
    },

    // Show every matching feature highlighted at once (reuses
    // LayerManager's selection source/layers).
    highlight(features) {
        if (this.map.getSource("selection")) {
            this.map.getSource("selection").setData({
                type: "FeatureCollection",
                features
            });
        }
    },

    clear() {
        LayerManager.clearSelection();
    },

    // Helper for building a query UI: what fields exist on a loaded layer
    getFieldsForLayer(layerId) {
        const layer = LayerManager.loadedLayers[layerId];
        if (!layer || !layer.geojson.features.length) return [];
        return Object.keys(layer.geojson.features[0].properties);
    }

};
