/************************************************
 * JazeeraMap
 * Dataset Registry
 *
 * This is the ONLY file you need to touch to add
 * a new layer to the map. Every layer — whether it
 * comes from an ArcGIS FeatureServer or a local
 * GeoJSON file — is described by one object below.
 *
 * FIELD REFERENCE
 * ----------------
 * id        (string, required)  unique, no spaces
 * name      (string, required)  label shown in the sidebar
 * group     (string, required)  sidebar section, e.g. "Marine"
 * type      ("arcgis" | "geojson", required)
 * visible   (boolean, required)  loaded on startup?
 * url       (string, required if type is "arcgis")
 * path      (string, required if type is "geojson")
 * geomType  ("point" | "line" | "polygon", required)
 * style     (object) colors used to draw the layer
 * choropleth(object, optional) { field, stops:[[value,color],...] }
 *                     draws a graduated color layer by an
 *                     attribute instead of a flat fill color
 ************************************************/

const LayerRegistry = [

    /***************
     ADMINISTRATIVE
    ****************/
    {
        id: "island",
        name: "Island Boundary",
        group: "Administrative",
        type: "arcgis",
        geomType: "polygon",
        visible: true,
        url: "https://services7.arcgis.com/yvCbn3q8PPtPLZIM/ArcGIS/rest/services/island_20240509/FeatureServer/0",
        style: { fill: "#d8c27a", outline: "#8a7230" }
    },

    /***************
     MARINE
    ****************/
    {
        id: "reef",
        name: "Reef",
        group: "Marine",
        type: "arcgis",
        geomType: "polygon",
        visible: false,
        url: "https://services7.arcgis.com/yvCbn3q8PPtPLZIM/ArcGIS/rest/services/Reef/FeatureServer/0",
        style: { fill: "#0077b6", outline: "#023e8a" }
    },
    {
        id: "lagoon",
        name: "Lagoon",
        group: "Marine",
        type: "arcgis",
        geomType: "polygon",
        visible: false,
        url: "https://services7.arcgis.com/yvCbn3q8PPtPLZIM/ArcGIS/rest/services/Lagoon/FeatureServer/0",
        style: { fill: "#48cae4", outline: "#00b4d8" }
    },

    /***************
     STATISTICS
    ****************/
    {
        id: "population",
        name: "Population (by Island)",
        group: "Statistics",
        type: "geojson",
        geomType: "polygon",
        visible: false,
        path: "data/statistics/Population.geojson",
        style: { outline: "#800026" },
        choropleth: {
            field: "TotalPop",
            stops: [
                [0, "#ffffcc"],
                [500, "#ffeda0"],
                [1000, "#feb24c"],
                [5000, "#f03b20"],
                [50000, "#800026"]
            ]
        }
    },
    {
        id: "address",
        name: "Address Points",
        group: "Statistics",
        type: "geojson",
        geomType: "point",
        visible: false,
        path: "data/statistics/Address_24.geojson",
        style: { fill: "#ff6b6b", outline: "#8a0000" }
    },
    {
        id: "plots",
        name: "Plots",
        group: "Statistics",
        type: "geojson",
        geomType: "point",
        visible: false,
        path: "data/statistics/Plots.geojson",
        style: { fill: "#ffb703", outline: "#8a5800" }
    },
    {
        id: "parcelCategory",
        name: "Parcel Category",
        group: "Statistics",
        type: "geojson",
        geomType: "polygon",
        visible: false,
        path: "data/statistics/ParcelCategory_5.geojson",
        style: { fill: "#8ecae6", outline: "#023047" }
    },
    {
        id: "streetBlock",
        name: "Street Block",
        group: "Statistics",
        type: "geojson",
        geomType: "polygon",
        visible: false,
        path: "data/statistics/StreetBlock_4.geojson",
        style: { fill: "#adb5bd", outline: "#495057" }
    },
    {
        id: "plotLine",
        name: "Plot Lines",
        group: "Statistics",
        type: "geojson",
        geomType: "line",
        visible: false,
        path: "data/statistics/plotLine_8.geojson",
        style: { line: "#333333" }
    }

    /***************
     ADD YOUR NEXT LAYER HERE
     Copy one of the blocks above, give it a new id,
     and it will automatically appear in the sidebar.
    ****************/

];
