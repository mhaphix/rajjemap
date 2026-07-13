/************************************************
 * JazeeraMap
 * Basemap Registry
 *
 * Basemaps are plain raster tile sources that get
 * swapped in and out of a single "basemap" layer at
 * the bottom of the map. (We deliberately avoid
 * map.setStyle() with a full style object, because
 * that wipes every data layer you've loaded — see
 * basemapManager.js for details.)
 *
 * Add a new basemap by adding an object here — it
 * will automatically appear in the sidebar under
 * "Basemaps".
 ************************************************/

const BasemapRegistry = [
    {
        id: "imagery",
        name: "Esri Satellite",
        type: "raster",
        tiles: [
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        ],
        tileSize: 256,
        attribution: "Esri"
    },
    {
        id: "osm",
        name: "OpenStreetMap",
        type: "raster",
        tiles: [
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        ],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors"
    },
    {
        id: "blank",
        name: "Blank",
        type: "background",
        color: "#ffffff"
    }
];
