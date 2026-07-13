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
                ${this._navigateButton(lngLat)}
            </div>
        `;

        this.popup.setLngLat(lngLat).setHTML(html).addTo(this.map);
    },

    // Lightweight popup for a click on empty map space (no feature there) —
    // just shows coordinates and a Navigate button, so any point can be
    // routed to, not only places that exist in the loaded data.
    showAtPoint(lngLat) {
        const lng = this._lng(lngLat);
        const lat = this._lat(lngLat);

        const html = `
            <div class="popup-card">
                <table>
                    <tr><td class="popup-key">Latitude</td><td class="popup-value">${lat.toFixed(6)}</td></tr>
                    <tr><td class="popup-key">Longitude</td><td class="popup-value">${lng.toFixed(6)}</td></tr>
                </table>
                ${this._navigateButton(lngLat)}
            </div>
        `;

        this.popup.setLngLat(lngLat).setHTML(html).addTo(this.map);
    },

    // Builds the "Navigate here" link. If we have a live location (from
    // LocationManager), routes FROM that position TO the clicked point;
    // otherwise Google Maps falls back to using the device's own current
    // location automatically once the link is opened.
    _navigateButton(lngLat) {
        const lng = this._lng(lngLat);
        const lat = this._lat(lngLat);

        let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

        if (typeof LocationManager !== "undefined" && LocationManager.currentPosition) {
            const origin = LocationManager.currentPosition;
            url += `&origin=${origin.lat},${origin.lng}`;
        }

        return `
            <a class="popup-navigate" href="${url}" target="_blank" rel="noopener">
                🧭 Navigate here
            </a>
        `;
    },

    _lng(lngLat) {
        return lngLat.lng !== undefined ? lngLat.lng : lngLat[0];
    },

    _lat(lngLat) {
        return lngLat.lat !== undefined ? lngLat.lat : lngLat[1];
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
