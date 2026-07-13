/************************************************
 * JazeeraMap
 * Location Manager
 *
 * Two things live here:
 *
 * 1. Live location tracking, via MapLibre's built-in
 *    GeolocateControl (asks the browser/device for GPS
 *    permission, shows a "you are here" dot, keeps it
 *    updated as you move). We remember the last known
 *    position so PopupManager can use it as the starting
 *    point for "Navigate" links.
 *
 * 2. Click-anywhere-to-navigate: clicking empty map
 *    space (not on top of an existing feature) drops a
 *    small popup at that exact point with a Navigate
 *    button — so you're not limited to navigating only
 *    to places that exist in the loaded data.
 ************************************************/

const LocationManager = {

    map: null,
    geolocate: null,
    currentPosition: null, // {lng, lat} | null

    initialize(map) {
        this.map = map;

        this.geolocate = new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        });

        this.map.addControl(this.geolocate, "top-right");

        this.geolocate.on("geolocate", (e) => {
            this.currentPosition = {
                lng: e.coords.longitude,
                lat: e.coords.latitude
            };
        });

        this._bindEmptyMapClick();
    },

    // Ask for location proactively (rather than waiting for the
    // person to click the geolocate control themselves)
    requestLocation() {
        if (this.geolocate) this.geolocate.trigger();
    },

    _bindEmptyMapClick() {
        this.map.on("click", (e) => {
            // if the click landed on an interactive dataset layer,
            // LayerManager's own handler already handles it — skip.
            const dataLayerIds = Object.keys(LayerManager.loadedLayers)
                .flatMap(id => [id + "-fill", id + "-line", id + "-point"])
                .filter(id => this.map.getLayer(id));

            const hits = dataLayerIds.length
                ? this.map.queryRenderedFeatures(e.point, { layers: dataLayerIds })
                : [];

            if (hits.length) return; // a real feature was clicked; not empty space

            PopupManager.showAtPoint(e.lngLat);
        });
    }

};
