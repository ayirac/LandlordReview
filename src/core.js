import * as L from 'leaflet';
import 'leaflet.markercluster';


function initializeMap() {
    var map = L.map('map', {attributionControl: false}).setView([42.23, -121.78], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Create a layer group for the markers
    var markerGroup = L.layerGroup();

    fetch('/map.html')
      .then(response => response.json())
      .then(data => {
        markerGroup.addTo(map);
        var cluster = L.markerClusterGroup({
          spiderfyOnMaxZoom: false,
          disableClusteringAtZoom: 17
        }).addTo(map);
        console.log(data);
        data.forEach(property => {
          var marker =  new L.marker(new L.LatLng(property.Y, property.X)).addTo(cluster);
          // Customize the marker if needed
          // marker.bindPopup(property.Address);
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });

    // Ok here, need to request to request to nodejs server for the nodes
    // nodejs server will querry & then send me the requested nodes

    /* Add markers to the marker group
    let testCoords = L.marker([33.6223449, -117.0907446]);
    let testCoords2 = L.marker([33.60615302727448, -117.09511618673837]);
    markerGroup.addLayer(testCoords);
    markerGroup.addLayer(testCoords2);
    markerGroup.addLayer(L.marker([33.6223449, -117.107446]));

    // Create the marker cluster group and add the marker group to it
    var cluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        disableClusteringAtZoom: 17
      }).addTo(map);
    var m1 = new L.marker(new L.LatLng(33.6223449, -117.090744)).addTo(cluster);
    var m2 = new L.marker(new L.LatLng(33.6061530, -117.095116)).addTo(cluster);
    var m3 = new L.marker(new L.LatLng(33.6223449, -117.107446)).addTo(cluster);
    */
}
document.addEventListener('DOMContentLoaded', initializeMap);
