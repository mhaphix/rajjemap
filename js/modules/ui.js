/************************************************
 * JazeeraMap
 * UI Manager
 *
 * BUG FIXED: this used dataset.category everywhere,
 * but datasetRegistry.js defines dataset.group. Since
 * every dataset.category was undefined, all layers fell
 * into a single "undefined" section in the sidebar.
 ************************************************/

function buildDataCatalog(datasets) {
    const sidebar = document.getElementById("sidebar");

    let html = `<h2>📂 Data Catalog</h2>`;

    const groups = [...new Set(datasets.map(d => d.group))];

    groups.forEach(group => {
        html += `<div class="category"><h3>${group}</h3>`;

        datasets
            .filter(d => d.group === group)
            .forEach(dataset => {
                html += `
                    <div class="dataset">
                        <label>
                            <input
                                type="checkbox"
                                class="dataset-toggle"
                                data-id="${dataset.id}"
                                ${dataset.visible ? "checked" : ""}>
                            <span>${dataset.name}</span>
                        </label>
                    </div>
                `;
            });

        html += `</div>`;
    });

    // Basemaps section, built from the registry instead of hardcoded
    html += `<div class="category"><h3>🗺 Basemaps</h3>`;
    BasemapRegistry.forEach((basemap, i) => {
        html += `
            <div class="dataset">
                <label>
                    <input
                        type="radio"
                        name="basemap"
                        value="${basemap.id}"
                        ${i === 0 ? "checked" : ""}>
                    ${basemap.name}
                </label>
            </div>
        `;
    });
    html += `</div>`;

    // Query panel
    html += `
        <div class="category">
            <h3>🔎 Query</h3>
            <div id="queryPanel">
                <select id="queryLayer"><option value="">Select a layer…</option></select>
                <select id="queryField" disabled><option value="">Field…</option></select>
                <select id="queryOperator">
                    <option value="=">=</option>
                    <option value="contains">contains</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                </select>
                <input type="text" id="queryValue" placeholder="Value">
                <button id="queryRun">Run Query</button>
                <button id="queryClear">Clear</button>
                <div id="queryResultCount"></div>
            </div>
        </div>
    `;

    sidebar.innerHTML = html;

    // Dataset toggle events
    document.querySelectorAll(".dataset-toggle").forEach(box => {
        box.addEventListener("change", function () {
            const dataset = LayerRegistry.find(d => d.id === this.dataset.id);

            if (this.checked) {
                LayerManager.load(dataset);
            } else {
                LayerManager.remove(dataset.id);
                if (typeof SearchManager !== "undefined") {
                    SearchManager.removeDataset(dataset.id);
                }
            }

            refreshQueryLayerOptions();
        });
    });

    // Basemap events
    document.querySelectorAll("input[name='basemap']").forEach(radio => {
        radio.addEventListener("change", function () {
            BasemapManager.setBasemap(this.value);
        });
    });

    initQueryPanel();
}

/************************************************
 * QUERY PANEL WIRING
 ************************************************/
function initQueryPanel() {
    refreshQueryLayerOptions();

    const layerSelect = document.getElementById("queryLayer");
    const fieldSelect = document.getElementById("queryField");

    layerSelect.addEventListener("change", () => {
        const fields = QueryManager.getFieldsForLayer(layerSelect.value);

        fieldSelect.innerHTML = fields.length
            ? fields.map(f => `<option value="${f}">${f}</option>`).join("")
            : `<option value="">No fields available</option>`;

        fieldSelect.disabled = !fields.length;
    });

    document.getElementById("queryRun").addEventListener("click", () => {
        const layerId = layerSelect.value;
        const field = fieldSelect.value;
        const operator = document.getElementById("queryOperator").value;
        const value = document.getElementById("queryValue").value;

        if (!layerId || !field || value === "") return;

        const matches = QueryManager.run(layerId, field, operator, value);
        document.getElementById("queryResultCount").textContent =
            `${matches.length} feature(s) matched`;
    });

    document.getElementById("queryClear").addEventListener("click", () => {
        QueryManager.clear();
        document.getElementById("queryResultCount").textContent = "";
    });
}

function refreshQueryLayerOptions() {
    const layerSelect = document.getElementById("queryLayer");
    if (!layerSelect) return;

    const loadedIds = Object.keys(LayerManager.loadedLayers);
    const current = layerSelect.value;

    layerSelect.innerHTML = `<option value="">Select a layer…</option>` +
        loadedIds.map(id => {
            const name = LayerManager.loadedLayers[id].dataset.name;
            return `<option value="${id}">${name}</option>`;
        }).join("");

    if (loadedIds.includes(current)) layerSelect.value = current;
}
