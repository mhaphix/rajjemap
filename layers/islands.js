<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>RajjeMap</title>

<meta name="viewport" content="width=device-width, initial-scale=1">

<link href="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css" rel="stylesheet">

<style>
body { margin:0; padding:0; }

#map {
position:absolute;
top:0;
bottom:0;
left:300px;
right:0;
}

/* SIDEBAR */
#sidebar {
position:absolute;
left:0;
top:0;
bottom:0;
width:300px;
background:#1e1e1e;
color:white;
padding:10px;
overflow:auto;
font-family:Arial;
}

button {
width:100%;
margin:5px 0;
padding:8px;
cursor:pointer;
}
</style>
</head>

<body>

<div id="sidebar">

<h3>RajjeMap Layers</h3>

<button onclick="toggleLayer('islands-fill')">Toggle Islands</button>

<h3>Basemap</h3>

<button onclick="setBasemap('street')">Street</button>
<button onclick="setBasemap('satellite')">Satellite</button>

</div>

<div id="map"></div>

<script src="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.js"></script>

<script>
let currentBasemap = 'street';

/* BASEMAP STYLES */
const styles = {
street: 'https://demotiles.maplibre.org/style.json',

satellite: {
version: 8,
sources: {
satellite: {
type: 'raster',
tiles: [
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
],
tileSize: 256
}
},
layers: [
{
id: 'satellite',
type: 'raster',
source: 'satellite'
}
]
}
};

/* MAP */
const map = new maplibregl.Map({
container:'map',
style: styles.street,
center:[73.5,4.2],
zoom:7
});

map.addControl(new maplibregl.NavigationControl());

/* STORE LAYERS */
let islandsLayerAdded = false;

/* LOAD ISLANDS */
map.on('load', () => {

fetch('https://services7.arcgis.com/yvCbn3q8PPtPLZIM/ArcGIS/rest/services/island_20240509/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson')
.then(r => r.json())
.then(data => {

map.addSource('islands', {
type:'geojson',
data:data
});

map.addLayer({
id:'islands-fill',
type:'fill',
source:'islands',
paint:{
'fill-color':'#00aa88',
'fill-opacity':0.5
}
});

islandsLayerAdded = true;

});

});

/* TOGGLE LAYER */
function toggleLayer(id){

if(!map.getLayer(id)) return;

const visibility = map.getLayoutProperty(id,'visibility');

if(visibility === 'visible'){
map.setLayoutProperty(id,'visibility','none');
}else{
map.setLayoutProperty(id,'visibility','visible');
}
}

/* SWITCH BASEMAP */
function setBasemap(type){

if(type === 'street'){
map.setStyle(styles.street);

map.once('styledata', () => {
location.reload(); // reload layers
});
}

if(type === 'satellite'){
map.setStyle(styles.satellite);

map.once('styledata', () => {
location.reload();
});
}

}

</script>

</body>
</html>
