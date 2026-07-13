/************************************************
 * JazeeraMap
 * Popup Manager
 *
 * NOTE ON THE OLD VERSION: the previous popupManager.js
 * had a load()/remove() pair that duplicated the ArcGIS
 * fetch logic from layerManager.js, but never actually
 * defined the show() method that other modules called
 * (LayerManager.on("click", ...) => PopupManager.show(...)).
 * That meant clicking a feature silently failed to open
 * a popup. This version's only job is showing popups.
 ************************************************/

const PopupManager = {

    map: null,
    popup: null,

    initialize(map) {
        this.map = map;
        this.popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: "320px"
        });

        this.popup.on("close", () => {
            if (typeof LayerManager !== "undefined") {
                LayerManager.clearSelection();
            }
        });
    },

    show(lngLat, properties) {
        const rows = Object.entries(properties)
            .filter(([, value]) => value !== null && value !== undefined && value !== "")
            .map(([key, value]) => `
                <tr>
                    <td class="popup-key">${this._formatKey(key)}</td>
                    <td class="popup-value">${this._escape(value)}</td>
                </tr>
            `)
            .join("");

        const html = `
            <div class="popup-card">
                <table>${rows}</table>
            </div>
        `;

        this.popup.setLngLat(lngLat).setHTML(html).addTo(this.map);
    },

    close() {
        if (this.popup) this.popup.remove();
    },

    _formatKey(key) {
        return key
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .trim();
    },

    _escape(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

};
