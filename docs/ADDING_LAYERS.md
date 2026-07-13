# Adding, Updating, and Removing Layers

JazeeraMap is designed so that almost all layer work happens in one
file: `js/modules/datasetRegistry.js`. You should not need to touch
`layerManager.js`, `ui.js`, or `index.html` for routine layer changes.

---

## 1. Add a new layer

Open `js/modules/datasetRegistry.js` and add a new object to the
`LayerRegistry` array.

**From an ArcGIS FeatureServer:**
```js
{
    id: "roads",                 // unique, no spaces
    name: "Roads",                // shown in the sidebar
    group: "Administrative",      // sidebar section — reuses an
                                   // existing group name or creates
                                   // a new one automatically
    type: "arcgis",
    geomType: "line",              // "point" | "line" | "polygon"
    visible: false,                // load automatically on startup?
    url: "https://services.../FeatureServer/0",
    style: { line: "#e63946" }
}
```

**From a local GeoJSON file:**
1. Put the file in `data/statistics/` — must be valid `.geojson`
   (a plain JSON `FeatureCollection`, not a `.js` file).
2. Register it:
```js
{
    id: "schools",
    name: "Schools",
    group: "Statistics",
    type: "geojson",
    geomType: "point",
    visible: false,
    path: "data/statistics/Schools.geojson",
    style: { fill: "#2a9d8f", outline: "#1d3557" }
}
```

Save the file — that's the whole change. Reload the page and the new
layer appears in the sidebar, is searchable, clickable, and available
in the Query panel as soon as it's checked on.

### Optional: color by an attribute (choropleth)
Add a `choropleth` block instead of/alongside `style.fill`:
```js
choropleth: {
    field: "TotalPop",
    stops: [
        [0, "#ffffcc"],
        [500, "#ffeda0"],
        [1000, "#feb24c"]
    ]
}
```

---

## 2. Update a layer

- **Change styling/name/group** → edit the object directly in
  `datasetRegistry.js`.
- **Replace the underlying data** (new export from ArcGIS Pro, updated
  survey, etc.) → for a local file, overwrite the `.geojson` file at
  the same `path` and commit it. For an ArcGIS layer, nothing to do —
  it's always fetched live from the service.
- **Change the ArcGIS service URL** → update `url` on that object.

## 3. Remove a layer

Two options:
- **Hide it but keep it registered** (e.g. re-enable it later without
  losing the config): set `visible: false` and leave the object in
  place. It just won't auto-load or show as checked, but still shows
  in the sidebar list.
- **Remove it entirely**: delete the whole object from `LayerRegistry`.
  It disappears from the sidebar, search, and the query panel.

There is nothing else to clean up elsewhere in the code — no other
file keeps its own list of layers.

---

## 4. Publishing changes (GitHub Pages)

This repo's `CNAME` points at `jazeeramap.com`, so once changes are
pushed to the branch GitHub Pages is configured to serve (usually
`main`), the live site updates automatically — typically within a
minute or two.

```bash
git add -A
git commit -m "Add roads layer"
git push origin main
```

No rebuild step is required — this is a static site (HTML/CSS/JS +
data files) served directly.

### A safety habit worth keeping
Before pushing, run `validate_layers.py` (in the repo root) to catch
common mistakes — duplicate IDs, a `path` that doesn't exist on disk,
a missing required field — before they reach production:

```bash
python3 validate_layers.py
```
