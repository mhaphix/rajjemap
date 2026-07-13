/************************************************
 * JazeeraMap
 * Main Application
 *
 * BUG FIXED: index.html used to <script src="data/statistics/population.js">
 * to load local data as a global variable before the app started.
 * That file didn't even exist (it was really Population.geojson),
 * and the other four local datasets (Address, Plots, ParcelCategory,
 * StreetBlock, plotLine) were never wired in at all — they just sat
 * in the repo unused. Local GeoJSON is now fetched by LayerManager
 * the same way ArcGIS layers are, driven entirely by datasetRegistry.js.
 ************************************************/

// ===============================
// CREATE MAP
// (starts with an empty style — BasemapManager adds the
// basemap layer itself, see basemapManager.js)
// ===============================

const map = new maplibregl.Map({
    container: "map",
    style: {
        version: 8,
        sources: {},
        layers: []
    },
    center: [73.467697, 4.180214], // Maldives
    zoom: 10
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

// ===============================
// WHEN MAP READY
// ===============================
map.on("load", () => {
    console.log("🌊 JazeeraMap loaded");

    /******************************
     * INITIALIZE MODULES
     ******************************/
    BasemapManager.initialize(map);
    BasemapManager.setBasemap(BasemapRegistry[0].id);

    PopupManager.initialize(map);
    SearchManager.initialize(map);
    QueryManager.initialize(map);
    LayerManager.initialize(map);
    LocationManager.initialize(map);
    NavigationManager.initialize(map);

    /******************************
     * BUILD SIDEBAR
     ******************************/
    buildDataCatalog(LayerRegistry);

    /******************************
     * LOAD DEFAULT-VISIBLE LAYERS
     ******************************/
    LayerRegistry
        .filter(dataset => dataset.visible)
        .forEach(dataset => LayerManager.load(dataset));
});

// ===============================
// MOBILE LAYER MENU
// ===============================
document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("active");
});
