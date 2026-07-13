# Changelog

## v0.7.0
### Rebuilt
- Unified layer loading: one `LayerManager` code path for both ArcGIS
  FeatureServer layers and local GeoJSON, driven entirely by
  `datasetRegistry.js`.
- Click-to-select: clicking a feature now highlights it (via a
  dedicated always-on-top selection layer) in addition to opening
  its popup.
- Added `queryManager.js` + a sidebar Query panel: filter a loaded
  layer by field/operator/value and highlight matches.

### Fixed
- `index.html` referenced `data/statistics/population.js`, a file
  that didn't exist (`Population.geojson` did). Local data is now
  fetched via `LayerManager`, so nothing needs to be pre-loaded via
  a `<script>` tag.
- Four local datasets (`Address_24`, `ParcelCategory_5`, `plotLine_8`,
  `StreetBlock_4`) existed in the repo but were never registered or
  loaded anywhere. They were also saved with a `.js` extension while
  containing raw JSON (no `var x = ` wrapper) — invalid as a script
  include. Renamed to `.geojson` and registered as normal layers.
- `PopupManager.show()` was called from other modules but was never
  defined — `popupManager.js` only contained a duplicate copy of the
  ArcGIS-fetching logic from `layerManager.js`. Popups silently did
  nothing. Rewritten so `PopupManager`'s only job is showing popups.
- `ui.js` read `dataset.category`, but `datasetRegistry.js` defines
  `dataset.group`. Every dataset fell into a single "undefined"
  sidebar section. Now consistent (`group` everywhere).
- `BasemapManager.setBasemap()` called `map.setStyle(fullStyle)`,
  which replaces the entire map style in MapLibre — wiping every
  loaded data layer whenever the basemap was switched. Basemaps are
  now a single swappable raster source/layer, so switching basemaps
  no longer touches your data layers.
- `SearchManager` ran `JSON.stringify()` over every loaded feature on
  every keystroke — with tens of thousands of address points loaded,
  this froze the page while typing. Search text is now precomputed
  once per feature at index time, and input is debounced.
- `SearchManager.zoomToFeature()` only handled Polygon/MultiPolygon
  geometry, so clicking a search result for a point (e.g. an address)
  did nothing. Bounds are now computed generically for any geometry
  type.
- `layerManager.js` had the same click/popup/cursor event handlers
  bound three times over (copy-paste artifacts), firing popups and
  console logs multiple times per click.
