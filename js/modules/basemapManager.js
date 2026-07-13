/************************************************
 * JazeeraMap
 * Basemap Manager
 *
 * IMPORTANT FIX vs the old version:
 * The old code called map.setStyle(fullStyleObject)
 * to switch basemaps. In MapLibre, setStyle() replaces
 * EVERYTHING — every loaded layer (islands, reefs,
 * population, your selection highlight, all of it)
 * gets wiped and has to be reloaded. Switching the
 * basemap silently deleted all your data layers.
 *
 * Fix: keep one persistent "basemap" source/layer at
 * the bottom of the stack and swap only that, so
 * everything else stays exactly as it was.
 ************************************************/

const BasemapManager = {

    map: null,

    initialize(map) {
        this.map = map;
    },

    setBasemap(id) {
        const basemap = BasemapRegistry.find(b => b.id === id);
        if (!basemap) {
            console.warn("Unknown basemap:", id);
            return;
        }

        // figure out what to insert the new basemap layer before,
        // so it stays at the very bottom of the stack
        const existingLayers = this.map.getStyle().layers || [];
        const beforeId = existingLayers.length ? existingLayers[0].id : undefined;

        if (this.map.getLayer("basemap")) this.map.removeLayer("basemap");
        if (this.map.getSource("basemap")) this.map.removeSource("basemap");

        if (basemap.type === "background") {
            this.map.addLayer(
                {
                    id: "basemap",
                    type: "background",
                    paint: { "background-color": basemap.color }
                },
                beforeId
            );
            return;
        }

        this.map.addSource("basemap", {
            type: "raster",
            tiles: basemap.tiles,
            tileSize: basemap.tileSize || 256,
            attribution: basemap.attribution || ""
        });

        this.map.addLayer(
            {
                id: "basemap",
                type: "raster",
                source: "basemap"
            },
            beforeId
        );
    }

};
