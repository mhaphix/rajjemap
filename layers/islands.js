map.on('click','islands-fill',(e)=>{

const props = e.features[0].properties;

new maplibregl.Popup()
.setLngLat(e.lngLat)
.setHTML(
'<pre>' +
JSON.stringify(props,null,2) +
'</pre>'
)
.addTo(map);

});
