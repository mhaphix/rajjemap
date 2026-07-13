# JazeeraMap — Maldives GIS Hub

A single-page GIS platform for visualizing Maldives spatial data:
ArcGIS FeatureServer layers and local GeoJSON datasets, side by side,
with search, click-to-select, and attribute querying.

Built on [MapLibre GL JS](https://maplibre.org/).

## Project layout

```
index.html                      page shell + script load order
css/style.css                   all styling
js/app.js                       entry point — creates the map, boots every module
js/modules/
  datasetRegistry.js            <- ADD NEW LAYERS HERE
  basemapRegistry.js            <- ADD NEW BASEMAPS HERE
  layerManager.js                loads layers, click-to-select, highlighting
  popupManager.js                feature popups
  searchManager.js               global search across every loaded layer
  queryManager.js                attribute query / highlight-by-condition
  basemapManager.js              swaps the basemap tile layer
  ui.js                          builds the sidebar from the registries
data/statistics/                 local GeoJSON datasets
```

## Adding a new layer

Open `js/modules/datasetRegistry.js` and add one object to the
`LayerRegistry` array — see the comment at the top of that file for
the full field reference. That's it: the sidebar, loading, styling,
search indexing, click-to-select, and popups all pick it up
automatically. No other file needs to change for a normal layer.

## Search

Typing in the search box searches every field of every loaded layer
(dataset name is shown alongside each result so you know which layer
a match came from). Clicking a result zooms to the feature, selects
it, and opens its popup.

## Click-to-select

Clicking any feature on the map highlights it (a yellow outline/fill)
and opens a popup with all of its attributes. The highlight uses a
dedicated "selection" layer that sits above everything else, so it
works consistently for points, lines, and polygons.

## Querying (v1)

The sidebar has a Query panel: pick a loaded layer, a field, an
operator (`=`, `contains`, `>`, `<`, `>=`, `<=`) and a value, then
"Run Query" highlights every matching feature on the map.
`js/modules/queryManager.js` is written so this can grow — e.g.
combining multiple conditions, or spatial queries against a drawn
area — without changing how it's wired into the UI.

## Data notes

Local files under `data/statistics/` are plain GeoJSON (`.geojson`).
Earlier drafts of this project had some of these files saved with a
`.js` extension containing raw JSON with no variable assignment —
that's invalid as a `<script>` include and would throw a syntax
error if loaded that way. Everything now goes through `fetch()` via
`LayerManager`, the same code path used for ArcGIS layers, so this
class of bug can't recur.
