import * as L from 'leaflet';
import 'leaflet.markercluster';

var customMarker = L.Marker.extend({
  options: { 
     ID: 0,
     Address: 'n/a'
  }
});

var activePopup = -1;

function toggleBox(popupBox) {
  if (popupBox.style.display === 'block') {
    popupBox.style.display = 'none'; // Hide the popup box
    activePopup = -1;
  } else {
    popupBox.style.display = 'block'; // Show the popup box
  }
}

function initializeMap() {
    const popupButtons = document.querySelectorAll('.popup-button');
    const popupBoxes = document.querySelectorAll('.popup-box');
    const dropDownButton = document.getElementById('sort-drop-b')
    const dropDownBox = document.getElementById('sort-drop-c')
    var postContainer = document.getElementById('post-container');


    // Add click event listeners to the popup elements
    popupButtons.forEach((box, index) => {
      box.addEventListener('click', () => {
        event.stopPropagation(); // Stop event propagation
        if (activePopup === -2)
          toggleBox(dropDownBox);
        else if (activePopup > -1 && activePopup != index ) {
          toggleBox(popupBoxes[activePopup]);
        }
        activePopup = index;
        toggleBox(popupBoxes[index]);
      });
    });

    dropDownButton.addEventListener('click', () => {
        event.stopPropagation(); // Stop event propagation
        if (activePopup > -1 ) {
          toggleBox(popupBoxes[activePopup]);
        }
        activePopup = -2;
        toggleBox(dropDownBox);
    });

    // Add listener to each dropdown item
    var dropdownItems = document.querySelectorAll('.dropdown-content a');
    event.stopPropagation(); // Stop event propagation
    dropdownItems.forEach(function(item) {
      item.addEventListener('click', function(event) {
        var clickedItem = event.target;
        var itemId = clickedItem.id;
        dropDownButton.innerHTML = "Sort: " + clickedItem.innerHTML;
      });
    });
    

    // Close popup boxes when clicking outside their containers
    document.addEventListener('click', (event) => {
    if (activePopup === -2) {
      if (!dropDownButton.contains(event.target) && !dropDownBox.contains(event.target)) {
        toggleBox(dropDownBox);
        activePopup = -1;
      }
    } else if (activePopup !== -1 && !popupButtons[activePopup].contains(event.target) && !popupBoxes[activePopup].contains(event.target)) {
      toggleBox(popupBoxes[activePopup]);
    }
    });

    // Add postContainer handler for checking when a post is clicked on
    // Add postContainer handler for checking when a post is clicked on
    postContainer.addEventListener('click', function(event) {
      var clickedElement = event.target;
      var post = clickedElement.closest('.post');
      if (post) {
        var id = post.dataset.postId;
        console.log('clicked on ' + id);

        // Add display: none to frame-container, load in a detailed-property page dynamnically
        document.getElementById('frame-container').style.display = 'none';
        var propertyPageContainer = document.createElement('div');
        propertyPageContainer.className = 'property-page-container';

        var propertyPage = document.createElement('div');
        propertyPage.className = 'property-page';
        propertyPageContainer.append(propertyPage);
        document.body.append(propertyPageContainer);
        
        // Fetch the data according to the clicked post ID from the web server
        fetch('/property.html?id=' + id)
          .then(response => response.json())
          .then(data => { 
            console.log(data);
          });
        // Add the data to the propety page
        // Style the propety page in CSS
        // Add a review component at the bottom of the property page (maybe to the side too + a few highlights..)
      }
        
      
    });



    

    var map = L.map('map', {attributionControl: false}).setView([42.23, -121.78], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Create a layer group for the markers
    var markerGroup = L.layerGroup();
    markerGroup.addTo(map);
        var cluster = L.markerClusterGroup({
          spiderfyOnMaxZoom: false,
          disableClusteringAtZoom: 17
        }).addTo(map);

    fetch('/map.html')
      .then(response => response.json())
      .then(data => {
        data.forEach(property => {
          var marker =  new customMarker(new L.LatLng(property.Y, property.X), {
            propertyData: property
          }).addTo(cluster);
          // Customize the marker if needed
          // marker.bindPopup(property.Address);
        });
          let visibleMarkers = [];
          let bounds = map.getBounds();

          cluster.eachLayer(function (marker) {
            var markerLatLng = marker.getLatLng();
            if (bounds.contains(markerLatLng)) {
              visibleMarkers.push(marker);
            }
          });
          displayVisibleMarkersData(visibleMarkers);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });

      map.on('moveend', function () {
        var visibleMarkers = [];
        var bounds = map.getBounds();

        cluster.eachLayer(function (marker) {
          var markerLatLng = marker.getLatLng();
          if (bounds.contains(markerLatLng)) {
            visibleMarkers.push(marker);
          }
        });
        displayVisibleMarkersData(visibleMarkers);

      });
}
function displayVisibleMarkersData(markers) {
  var postContainer = document.getElementById('post-container');
  postContainer.innerHTML = '';

  var markerIds = [];
  var addresses = [];
  // iterate through all markers, collect their ids 
  markers.forEach(function (marker) {
    var property = marker.options.propertyData;

    markerIds.push(property.ID);
    addresses.push(property.Address);

  });
  let ids = markerIds.join(',');
  document.getElementById('frame-container').scrollTop = 0;
  //collect data from all visible markers
  fetch('/map.html?selected=true&ids=' + ids)
   .then(response => response.json())
   .then(data => {
    data.forEach((property, i) => {
      var post = document.createElement('div');
      post.className = 'post';
      post.dataset.postId = property.PropertyID;

      // Create post banner image element
      var postBanner = document.createElement('img');
      postBanner.className = 'post-banner';
      postBanner.src = 'images/test.jpg';
      post.appendChild(postBanner);

      // Create post-text container
      var postText = document.createElement('div');
      postText.className = 'post-text';
      

      // Create h1 element for property name
      var propertyName = document.createElement('h1');
      propertyName.id = 'landlord-name';
      propertyName.textContent = property.Name || addresses[i];
      postText.appendChild(propertyName);

      // Create h3 element for property address
      var propertyAddress = document.createElement('h3');
      propertyAddress.textContent = addresses[i];
      postText.appendChild(propertyAddress);

      // Create room details container
      var roomDetailsContainer = document.createElement('div');
      roomDetailsContainer.className = 'room-details';

      // Create room element for number of beds
      var bedRoom = document.createElement('div');
      bedRoom.className = 'room';
      bedRoom.innerHTML = `<img src="images/bed.svg"> ${property.Bedrooms} beds`;
      roomDetailsContainer.appendChild(bedRoom);

      // Create room element for number of baths
      var bathRoom = document.createElement('div');
      bathRoom.className = 'room';
      bathRoom.innerHTML = `<img src="images/bath.svg"> ${property.Bathrooms} baths`;
      roomDetailsContainer.appendChild(bathRoom);

      postText.appendChild(roomDetailsContainer);

      // Create review container
      var reviewContainer = document.createElement('div');
      reviewContainer.className = 'review-container';

      // Create star rating container
      var starRatingContainer = document.createElement('div');
      starRatingContainer.className = 'star-rating-container';
      for (let j = 0; j < 5; j++) {
        var starRating = document.createElement('div');
        starRating.className = 'star-rating';
        starRatingContainer.appendChild(starRating);
      }
      reviewContainer.appendChild(starRatingContainer);

      // Create review count element
      var reviewCount = document.createElement('span');
      reviewCount.textContent = `(${property.RatingCount} reviews)`;
      reviewContainer.appendChild(reviewCount);

      postText.appendChild(reviewContainer);

      // Create h2 element for property price
      var propertyPrice = document.createElement('h2');
      propertyPrice.textContent = `Price: $${property.Cost} /month`;
      postText.appendChild(propertyPrice);
      
      post.append(postText)

      // Append the post element to the post container
      var postContainer = document.getElementById('post-container');
      postContainer.appendChild(post);
  });
})
  .catch(error => {
    console.error('Error fetching data:', error);
  });
}

document.addEventListener('DOMContentLoaded', initializeMap);