import * as L from 'leaflet';
import 'leaflet.markercluster';

var propertyGlobalData = {};
var globalVisiblePosts = [];
var propertyGlobalTags = {};
var map;
var cluster;
var markerGroup;
var mapReviewsType = 'AvgRating';
var mapReviewOrder = 'asc';
var mapReviewPageNumb = 0;
var propsPerPageN = 30;


function fetchGlobalPropertyData() {
  // Get the current map viewport's bounds
  const bounds = map.getBounds();
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();

  // Prepare the bounding box information to send to the server
  const boundingBox = {
    minX: southWest.lng,
    minY: southWest.lat,
    maxX: northEast.lng,
    maxY: northEast.lat
  };

    fetch(`/map.html?minX=${boundingBox.minX}&minY=${boundingBox.minY}&maxX=${boundingBox.maxX}&maxY=${boundingBox.maxY}`)
    .then(response => response.json())
    .then(data => {
      // create posts
      propertyGlobalData = data.propResults;
 
      propertyGlobalTags = data.tagList;
      console.log(data);
      getPropertyPages();
      //addPosts(data);
      markerGroup.clearLayers();
      cluster.clearLayers();
      propertyGlobalData.forEach(property => {
        // create markers
        var marker =  new customMarker(new L.LatLng(property.Y, property.X), {
          propertyData: property
        }).addTo(cluster);
        // Customize the marker if needed
        // marker.bindPopup(property.Address);
      });
        displayVisibleMarkersData();
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }

var customMarker = L.Marker.extend({
  options: { 
     ID: 0,
     Address: 'n/a'
  }
});

var slideIndex = 1;
var activePopup = -1;

function toggleBox(popupBox) {
  if (popupBox.style.display === 'block') {
    popupBox.style.display = 'none'; // Hide the popup box
    activePopup = -1;
  } else {
    popupBox.style.display = 'block'; // Show the popup box
  }
}

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function addPageManagerHandlers(managerName) {
  const reviewsPageManagerCont = document.getElementById(managerName);
  const managerNext = reviewsPageManagerCont.querySelector('.next-page');
  const managerPrev = reviewsPageManagerCont.querySelector('.prev-page');
  const managerInput = reviewsPageManagerCont.querySelector('.page-input');// cont
  managerNext.addEventListener('click', function(event) { // go next page & bounds check to see if next page should vanish or not..
    pagenumb++; // cont here, tyad
    managerInput.value = pagenumb;
    //managerNext.style.display = 'none';
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id')
    
    sortPropertyPageReviews(type, order, pagenumb, id)
      .then(reviewsPresent => {
        if (reviewsPresent === false) {
          managerNext.style.display = 'none';
        }
        managerPrev.style.display = 'initial';
      })
      .catch(error => {
        console.error('Error in sortPropertyPageReviews:', error);
      });
    
    
  });

  managerPrev.addEventListener('click', function(event) { // go prev page & bounds check to see if prev page should vanish or not... next page not needed
    pagenumb--;
    managerInput.value = pagenumb;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id')
    sortPropertyPageReviews(type, order, pagenumb, id);

    if (pagenumb === 0)
      managerPrev.style.display = 'none';
    managerNext.style.display = 'initial';
  });

  managerInput.addEventListener('keydown', function(event) { // bounds check if good, trigger getsReviews()
    if (event.key === 'Enter') {
      alert('poop');
    }
  });
}

function addPageManagerHandlersM(managerName, propsPerPage) { // need to adjust this... pagenumb, etc-yada :)
  const reviewsPageManagerCont = document.getElementById(managerName);
  const managerNext = reviewsPageManagerCont.querySelector('.next-page');
  const managerPrev = reviewsPageManagerCont.querySelector('.prev-page');
  const managerInput = reviewsPageManagerCont.querySelector('.page-input');
  managerNext.addEventListener('click', function(event) { // go next page & bounds check to see if next page should vanish or not..
    mapReviewPageNumb++;

    let reviewPresent = createPropertyPage(mapReviewPageNumb, propsPerPage);
    updateMapPropertyListNavButtons(mapReviewPageNumb, reviewPresent);
    
      
    
  });

  managerPrev.addEventListener('click', function(event) { // go prev page & bounds check to see if prev page should vanish or not... next page not needed
    mapReviewPageNumb--;

    let reviewPresent = createPropertyPage(mapReviewPageNumb, propsPerPage);
    updateMapPropertyListNavButtons(mapReviewPageNumb, reviewPresent);

  managerInput.addEventListener('keydown', function(event) { // bounds check if good, trigger getsReviews()
    if (event.key === 'Enter') {
      alert('poop');
    }
  });
});
}

function createSortDropdown(options) {
  // Create the main container
  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'dropdown';

  // Create the button
  const dropbtn = document.createElement('button');
  dropbtn.className = 'dropbtn';
  dropbtn.id = 'sort-drop-b';

  const dropbtnText = document.createElement('span');
  dropbtnText.className = 'selected-text';
  dropbtnText.innerText = 'Sort: Default';
  dropbtn.appendChild(dropbtnText);

  const icon = document.createElement('i');
  icon.className = 'fas fa-chevron-down';
  dropbtn.appendChild(icon);

  // Create the dropdown content
  const dropdownContent = document.createElement('div');
  dropdownContent.className = 'dropdown-content';
  dropdownContent.id = 'sort-drop-c';
  dropdownContent.style.display = 'none';

  // Append options to the dropdown content
  options.forEach(option => {
    const link = document.createElement('a');
    link.href = '#';
    link.id = option.id;
    link.innerText = option.text;
    dropdownContent.appendChild(link);
  });

  // Append elements to the main container
  dropdownContainer.appendChild(dropbtn);
  dropdownContainer.appendChild(dropdownContent);

  return dropdownContainer;
}

function addReviews(thresh, reviewsContainer, data) {
  reviewsContainer.innerHTML = '';
  let atleastOneReview = false;
  for (let i = 0; i < data.Reviews.length; i++) {
    if (data.Reviews[i].Rating < thresh)
      continue;
    atleastOneReview = true;

    var reviewData = data.Reviews[i];
    var reviewWrap = document.createElement('div');
    reviewWrap.classList.add('property-review');

    // Show Name, title, review, and the text
    // Name - Title - 4/5 Stars
    var reviewVLeft = document.createElement('div');
    reviewVLeft.className = 'rev-v-left';

    var reviewVRight = document.createElement('div');
    reviewVRight.className = 'rev-v-right';
    
    var reviewName = document.createElement('p');
    reviewName.className = 'property-review-name';
    reviewName.innerText = reviewData.ReviewerName;
    reviewVLeft.append(reviewName);

    var reviewTop = getReviewStarContainer(data.Reviews[i], false);
    reviewTop.className = 'property-review-top';
    
    var reviewTitle = document.createElement('span');
    reviewTitle.className = 'property-review-title';
    reviewTitle.innerText = reviewData.Title;
    
    reviewTop.append(reviewTitle);
    reviewVLeft.append(reviewTop);
    
    // Create a container div
    const container = document.createElement('div');
    const contTitle = document.createElement('p');
    contTitle.id = 'header-det';
    contTitle.textContent = 'Reported Details';
    container.append(contTitle);
    
    // Create a table element
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    
    // Function to create a table row with two cells
    const createTableRowWithTwoCells = (label1, value1, label2, value2) => {
      const row = document.createElement('tr');
    
      const labelCell1 = document.createElement('td');
      labelCell1.textContent = label1;
    
      const valueCell1 = document.createElement('td');
      valueCell1.textContent = value1;
    
      const labelCell2 = document.createElement('td');
      labelCell2.textContent = label2;
    
      const valueCell2 = document.createElement('td');
      valueCell2.textContent = value2;
    
      row.appendChild(labelCell1);
      row.appendChild(valueCell1);
      row.appendChild(labelCell2);
      row.appendChild(valueCell2);
    
      return row;
    };
    
    let bedrooms = reviewData.Bedrooms === null || reviewData.Bedrooms === -1 ? 'N/A' : reviewData.Bedrooms;
    let bathrooms = reviewData.Bathrooms === null || reviewData.Bathrooms === -1 ? 'N/A' : reviewData.Bathrooms;
    let rent = reviewData.Rent === null || reviewData.Rent === "-1.00" ? 'N/A' : reviewData.Rent;
    let deposit = reviewData.Deposit === null || reviewData.Deposit === "-1.00" ? 'N/A' : reviewData.Deposit;
    let term = reviewData.Term === null ? 'N/A' : reviewData.Term;
    let tags = reviewData.Tags === null ? 'N/A' : reviewData.Tags;
  
    table.appendChild(createTableRowWithTwoCells('Bedrooms:', bedrooms, 'Rent:', rent));
    table.appendChild(createTableRowWithTwoCells('Bathrooms:', bathrooms, 'Deposit:', deposit));
    
    // Append the table to the container div
    container.appendChild(table);
    reviewVRight.append(container);
    
    // Tags section
    // Create the tag container
    const reviewAddTagContainer = document.createElement('div');
    reviewAddTagContainer.id = 'review-view-tag-container';
    
    // Create the header for property tags
    const headerDet = document.createElement('p');
    headerDet.id = 'header-det';
    headerDet.textContent = '';
    reviewAddTagContainer.appendChild(headerDet);
    
    // Create the div for property tags
    const propertyTags = document.createElement('div');
    propertyTags.className = 'property-tags';

   // Create the tag container divs
  tags.split(',').forEach(tag => {
    const tagContainer = document.createElement('div');
    tagContainer.className = 'tag-container';
    tagContainer.textContent = tag.trim(); // Trim any leading/trailing whitespace
    propertyTags.appendChild(tagContainer);
  });


    reviewAddTagContainer.appendChild(propertyTags);


    var reviewDate = document.createElement('p');
    reviewDate.className = 'property-review-date';
    const date = new Date(reviewData.Date);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const finDate = "Reviewed on " + formattedDate;
    reviewDate.innerText = finDate; 
    reviewVLeft.append(reviewDate);
    
    var majorTopCont = document.createElement('div');
    majorTopCont.className = 'review-maj-top';
    
    majorTopCont.append(reviewVLeft);
    majorTopCont.append(reviewVRight);
    majorTopCont.appendChild(reviewAddTagContainer);
   
    reviewWrap.append(majorTopCont);
    
    // Text
    var reviewText = document.createElement('p');
    reviewText.className = 'property-review-text';
    reviewText.innerText = reviewData.Text;
    reviewWrap.append(reviewText);
    
    reviewsContainer.append(reviewWrap);
    }
    
    // if not at least one review, add a special message
    if (!atleastOneReview) {
      var noReviewsFoundTxt = document.createElement('h3');
      noReviewsFoundTxt.innerText = 'No reviews found... try messing with the filters on the left';
      reviewsContainer.append(noReviewsFoundTxt);
    }
    }
    
    function generateHTMLData(data) {
      const div = document.createElement('div');
      div.className = 'review-star-filter-container';
    
      // need to go through data.Reviews & calculate the % for each star, cont
      // best way of doing this, array 0-4 and for each review array[review.toInt()]++
      // at end of loop, for each level set percentage to array[i]/reviews.length
      // tada!
      const starVotes = [0, 0, 0, 0, 0];
  data.Reviews.forEach(function(review) {
    starVotes[Math.ceil(parseFloat(review.Rating)-1)]++;
  });
  const progressBarWrappers = [
      { star: '5 Star', width: `${Math.round((starVotes[4]/data.Reviews.length) * 100)}%` },
      { star: '4 Star', width: `${Math.round((starVotes[3]/data.Reviews.length) * 100)}%` },
      { star: '3 Star', width: `${Math.round((starVotes[2]/data.Reviews.length) * 100)}%` },
      { star: '2 Star', width: `${Math.round((starVotes[1]/data.Reviews.length) * 100)}%` },
      { star: '1 Star', width: `${Math.round((starVotes[0]/data.Reviews.length) * 100)}%` }
  ];

  progressBarWrappers.forEach(item => {
      const progressBarWrapper = document.createElement('div');
      progressBarWrapper.className = 'progress-bar-wrapper';

      const starSpan = document.createElement('span');
      starSpan.className = 'text-cont';
      const starLink = document.createElement('a');
      starLink.href = '#1';
      starLink.textContent = item.star;
      starSpan.appendChild(starLink);
      progressBarWrapper.appendChild(starSpan);

      const linkBlock = document.createElement('a');
      linkBlock.className = 'link-block';
      linkBlock.href = '#1';

      const progressBarContainer = document.createElement('div');
      progressBarContainer.className = 'progress-bar-container';

      const progressBarInner = document.createElement('div');
      progressBarInner.className = 'progress-bar-inner';
      progressBarInner.style.width = item.width;
      progressBarContainer.appendChild(progressBarInner);

      linkBlock.appendChild(progressBarContainer);
      progressBarWrapper.appendChild(linkBlock);

      const percentageSpan = document.createElement('span');
      percentageSpan.className = 'text-cont';
      const percentageLink = document.createElement('a');
      percentageLink.href = '#1';
      percentageLink.textContent = item.width;
      percentageSpan.appendChild(percentageLink);
      progressBarWrapper.appendChild(percentageSpan);

      div.appendChild(progressBarWrapper);
  });

  return div;
}

function getReviewStarFilterContainer() {
  var starFilterCont = document.createElement('div');
  starFilterCont.className = 'star-filter-container';

  // Add full stars
  for (let j = 0; j < 5; j++) {
    var starRating = document.createElement('div');
    starRating.classList.add('star-rating');
    starRating.classList.add('star-filter');
    starRating.textContent = '☆';
    
    starFilterCont.appendChild(starRating);
  }
  return starFilterCont;
}

// cont here
var pagenumb = 0; // change on input/prev/next
var type = 'date'; // change on dropdown
var order = 'ascend'; // change on dropdown
var savedThresh = 0.0; // good

var dataStream = {};

function sortPropertyPageReviews(type, order, pagenumb, id) {
  return fetch('/getreviews.html?type=' + type + '&order=' + order + '&pagenumb=' + pagenumb + '&id=' + id)
    .then(response => response.json())
    .then(da => { 
      dataStream = da;
      console.log(dataStream);
      
      var reviewCont = document.getElementById('prc');
      addReviews(savedThresh, reviewCont, dataStream);
      var reviewsPerPage = 15;

      if (dataStream.Reviews.length < reviewsPerPage) {
        return false;
      }
      return true;
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
      return false;
    });
}

function refreshMapPageProperties(type, order, pagenumb, id) {
  return fetch('/map.html?type=' + type + '&order=' + order + '&pagenumb=' + pagenumb + '&id=' + id)
    .then(response => response.json())
    .then(da => { 
      dataStream = da;
      console.log(dataStream);

      var reviewCont = document.getElementById('prc');
      addReviews(savedThresh, reviewCont, dataStream);
      var reviewsPerPage = 15;

      if (dataStream.Reviews.length < reviewsPerPage) {
        return false;
      }
      return true;
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
      return false;
    });
}

function getReviewStarContainer(property, addText) {
  var reviewContainer = document.createElement('div');
  reviewContainer.className = 'review-container';

  // Create star rating container
  var starRatingContainer = document.createElement('div');
  starRatingContainer.className = 'star-rating-container';
  
  // Calculate the number of stars based on the rating
  if (addText) {
    var rating = property.AvgRating;
  }
  else {
    var rating = property.Rating;
  }
  var numStars = Math.round(rating * 2) / 2; // Round to the nearest 0.5
  var fullStars = Math.floor(numStars);
  var halfStar = numStars % 1 !== 0;

  // Add full stars
  for (let j = 0; j < fullStars; j++) {
    var starRating = document.createElement('div');
    starRating.className = 'star-rating';
    starRating.textContent = '★';
    starRatingContainer.appendChild(starRating);
  }

  // Add half star if applicable
  if (halfStar) {
    var starRating = document.createElement('div');
    starRating.className = 'star-rating';
    starRating.textContent = '⯪';
    starRatingContainer.appendChild(starRating);
  }

  // Add empty stars to fill remaining space
  for (let j = fullStars + (halfStar ? 1 : 0); j < 5; j++) {
    var starRating = document.createElement('div');
    starRating.className = 'star-rating';
    starRating.textContent = '☆';
    starRatingContainer.appendChild(starRating);
  }

  reviewContainer.appendChild(starRatingContainer);

    // Check if # of reviews should be added, if not just return  cont w/ no text
    if (!addText) {
      return reviewContainer;
    }

  // Create review count element
  var reviewCount = document.createElement('span');
  reviewCount.textContent = `(${property.RatingCount} reviews)`;
  reviewContainer.appendChild(reviewCount);

  return reviewContainer;
}

function showSlides(n) {
  let i;
  let shownImages = 3;
  let slides = document.getElementsByClassName("mySlides");
  if (n > slides.length/shownImages) {slideIndex = 1}    
  if (n < 1) {slideIndex = slides.length/shownImages}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slides[slideIndex-1].style.display = "block";  
  slides[slideIndex+1].style.display = "block";  
  slides[slideIndex+2].style.display = "block";  
}

function createPropertyAddComponent() {
  //Create wrapper thatll hold the container & title of comp
  const reviewAddWrapper = document.createElement('div');
  reviewAddWrapper.id = 'review-add-wrapper';

  const reviewAddTitle = document.createElement('h3');
  reviewAddTitle.innerText = 'Leave a Review'
  

  reviewAddWrapper.append(reviewAddTitle);

  // Create the main container
  const reviewAddContainer = document.createElement('form');
  reviewAddContainer.id = 'review-add-container';
  reviewAddContainer.action = '/submit-review'
  reviewAddContainer.method = 'post';
  reviewAddContainer.enctype = "multipart/form-data";

  // Main container inner wrapper
  const reviewAddWrap = document.createElement('div');
  reviewAddWrap.id = 'review-add-wrap';

  // Create the left section
  const reviewAddLeft = document.createElement('div');
  reviewAddLeft.id = 'review-add-left';

  // Create the text container
  const reviewAddTextContainer = document.createElement('div');
  reviewAddTextContainer.id = 'review-add-text-container';

  // HERE
 
  const reviewAddTop = document.createElement('div');
  reviewAddTop.id = 'review-add-top';

  const reviewAddStarContainer = getReviewStarFilterContainer();
  reviewAddStarContainer.id = 'review-rating-select';
  reviewAddStarContainer.className = 'star-filter-container';
  reviewAddStarContainer.dataset.rating = '';

  // Create the input for the detail title
  const reviewAddTitleWrapper = document.createElement('div');
  reviewAddTitleWrapper.className = 'review-add-top-wrapper';

  const reviewAddTitleLabel = document.createElement('h4'); // Label
  reviewAddTitleLabel.textContent = 'Title*:';
  reviewAddTitleWrapper.append(reviewAddTitleLabel);

  const reviewAddDetailTitle = document.createElement('input'); // input
  reviewAddDetailTitle.id = 'review-add-detail-title';
  reviewAddDetailTitle.placeholder = 'Title...';
  reviewAddDetailTitle.name = 'title';
  reviewAddTitleWrapper.appendChild(reviewAddDetailTitle);

  // Create the input for the reviewers name
  const reviewAddRevNameWrapper = document.createElement('div');
  reviewAddRevNameWrapper.className = 'review-add-top-wrapper';

  const reviewAddRevNameLabel = document.createElement('h4'); // Label
  reviewAddRevNameLabel.textContent = 'Your Name:';
  reviewAddRevNameWrapper.appendChild(reviewAddRevNameLabel);

  const reviewAddDetailReviewerName = document.createElement('input');
  reviewAddDetailReviewerName.id = 'review-add-detail-reviewer-name';
  reviewAddDetailReviewerName.placeholder = 'Anonymous';
  reviewAddDetailReviewerName.name = 'reviewer-name';
  reviewAddRevNameWrapper.appendChild(reviewAddDetailReviewerName);

  const hiddenRating = document.createElement('input');
  hiddenRating.type = 'hidden';
  hiddenRating.id = 'hidden-rating';
  hiddenRating.name = 'rating'

  const hiddenTags = document.createElement('input');
  hiddenTags.type = 'hidden';
  hiddenTags.id = 'hidden-tags';
  hiddenTags.name = 'tags'

  const hiddenDropInput = document.createElement('input');
  hiddenDropInput.type = 'hidden';
  hiddenDropInput.id = 'hidden-term';
  hiddenDropInput.name = 'term'

  const hiddenPropID = document.createElement('input');
  hiddenPropID.type = 'hidden';
  hiddenPropID.id = 'hidden-prop-id';
  hiddenPropID.name = 'prop-id'

  reviewAddTop.append(reviewAddTitleWrapper);
  reviewAddTop.append(reviewAddRevNameWrapper);
  reviewAddTop.append(reviewAddStarContainer);
  reviewAddTop.append(hiddenRating);
  reviewAddTop.append(hiddenTags);
  reviewAddTop.append(hiddenDropInput);
  reviewAddTop.append(hiddenPropID);
  reviewAddTextContainer.append(reviewAddTop);

  // HERE


  // Create the textarea for the review text
  const reviewAddText = document.createElement('textarea');
  reviewAddText.id = 'review-add-text';
  reviewAddText.placeholder = 'Type your review here...';
  reviewAddText.name = 'text'
  reviewAddTextContainer.appendChild(reviewAddText);

  // Append the text container to the left section
  reviewAddLeft.appendChild(reviewAddTextContainer);

  // Append the left section to the main container
  reviewAddWrap.appendChild(reviewAddLeft);

  // Create the right section
  const reviewAddRight = document.createElement('div');
  reviewAddRight.id = 'review-add-right';

  // Create the tag container
  const reviewAddTagContainer = document.createElement('div');
  reviewAddTagContainer.id = 'review-add-tag-container';

  // Create the header for property tags
  const headerDet = document.createElement('p');
  headerDet.id = 'header-det';
  headerDet.textContent = 'Property Tags';
  reviewAddTagContainer.appendChild(headerDet);

  // Create the input tag container
  const reviewTagInputCont = document.createElement('div');
  reviewTagInputCont.id = 'review-tag-input-container';
  // Create the input for adding tags
  const tagAddText = document.createElement('input');
  tagAddText.id = 'tag-add-text';
  tagAddText.placeholder = 'Type tags here...';
  tagAddText.setAttribute('autocomplete', 'off'); 
  reviewTagInputCont.appendChild(tagAddText);

  // Create possible tags container
  const tagPossible = document.createElement('div');
  tagPossible.id = 'tag-possible-container';
  reviewTagInputCont.appendChild(tagPossible);

  reviewAddTagContainer.appendChild(reviewTagInputCont);

  // Create the div for property tags
  const propertyTags = document.createElement('div');
  propertyTags.className = 'property-tags';
  propertyTags.id = 'property-add-tags';
  reviewAddTagContainer.appendChild(propertyTags);

  // Append the tag container to the right section
  reviewAddRight.appendChild(reviewAddTagContainer);

  // Create the detail wrapper
  const reviewAddDetailWrapper = document.createElement('div');
  reviewAddDetailWrapper.id = 'review-add-detail-wrapper';

  // Create the detail title section
  const reviewAddDetailTitleSection = document.createElement('div');
  reviewAddDetailTitleSection.id = 'review-add-detail-title';

  // Create the header for optional property information
  const optionalPropertyInfoHeader = document.createElement('p');
  optionalPropertyInfoHeader.id = 'header-det';
  optionalPropertyInfoHeader.textContent = 'Optional Property Information';
  reviewAddDetailTitleSection.appendChild(optionalPropertyInfoHeader);

  // Append the detail title section to the detail wrapper
  reviewAddDetailWrapper.appendChild(reviewAddDetailTitleSection);

  // Create the detail container
  const reviewAddDetailContainer = document.createElement('div');
  reviewAddDetailContainer.id = 'review-add-detail-container';

  // Create the input containers for different property details, basically just storing until later used
  const propertyDetails = [
    { label: 'Bedrooms', id: 'bedrooms-input', placeholder: 'n/a' }, // cap 10
    { label: 'Bathrooms', id: 'bathrooms-input', placeholder: 'n/a' }, // cap 10
    { label: 'Monthly Rent', id: 'monthly-rent-input', placeholder: 'n/a' }, // 4000 
    { label: 'Security Deposit', id: 'security-deposit-input', placeholder: 'n/a' },
    { label: 'Lease Term', id: 'term-input', placeholder: 'n/a' }, // select from Monthly, 3 month, 6 month, yearly
    { label: 'Sq Footage', id: 'sqfootage-input', placeholder: 'n/a' }
  ];

  propertyDetails.forEach(detail => {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';

    const label = document.createElement('label');
    label.className = 'input-title';
    label.textContent = detail.label;
    inputContainer.appendChild(label);

    if (detail.id === 'term-input') {
      // create dropdown for selecting terms
      // Create the dropdown container
      const dropdownContainer = document.createElement('div');
      dropdownContainer.classList.add('dropdown');
      dropdownContainer.id = 'dropdown-term';
      //dropdownContainer.style.width = '165px'

      // Create the dropdown button
      const dropdownButton = document.createElement('button');
      dropdownButton.id = 'review-add-term-dropdown';
      dropdownButton.className = 'dropbtn';

      var spanElement = document.createElement('span');
      spanElement.className = 'button-text';
      spanElement.textContent = 'N/A';

      dropdownButton.append(spanElement);

      // Create the dropdown icon
      const dropdownIcon = document.createElement('i');
      dropdownIcon.classList.add('fas', 'fa-chevron-down');
      dropdownButton.appendChild(dropdownIcon);

      // Append the dropdown button to the container
      dropdownContainer.appendChild(dropdownButton);

      // Create the dropdown content
      const dropdownContent = document.createElement('div');
      dropdownContent.classList.add('dropdown-content');
      dropdownContent.id = 'review-term-dropdown'

      // Create the dropdown links
      const defaultLink = document.createElement('a');
      defaultLink.href = '#';
      defaultLink.id = 'default';
      defaultLink.textContent = 'N/A';

      const monthlyLink = document.createElement('a');
      monthlyLink.href = '#';
      monthlyLink.id = 'monthly';
      monthlyLink.textContent = 'Month to Month';

      const threeMonthLink = document.createElement('a');
      threeMonthLink.href = '#';
      threeMonthLink.id = 'three-month';
      threeMonthLink.textContent = '3 Months';

      const sixMonthLink = document.createElement('a');
      sixMonthLink.href = '#';
      sixMonthLink.id = 'six-month';
      sixMonthLink.textContent = '6 Months';

      const yearlyLink = document.createElement('a');
      yearlyLink.href = '#';
      yearlyLink.id = 'yearly';
      yearlyLink.textContent = 'Yearly';

      // Append the dropdown links to the dropdown content
      dropdownContent.appendChild(defaultLink);
      dropdownContent.appendChild(monthlyLink);
      dropdownContent.appendChild(threeMonthLink);
      dropdownContent.appendChild(sixMonthLink);
      dropdownContent.appendChild(yearlyLink);

      // Append the dropdown content to the container
      dropdownContainer.appendChild(dropdownContent);

      // Append the dropdown container to the document body
      inputContainer.appendChild(dropdownContainer);

    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = detail.id;
      input.id = detail.id;
      input.className = 'input-field';
      input.placeholder = detail.placeholder;
      inputContainer.appendChild(input);
    }

    reviewAddDetailContainer.appendChild(inputContainer);
  });

  // Append the detail container to the detail wrapper
  reviewAddDetailWrapper.appendChild(reviewAddDetailContainer);

  // Append the detail wrapper to the right section
  reviewAddRight.appendChild(reviewAddDetailWrapper);

  // Append the right section to the main container
  reviewAddWrap.appendChild(reviewAddRight);
  reviewAddContainer.appendChild(reviewAddWrap);

  // Create the submit button
  const reviewAddSubmit = document.createElement('input');
  reviewAddSubmit.id = 'review-add-submit';
  reviewAddSubmit.type = 'submit';
  reviewAddSubmit.value = 'Submit';
  reviewAddContainer.appendChild(reviewAddSubmit);

  reviewAddWrapper.append(reviewAddContainer);
  return reviewAddWrapper;
}

function openPropertyPage(id) {

  // Add display: none to frame-container, load in a detailed-property page dynamnically
  document.getElementById('frame-container').style.display = 'none';
  var propertyPageW = document.getElementById('property-page-container');
  propertyPageW.style.display = 'flex';
  propertyPageW.innerHTML = '';

  // instead of making 'property-page-container', find 'property-page-container'
  var propertyPageContainer = document.getElementById('property-page-container');

  var propertyPage = document.createElement('div');
  propertyPage.className = 'property-page';
  

  var url = new URL(window.location.href);
  var newUrl = url.origin + '/property.html?id=' + id;
  history.pushState(null, null, newUrl);

  // freshly added: remove filter bar
  document.getElementById('filter-container').style.display = 'none';


  // putting this here:
  // i need to change property.html api call to something else
  // i need to find a way to check on connection of my url is property.html?id=
  // & if im not at that property page yet or something, idk something
  // Fetch the data according to the clicked post ID from the web server
  fetch('/getproperty.html?id=' + id)
    .then(response => response.json())
    .then(data => { 
      console.log(data);
      // Wrap slideshow & tags in top-content
      const topContentContainer = document.createElement("div");
      topContentContainer.className = "top-content";
      
      // Image slideshow
      // Create the main elements
      const slideshow = document.createElement("div");
      slideshow.classList.add("slideshow");

      const slideshowContainer = document.createElement("div");
      slideshowContainer.classList.add("slideshow-container");

      // Create the left container
      const slideshowLeft = document.createElement("div");
      slideshowLeft.classList.add("slideshow-left");

      // Create the first slide in the left container
      const slide1 = document.createElement("div");
      slide1.classList.add("mySlides", "fade");

      const numberText1 = document.createElement("div");
      numberText1.classList.add("numbertext");
      numberText1.textContent = "(1-3) / 6";

      const img1 = document.createElement("img");
      img1.src = "https://www.w3schools.com/howto/img_nature_wide.jpg";
      img1.style.width = "100%";

      slide1.appendChild(numberText1);
      slide1.appendChild(img1);

      // Create the second slide in the left container
      const slide2 = document.createElement("div");
      slide2.classList.add("mySlides", "fade");

      const numberText2 = document.createElement("div");
      numberText2.classList.add("numbertext");
      numberText2.textContent = "(4-6) / 6";

      const img2 = document.createElement("img");
      img2.src = "https://www.w3schools.com/howto/img_mountains_wide.jpg";
      img2.style.width = "100%";

      slide2.appendChild(numberText2);
      slide2.appendChild(img2);

      // Create the previous button
      const prevButton = document.createElement("a");
      prevButton.classList.add("prev");
      prevButton.textContent = "❮";

      // Append the slides and the previous button to the left container
      slideshowLeft.appendChild(slide1);
      slideshowLeft.appendChild(slide2);
      slideshowLeft.appendChild(prevButton);

      // Create the right container
      const slideshowRight = document.createElement("div");
      slideshowRight.classList.add("slideshow-right");

      // Create the remaining slides in the right container
      const slide3 = document.createElement("div");
      slide3.classList.add("mySlides", "fade");

      const img3 = document.createElement("img");
      img3.src = "https://www.w3schools.com/howto/img_snow_wide.jpg";
      img3.style.width = "100%";

      slide3.appendChild(img3);

      const slide4 = document.createElement("div");
      slide4.classList.add("mySlides", "fade");

      const img4 = document.createElement("img");
      img4.src = "https://www.w3schools.com/howto/img_mountains_wide.jpg";
      img4.style.width = "100%";

      slide4.appendChild(img4);

      const slide5 = document.createElement("div");
      slide5.classList.add("mySlides", "fade");

      const img5 = document.createElement("img");
      img5.src = "https://www.w3schools.com/howto/img_woods_wide.jpg";
      img5.style.width = "100%";

      slide5.appendChild(img5);

      const slide6 = document.createElement("div");
      slide6.classList.add("mySlides", "fade");

      const img6 = document.createElement("img");
      img6.src = "https://www.w3schools.com/howto/img_woods_wide.jpg";
      img6.style.width = "100%";

      slide6.appendChild(img6);

      // Create the next button
      const nextButton = document.createElement("a");
      nextButton.classList.add("next");
      nextButton.textContent = "❯";

      // Append the slides and the next button to the right container
      slideshowRight.appendChild(slide3);
      slideshowRight.appendChild(slide4);
      slideshowRight.appendChild(slide5);
      slideshowRight.appendChild(slide6);
      slideshowRight.appendChild(nextButton);

      // Append the left container, right container, and dot container to the slideshow container
      slideshowContainer.appendChild(slideshowLeft);
      slideshowContainer.appendChild(slideshowRight);

      // Append the slideshow container and dot container to the slideshow
      slideshow.appendChild(slideshowContainer);
      slideshow.appendChild(document.createElement("br"));
      topContentContainer.append(slideshow);

      // Tags
      /*
        Create a container
        Add tags to an array "data.PropertyData[0].Tags.CarCharger"
        Iterate through all tags
        If a tag value is 1, create element of that tag w/ the text & add to box
        Append container to document
      */
      var propertyTagCont = document.createElement('div');
      propertyTagCont.className = 'property-tag-cont';

      var propertyTagTitle = document.createElement('h3');
      propertyTagTitle.innerText = 'Tags';
      propertyTagCont.append(propertyTagTitle);

      var propertyTags = document.createElement('div');
      propertyTags.className = 'property-tags';

      data.Tags.forEach(function(tag) {
        var tagContainer = document.createElement('div');
        tagContainer.className = 'tag-container';
        tagContainer.innerText = tag;
        propertyTags.appendChild(tagContainer);
      });

      propertyTagCont.append(propertyTags);
      topContentContainer.append(propertyTagCont);
      propertyPage.append(topContentContainer);
      // Main details
      var propertyDetails = document.createElement('div');
      propertyDetails.className = 'property-details';

      var propertyNameCont = document.createElement('div');
      propertyNameCont.className = 'property-name-cont';

      var propertyName = document.createElement('p');
      propertyName.className = 'property-name';
      propertyName.innerText = data.PropertyData[0].Name;
      propertyNameCont.append(propertyName);
      
      propertyDetails.append(propertyNameCont);

      var propertyAddress = document.createElement('p');
      propertyAddress.className = 'property-address';
      propertyAddress.innerText = data.PropertyData[0].Address;
      propertyNameCont.append(propertyAddress);

      propertyDetails.append(propertyNameCont);

      var propReviewCont = getReviewStarContainer(data.PropertyData[0], true);
      propertyDetails.append(propReviewCont);

      var leaseTermDiv = document.createElement('div');
      leaseTermDiv.className = 'property-info';
      var propertyLeaseTermKey = document.createElement('p');
      propertyLeaseTermKey.className = 'property-key';
      propertyLeaseTermKey.innerText = 'Lease Term:';
      leaseTermDiv.appendChild(propertyLeaseTermKey);
      var propertyLeaseTermValue = document.createElement('p');
      propertyLeaseTermValue.className = 'property-value';
      propertyLeaseTermValue.innerText = data.PropertyData[0].LeaseTerm;
      leaseTermDiv.appendChild(propertyLeaseTermValue);
      propertyDetails.appendChild(leaseTermDiv);
      
      var bedRangeDiv = document.createElement('div');
      bedRangeDiv.className = 'property-info';
      var propertyBedRangeKey = document.createElement('p');
      propertyBedRangeKey.className = 'property-key';
      propertyBedRangeKey.innerText = 'Bedrooms:';
      bedRangeDiv.appendChild(propertyBedRangeKey);
      var propertyBedRangeValue = document.createElement('p');
      propertyBedRangeValue.className = 'property-value';
      propertyBedRangeValue.innerText = data.PropertyData[0].BedRange;
      bedRangeDiv.appendChild(propertyBedRangeValue);
      propertyDetails.appendChild(bedRangeDiv);
      
      var bathRangeDiv = document.createElement('div');
      bathRangeDiv.className = 'property-info';
      var propertyBathRangeKey = document.createElement('p');
      propertyBathRangeKey.className = 'property-key';
      propertyBathRangeKey.innerText = 'Bathrooms:';
      bathRangeDiv.appendChild(propertyBathRangeKey);
      var propertyBathRangeValue = document.createElement('p');
      propertyBathRangeValue.className = 'property-value';
      propertyBathRangeValue.innerText = data.PropertyData[0].BathRange;
      bathRangeDiv.appendChild(propertyBathRangeValue);
      propertyDetails.appendChild(bathRangeDiv);
      
      var priceRangeDiv = document.createElement('div');
      priceRangeDiv.className = 'property-info';
      var propertyPriceRangeKey = document.createElement('p');
      propertyPriceRangeKey.className = 'property-key';
      propertyPriceRangeKey.innerText = 'Monthly Rent:';
      priceRangeDiv.appendChild(propertyPriceRangeKey);
      var propertyPriceRangeValue = document.createElement('p');
      propertyPriceRangeValue.className = 'property-value';
      propertyPriceRangeValue.innerText = data.PropertyData[0].PriceRange;
      priceRangeDiv.appendChild(propertyPriceRangeValue);
      propertyDetails.appendChild(priceRangeDiv);
      
      var footageRangeDiv = document.createElement('div');
      footageRangeDiv.className = 'property-info';
      var propertyFootageRangeKey = document.createElement('p');
      propertyFootageRangeKey.className = 'property-key';
      propertyFootageRangeKey.innerText = 'Square Footage:';
      footageRangeDiv.appendChild(propertyFootageRangeKey);
      var propertyFootageRangeValue = document.createElement('p');
      propertyFootageRangeValue.className = 'property-value';
      propertyFootageRangeValue.innerText = data.PropertyData[0].SqFootageRange;
      footageRangeDiv.appendChild(propertyFootageRangeValue);
      propertyDetails.appendChild(footageRangeDiv);
      
      propertyPage.appendChild(propertyDetails);
      

      // Floor plans
      var floorPlanLeft = document.createElement('div');
      floorPlanLeft.className = 'floor-plan-left-container';
      var floorPlanRight = document.createElement('div');
      floorPlanRight.className = 'floor-plan-left-container';
      for (let i = 0; i < data.FloorPlans.length; i++) {
        var plan = data.FloorPlans[i];
        var floorPlan = document.createElement('details');
        floorPlan.className = 'floor-plan';

        var planName = document.createElement('summary');
        planName.className = 'floor-plan-name';
        planName.innerText = 'Plan ' + (i+1);
        floorPlan.append(planName);
        // cont here, need the deposit to be its own div & value to be its own in a table-esque way.
        var planSecurityDeposit = document.createElement('p');
        planSecurityDeposit.className = 'floor-plan-security-deposit';
        planSecurityDeposit.innerText = 'Deposit: ' + plan.SecurityDeposit;
        floorPlan.append(planSecurityDeposit);

        var planSqFootage = document.createElement('p');
        planSqFootage.className = 'floor-plan-sqfootage';
        planSqFootage.innerText = 'SqFootage:' + plan.SqFootage;
        floorPlan.append(planSqFootage);

        var planBed = document.createElement('p');
        planBed.className = 'floor-plan-bedrooms';
        planBed.innerText = 'Bedrooms: ' + plan.Bedrooms;
        floorPlan.append(planBed);

        var planBath = document.createElement('p');
        planBath.className = 'floor-plan-bathrooms';
        planBath.innerText = 'Bathrooms: ' + plan.Bathrooms;
        floorPlan.append(planBath);

        var planPrice = document.createElement('p');
        planPrice.className = 'floor-plan-price';
        planPrice.innerText = 'Rent: ' + plan.MonthlyCost;
        floorPlan.append(planPrice);
        
        // Evenly split floorplans into left & right
        if (i % 2 === 0)
          floorPlanLeft.append(floorPlan);
        else
          floorPlanRight.append(floorPlan);
      }
      // Add to floorplan container
      var floorPlanCont = document.createElement('div');
      floorPlanCont.className = 'floor-plan-main-container'
      floorPlanCont.append(floorPlanLeft);
      floorPlanCont.append(floorPlanRight);
      propertyPage.append(floorPlanCont);

      // Add the review component to the page
      var reviewComp = document.createElement('div');
      reviewComp.className = 'property-review-component'

      var reviewComp = document.createElement('div');
      reviewComp.className = 'property-review-component'

      var reviewBotHead = document.createElement('div');
      reviewBotHead.className = 'property-review-bottom-container'

      var reviewHeader = document.createElement('h3');
      reviewHeader.innerText = 'Tentant Reviews';
      reviewComp.append(reviewHeader);

      var reviewsContainer = document.createElement('div');
      reviewsContainer.className = 'property-reviews-container';
      reviewsContainer.id = 'prc';

      // Left side review section
      var reviewLeftCont = document.createElement('div');
      reviewLeftCont.className = 'property-review-left-container';

      var reviewCont = getReviewStarContainer(data.PropertyData[0], true);
      reviewCont.style.alignSelf = 'center';
      reviewCont.style.fontSize = '18px';
      var filterStarCont = getReviewStarFilterContainer(); //stars added here
      var progressBarWrapper = generateHTMLData(data);

      var reviewFilterText = document.createElement('h4');
      reviewFilterText.innerText = 'Filters';

      const options = [
        { id: 'default', text: 'Sort: Default' },
        { id: 'rating-ascending', text: 'Rating Ascend' },
        { id: 'rating-descending', text: 'Rating Descend' },
        { id: 'date-ascending', text: 'Date Ascend' },
        { id: 'date-descending', text: 'Date Descend' },
      ];    
      var reviewSortCont = createSortDropdown(options);
      reviewSortCont.id = "add-review-drop"
      
      reviewLeftCont.append(reviewCont);
      reviewLeftCont.append(reviewFilterText);
      reviewLeftCont.append(reviewSortCont);
      reviewLeftCont.append(filterStarCont);
      reviewLeftCont.append(progressBarWrapper);

      // Right side review section
      var reviewRightCont = document.createElement('div');
      reviewRightCont.className = 'property-review-right-container';

      // querry each review for the specific property & then for each review, loop through
      // create a new div, property-review
      // HERE HERE HERE
      addReviews(0, reviewsContainer, data);
      reviewRightCont.append(reviewsContainer);

      var reviewsPageManagerContainer = document.createElement('div');
      reviewsPageManagerContainer.className = 'page-manager-container';
      reviewsPageManagerContainer.id = 'reviews-page-manager-container';

      var prevPage = document.createElement('a');
      prevPage.className = 'prev-page';
      prevPage.innerText = 'Previous Page';

      if (pagenumb === 0)
        prevPage.style.display = 'none';
      reviewsPageManagerContainer.append(prevPage);

      var pageInput = document.createElement('input');
      pageInput.className = 'page-input';
      pageInput.value = '0';
      reviewsPageManagerContainer.append(pageInput);

      var nextPage = document.createElement('a');
      nextPage.className = 'next-page';
      nextPage.innerText = 'Next Page';

      if (data.Reviews.length < 15)
        nextPage.style.display = 'none';
      reviewsPageManagerContainer.append(nextPage);

      reviewRightCont.append(reviewsPageManagerContainer);

      // Add a review section
      reviewBotHead.append(reviewLeftCont);
      reviewBotHead.append(reviewRightCont);
      
      reviewComp.append(reviewBotHead);
      propertyPage.append(reviewComp);

      var propertyAddComponent = createPropertyAddComponent(); // stars added here
      propertyPage.append(propertyAddComponent);

      propertyPageContainer.append(propertyPage);
      document.body.append(propertyPageContainer);

      // HANDLERS
      // Submit button handler for custom data insert
      const reviewAddForm = document.getElementById('review-add-container');
      const reviewAddSub = document.getElementById('review-add-submit');
      const reviewAddDrop = document.getElementById('review-add-term-dropdown');
      const reviewAddDropdown = document.getElementById('review-term-dropdown');
      const tagsContainer = document.getElementById('property-add-tags');
      const inputHiddenTag = document.getElementById('hidden-tags');
      const inputHiddenDrop = document.getElementById('hidden-term');
      const inputHiddenPropID = document.getElementById('hidden-prop-id');


      const addReviewDrop = document.getElementById('add-review-drop');
      const dropDownButton = addReviewDrop.querySelector('#sort-drop-b')
      const dropDownButtonTxt = dropDownButton.querySelector('.selected-text')
      const dropDownBox = addReviewDrop.querySelector('#sort-drop-c')
      var dropdownItems = addReviewDrop.querySelectorAll('.dropdown-content a');

      dropDownButton.addEventListener('click', () => {
        toggleBox(dropDownBox);
      });

      // Add listener to each dropdown item
      dropdownItems.forEach(async function(item) {
        item.addEventListener('click', async function(event) {
          var clickedItem = event.target;
          dropDownButtonTxt.innerHTML = clickedItem.innerHTML;
          dropDownButtonTxt.dataset.selected = clickedItem.id;
          

          var pagenumb = 0; // get pg # from some variable, perhaps.. i need a page # component i.e start at 0, and just pull the .value
          const urlParams = new URLSearchParams(window.location.search);
          const id = urlParams.get('id')
          var itemId = clickedItem.id;

          if (itemId === 'rating-ascending') {
            type = 'rating';
            order = 'ascend';
          }
          else if (itemId === 'rating-descending') {
            type = 'rating';
            order = 'descend';
          }
          else if (itemId === 'date-ascending') {
            type = 'date';
            order = 'ascend';
          }
          else if (itemId === 'date-descending') {
            type = 'date';
            order = 'descend';
          } 
          
          await sortPropertyPageReviews(type, order, pagenumb, id);
          toggleBox(dropDownBox);

          // check if prev page / next page buttons should be removed, i.e reviews = 0 HERE
          const managerNext = reviewsPageManagerCont.querySelector('.next-page');
          const managerPrev = reviewsPageManagerCont.querySelector('.prev-page');
          const managerInput = reviewsPageManagerCont.querySelector('.page-input');

          if (dataStream.Reviews.length === 0) {
            managerPrev.style.display = 'none';
          } else if (dataStream.Reviews.length < 15) {
            managerNext.style.display = 'none';
          }
          managerInput.value = '0';
        });
      });

      // add handlers for the page inputs for review page
      addPageManagerHandlers('reviews-page-manager-container');

      
      // Close popup boxes when clicking outside their containers
      document.addEventListener('click', (event) => {
        if (dropDownBox.style.display != 'none' && !dropDownButton.contains(event.target) && !dropDownBox.contains(event.target)) {
          toggleBox(dropDownBox);
        }
      });

      reviewAddForm.addEventListener('submit', (event) => {
        event.preventDefault();
      });

      reviewAddForm.addEventListener('keydown', (event) => { 
        if (event.key === 'Enter') {
          event.preventDefault();
        }
      });
      
      
      reviewAddDrop.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleBox(reviewAddDropdown);
      });

      document.addEventListener('click', (event) => {
        if (!reviewAddDrop.contains(event.target)) {
          reviewAddDropdown.style.display = 'none';
        }
      });
      

      // Add listener to each dropdown item
      var dropdownItem = document.querySelectorAll('#review-term-dropdown a');
      dropdownItem.forEach(function(item) {
        item.addEventListener('click', function(event) {
          var clickedItem = event.target;
          var itemId = clickedItem.id;
          reviewAddDrop.innerHTML = clickedItem.innerHTML;
          reviewAddDropdown.style.display = 'none';
        });
      });

      reviewAddSub.addEventListener('click', (event) => {
        event.preventDefault();
    
        const tagsArray = Array.from(tagsContainer.children).map(child => child.textContent.trim());
      
        // Getting the tags the user has selected
        const joinedTags = tagsArray.join(',');
        inputHiddenTag.value = joinedTags;
        inputHiddenDrop.value = document.getElementById('review-add-term-dropdown').innerText;
      
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('id');
        inputHiddenPropID.value = propertyId;
      
        // Check if required elements are there such as: Title, Text, ReviewStars
        const reviewTitle = document.getElementById('review-add-detail-title');
        const reviewText = document.getElementById('review-add-text');     
        const reviewBed = document.getElementById('bedrooms-input');
        const reviewBath = document.getElementById('bathrooms-input');
        const reviewRent = document.getElementById('monthly-rent-input');
        const reviewDep = document.getElementById('security-deposit-input');
        const reviewTerm = document.getElementById('review-add-term-dropdown');
        const ratingSelect = document.getElementById('review-rating-select');
        const reviewName = document.getElementById('review-add-detail-reviewer-name');

        let errors = '';
        let errorDetected = false;

        if (reviewTitle.value === '') {
          errors += 'Missing title.\n';
          errorDetected = true;
        }

        if (reviewText.value === '') {
          errors += 'Missing review body.\n';
          errorDetected = true;
        }

        if (ratingSelect.dataset.rating === '') {
          errors += 'Missing star rating.\n';
          errorDetected = true;
        }

        if (reviewBed.value !== '' && (isNaN(reviewBed.value) || reviewBed.value < 1 || reviewBed.value > 20)) {
          errors += 'Invalid number of bedrooms. Please enter a number between 1 and 20.\n';
          errorDetected = true;
        }

        if (reviewBath.value !== '' && (isNaN(reviewBath.value) || reviewBath.value < 1 || reviewBath.value > 20)) {
          errors += 'Invalid number of bathrooms. Please enter a number between 1 and 20.\n';
          errorDetected = true;
        }

        if (reviewRent.value !== '' && (isNaN(reviewRent.value) || reviewRent.value < 0 || reviewRent.value > 20000)) {
          errors += 'Invalid monthly rent. Please enter a number between 0 and 20000.\n';
          errorDetected = true;
        }

        if (reviewDep.value !== '' && (isNaN(reviewDep.value) || reviewDep.value < 0 || reviewDep.value > 20000)) {
          errors += 'Invalid security deposit. Please enter a number between 0 and 20000.\n';
          errorDetected = true;
        }

        if (reviewName.value === '') {
          errors += 'Missing reviewer name.\n';
          errorDetected = true;
        }

        if (errorDetected) {
          alert(errors);
        } else {
          // Create a new XMLHttpRequest object
          const xhr = new XMLHttpRequest();
      
          // Configure the request
          xhr.open('POST', reviewAddForm.action, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onload = function() {
            if (xhr.status === 200) {
              // Handle a successful response from the server
              // Here you can update the page content dynamically
              // without refreshing the entire page
              setTimeout(function() {
                window.location.reload();
              }, 1000);
            } else {
              // Handle an error response from the server
              console.error('Form submission failed. Status: ' + xhr.status);
            }
          };

          // Create the JSON data object
          const jsonData = {
            title: reviewTitle.value,
            name: reviewName.value,
            rating: ratingSelect.dataset.rating,
            text: reviewText.value,
            tags: joinedTags,
            bedrooms: reviewBed.value,
            bathrooms: reviewBath.value,
            rent: reviewRent.value,
            deposit: reviewDep.value,
            term: inputHiddenDrop.value,
            propid: inputHiddenPropID.value,
          };
      
          // Send the JSON data
          xhr.send(JSON.stringify(jsonData));
        }
      });
      
      // Property review tag auto correct element
      const textarea = document.getElementById('tag-add-text');
      const tagContainer = document.getElementById('property-add-tags');
      const tagSuggestions = document.getElementById('tag-possible-container');
      const addedTags = new Set();

      function addTag(tag) {
        if (!addedTags.has(tag)) {
          const tagDiv = document.createElement('div');
          tagDiv.classList.add('tag-container');
          tagDiv.textContent = tag;
          tagContainer.appendChild(tagDiv);
          addedTags.add(tag);
        }
      }
      

      textarea.addEventListener('input', handleTagInput);
      textarea.addEventListener('keyup', handleTagInput);

      function handleTagInput() {
        if (textarea.value === '') {
          tagSuggestions.style.display = 'none';
          return;
        } else {
          tagSuggestions.style.display = 'block';
        }
          
        const inputText = textarea.value.trim().toLowerCase();
        const matchingTags = getMatchingTags(inputText);
      
        // Clear previous tag suggestions
        tagSuggestions.innerHTML = '';
      
        // Display matching tag suggestions
        matchingTags.forEach(tag => {
          const tagOption = document.createElement('div');
          tagOption.classList.add('tag-suggestion');
          tagOption.textContent = tag.Title;
          tagOption.addEventListener('click', () => {
            addTag(tag.Title);
            textarea.value = '';
            tagSuggestions.innerHTML = '';
          });
          tagSuggestions.appendChild(tagOption);
        });

        // Select the first tag suggestion
        const allSuggestions = tagSuggestions.querySelectorAll('.tag-suggestion');
        if (allSuggestions.length > 0) {
          allSuggestions[0].classList.add('selected');
        }
      }

      function getMatchingTags(inputText) {
        return data.PossibleTags.filter(tag => tag.Title.toLowerCase().startsWith(inputText));
      }


      textarea.addEventListener('keydown', function(event) {
        console.log(tagSuggestions);
        if (event.key === 'Enter' || event.key === ',') {
          event.preventDefault();
          const selectedSuggestion = tagSuggestions.querySelector('.tag-suggestion.selected');
          if (selectedSuggestion) {
            const selectedTag = selectedSuggestion.textContent;
            addTag(selectedTag);
            textarea.value = '';
            tagSuggestions.innerHTML = '';
          }
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          const selectedSuggestion = tagSuggestions.querySelector('.tag-suggestion');
          const allSuggestions = tagSuggestions.querySelectorAll('.tag-suggestion');
          let index = Array.from(allSuggestions).indexOf(selectedSuggestion);
      
          if (event.key === 'ArrowUp') {
            index = index > 0 ? index - 1 : allSuggestions.length - 1;
          } else if (event.key === 'ArrowDown') {
            index = index < allSuggestions.length - 1 ? index + 1 : 0;
          }
          console.log(index);
          allSuggestions.forEach((suggestion, i) => {
            if (i === index) {
              suggestion.classList.add('selected');
            } else {
              suggestion.classList.remove('selected');
            }
          });
        }
      });
      
      
       // add handler for starFilter here for now
      // hanndler for filter-stars
      var filteredStars = 0;
      const starFilterContainers = document.querySelectorAll('.star-filter-container');
      starFilterContainers.forEach((container) => {
        const parentElement = container.parentNode;
        const stars = container.querySelectorAll('.star-filter');
        stars.forEach((star, index) => {
          star.addEventListener('mouseover', () => {
            // Change the color of stars from left to right when hovering over a star
            for (let i = 0; i <= index; i++) {
              stars[i].textContent = '★';
            }
            for (let i = index+1; i < 5; i++) {
              stars[i].textContent = '☆';
            }
          });
          star.addEventListener('click', () => {
            // ok lazy check here, check if star-filter-container is in 
            // review-add-top, if so- just have it set the stars value
            filteredStars = index+1;
            if (parentElement.id === 'review-add-top') {
              container.dataset.rating = filteredStars;
            } else {

              if (reviewRightCont.firstChild) {
                reviewRightCont.removeChild(reviewRightCont.firstChild);
              }
              reviewsContainer.innerHTML = '';
              savedThresh = filteredStars;
              addReviews(filteredStars, reviewsContainer, data);
              
              reviewRightCont.prepend(reviewsContainer);

              // check if prev page / next page buttons should be removed, i.e reviews = 0 HERE
              const managerNext = reviewsPageManagerCont.querySelector('.next-page');
              const managerPrev = reviewsPageManagerCont.querySelector('.prev-page');
              const managerInput = reviewsPageManagerCont.querySelector('.page-input');

              if (dataStream.Reviews.length === 0) {
                managerPrev.style.display = 'none';
              } else {
                managerPrev.style.display = 'initial';
              
                if (dataStream.Reviews.length < 15) {
                  managerNext.style.display = 'none';
                } else {
                  managerNext.style.display = 'initial';
                }
              }              

              managerInput.value = '0';
            }
          });
          
          container.addEventListener('mouseleave', () => {
            for (let i = 0; i < filteredStars; i++) {
              stars[i].textContent = '★';
            }
            for (let i = filteredStars; i <  5; i++) {
              stars[i].textContent = '☆';
            }
          });
        });
      });
    });

    
    

  // Add the data to the propety page
  // Style the propety page in CSS
  // Add a review component at the bottom of the property page (maybe to the side too + a few highlights..)

  

  setTimeout(function() {
    var prevButton = document.querySelector(".prev"); // this doesnt work all the time, increase timeout or find way to load on demand when pics r done
    var nextButton = document.querySelector(".next");
  
    // Add event listeners to the buttons
    prevButton.addEventListener("click", function() {
      plusSlides(-1);
    });
  
    nextButton.addEventListener("click", function() {
      plusSlides(1);
    });
    showSlides(slideIndex);

    var reviewContainers = document.querySelectorAll('.property-review');
    reviewContainers.forEach(function(container) {
      // Check if post contents overflows, if so apply overflow tag
      if (container.scrollHeight > container.clientHeight) {
        container.classList.add('has-overflow');
      }

      // Add click handlers to remove/add overflow tags
      container.addEventListener('click', function() {
        if (container.classList.contains('has-overflow'))
          container.classList.remove('has-overflow');
    }); 
    });
  }, 400); // Delay of 1000 milliseconds (1 second)
  }

   //here
   function compileCheckedTags() {
    const formSegments = document.querySelectorAll('.form-segment');
    const checkedTags = [];

    formSegments.forEach((formSegment) => {
      const checkboxes = formSegment.querySelectorAll('input[type="checkbox"][name="checkbox"]:checked');
      checkboxes.forEach((checkbox) => {
        checkedTags.push(checkbox.dataset.tagid);
      });
    });

    //const commaSeparatedList = checkedTags.join(',');
    return checkedTags;
  }

function initializeMap() {
    const popupButtons = document.querySelectorAll('.popup-button');
    const popupBoxes = document.querySelectorAll('.popup-box');
    const dropDownButton = document.getElementById('sort-drop-b')
    const dropDownBox = document.getElementById('sort-drop-c')
    var postContainer = document.getElementById('post-container');

    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');


    // Attach the function to the button's onclick event, create new sorted property page here
    var sortButton = document.getElementById('sort-filter-get-button');
    sortButton.addEventListener('click', () => {
      

        // Get the selected value from the dropdown
      var selectedValue = dropDownButton.dataset.val;
      // Update the mapReviewsType and mapReviewOrder variables based on the selected value
      switch (selectedValue) {
        case 'rating-asc':
          mapReviewsType = 'AvgRating';
          mapReviewOrder = 'asc';
          break;
        case 'rating-dsc':
          mapReviewsType = 'AvgRating';
          mapReviewOrder = 'dsc';
          break;
        case 'date-asc':
          mapReviewsType = 'ID';
          mapReviewOrder = 'asc';
          break;
        case 'date-dsc':
          mapReviewsType = 'ID';
          mapReviewOrder = 'dsc';
          break;
        default:
          // Handle the default case if needed
          break;
    }
      const listTags = compileCheckedTags();
      mapReviewPageNumb = 0;
      let reviewPresent = createPropertyPage(mapReviewPageNumb, propsPerPageN);
      displayVisibleMarkersData();
      updateMapPropertyListNavButtons(mapReviewPageNumb, reviewPresent);
      // hoa,garage,parking <- 5,3,2.. itr through globalTags & if .Title === comma elem then collect the .ID in a seperate array
      // w/ the array of filtered tag ids, compared with the commaSeperatedSplitList, if it doesn't exist in the list then add bp;ah ont here
      //let filteredList = commaSeparatedList.filter()
      // Do whatever you want with the commaSeparatedList here (e.g., update a search filter, display it on the page, etc.)
    });

    // search box handler
    // Get references to the input and button elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Function to handle the search
    // Function to handle the search
function performSearch() {
  const query = searchInput.value.trim(); // Get the search query from the input
  if (query !== '') {
      // Send the search query to your server using fetch
      fetch(`/search?q=${encodeURIComponent(query)}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          },
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Request failed with status: ${response.status}`);
          }
          return response.json();
      })
      .then(data => {
          console.log('Server response:', data);

          // Define the bounding box corners
          const southWest = L.latLng(data.bottomLeft.lat, data.bottomLeft.lon);
          const northEast = L.latLng(data.topRight.lat, data.topRight.lon);

          // Create a LatLngBounds object
          const bounds = L.latLngBounds(southWest, northEast);

          // Fit the map's view to the bounding box
          map.fitBounds(bounds);

          // Load new property data given the bounding box
          fetchGlobalPropertyData();
      })
      .catch(error => {
          console.error('Error:', error);
      });
  }
}


    // Add event listeners for button click and Enter key press
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent page refresh
            performSearch();
        }
    });



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
        event.preventDefault();
        var clickedItem = event.target;
        var itemId = clickedItem.id;
        dropDownButton.innerHTML = clickedItem.innerHTML;
        dropDownButton.dataset.val = clickedItem.dataset.val;
        
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

    // Listen for the popstate event
    window.addEventListener('popstate', function(event) {
      // Check if the event.state is null, indicating a forward button click
      if (event.state === null) {
          location.reload();
      }
    });

    // Add postContainer handler for checking when a post is clicked on
    postContainer.addEventListener('click', function(event) {
      var clickedElement = event.target;
      var post = clickedElement.closest('.post');
      if (post) {
        var id = post.dataset.postId;
        openPropertyPage(id);        
      }
    });

    map = L.map('map', {attributionControl: false}).setView([42.23, -121.78], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Create a layer group for the markers
    markerGroup = L.layerGroup();
    markerGroup.addTo(map);
        cluster = L.markerClusterGroup({
          spiderfyOnMaxZoom: false,
          disableClusteringAtZoom: 17
        }).addTo(map);


    // get bounding box of where map starts/is (City, klamath falls).. 
    // send bbox as param. server checks x/y each prop to see if its in box & sends client results
    // Fetch data from the server with the bounding box parameters
    
    fetchGlobalPropertyData();

    const refreshButton = document.getElementById("refreshButton");
    refreshButton.addEventListener("click", function () {
      fetchGlobalPropertyData();
    });

      map.on('moveend', function () {
        mapReviewPageNumb = 0;
        let reviewPresent = createPropertyPage(mapReviewPageNumb, propsPerPageN);
        updateMapPropertyListNavButtons(mapReviewPageNumb, reviewPresent);
        displayVisibleMarkersData();
      });
}

function addPosts(data) {
  console.log('adding posts');
  console.log(data)

  data.forEach((property, i) => {
    //console.log('s');
    //globalVisiblePosts.push(property);
    var post = document.createElement('div');
    post.className = 'post';
    post.dataset.postId = property.ID;

    // Create post banner image element
    var postBanner = document.createElement('img');
    postBanner.className = 'post-banner';
    postBanner.src = 'images/placeholder-home.png';
    post.appendChild(postBanner);

    // Create post-text container
    var postText = document.createElement('div');
    postText.className = 'post-text';
    

    // Create h1 element for property name
    var propertyName = document.createElement('h1');
    propertyName.id = 'landlord-name';
    propertyName.textContent = property.Name || property.Address;
    postText.appendChild(propertyName);

    // Create h3 element for property address
    var propertyAddress = document.createElement('h3');
    propertyAddress.textContent = property.Address;
    postText.appendChild(propertyAddress);

    // Create room details container
    var roomDetailsContainer = document.createElement('div');
    roomDetailsContainer.className = 'room-details';

    // Create room element for number of beds
    var bedRoom = document.createElement('div');
    bedRoom.className = 'room';
    bedRoom.innerHTML = `<img src="images/bed.svg"> ${property.BedRange} beds`;
    roomDetailsContainer.appendChild(bedRoom);

    // Create room element for number of baths
    var bathRoom = document.createElement('div');
    bathRoom.className = 'room';
    bathRoom.innerHTML = `<img src="images/bath.svg"> ${property.BathRange} baths`;
    roomDetailsContainer.appendChild(bathRoom);

    postText.appendChild(roomDetailsContainer);

    // Create review container
    var reviewContainer = getReviewStarContainer(property, true);
    postText.appendChild(reviewContainer);

    // Create h2 element for property price
    var propertyPrice = document.createElement('h2');
    propertyPrice.textContent = `Price: $${property.PriceRange} /month`;
    postText.appendChild(propertyPrice);
    
    post.append(postText)

    // Append the post element to the post container
    var postContainer = document.getElementById('post-container');
    postContainer.appendChild(post);

  });
}

// 
function getPropertyPages() {
  createPropertyPage(0, propsPerPageN);
}

function createPropertyPage(curPg, propsPerPage) {
  // Get the current map viewport's bounds
  const bounds = map.getBounds();
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();

  // Prepare the bounding box information to send to the server
  const boundingBox = {
    minX: southWest.lng,
    minY: southWest.lat,
    maxX: northEast.lng,
    maxY: northEast.lat
  };

  // Filter the propertyGlobalData array to get curatedPosts within the map bounds
  const inBoundsPages = propertyGlobalData.filter(post => {
    return post.X >= boundingBox.minX &&
           post.X <= boundingBox.maxX &&
           post.Y >= boundingBox.minY &&
           post.Y <= boundingBox.maxY;
  });

  // sort the posts by
  const sortedPosts = sortPropertyPages(inBoundsPages); 

  propertyGlobalData.forEach((element) => {
    if (element.Tags !== null && typeof element.Tags === 'string')
      element.Tags = element.Tags.split(',');
    else if (element.Tags === null)
      element.Tags = [];
  });

  const filteredPages = filterPropertyPages(compileCheckedTags(), sortedPosts); 

  var v = [];
  var b = map.getBounds();

  // Create an array to store the IDs of filteredPages
  const filteredPageIDs = filteredPages.map(page => page.ID);

  // Create an array to store the markers that match the filteredPageIDs
  const matchedMarkers = [];

  // Iterate through each marker in the cluster
  cluster.eachLayer(function (marker) {
    // Get the propertyData from the marker (assuming it's set when creating the marker)
    const propertyData = marker.options.propertyData;
    var markerLatLng = marker.getLatLng();
    if (b.contains(markerLatLng) && filteredPageIDs.includes(propertyData.ID)) {
      matchedMarkers.push(marker);
    }
    
  });

  //markerGroup.clearLayers();
  //cluster.clearLayers();
  //displayVisibleMarkersData(v);
  
  let nextPagePossible = filteredPages[curPg*propsPerPage] != undefined;
  updateMapPropertyListNavButtons(curPg, nextPagePossible);
  globalVisiblePosts = filteredPages;
  const slicedPosts = filteredPages.slice(curPg * propsPerPage, propsPerPage * curPg + propsPerPage);
 
  // Call the addPosts function with the filteredPages array
  // Append the post element to the post container
  var postContainer = document.getElementById('post-container');
  postContainer.innerHTML = '';
  addPosts(slicedPosts);

  if (Array.isArray(filteredPages)) {
    return filteredPages[(curPg+1) * propsPerPage] !== undefined;
  } else {
    return false; // or handle the case when filteredPages is not an array
  }  
}

function filterPropertyPages(tags, pages) {
  if (tags.length) {
    const filteredPages = pages.filter((p) => {
      // Check if all tags in 'tags' array are present in 'p.Tags' array
      return tags.every((tag) => p.Tags.includes(tag));
    });
    return filteredPages;
  } else {
    // If tags array is empty, return all pages
    return pages;
  }
}


// Returns a sorted array given a type (Rating, Date) and a order (asc, dsc)
// Returns a sorted array given a type (Rating, Date) and a order (asc, dsc)
function sortPropertyPages(pages) {
  pages.sort((a, b) => {
    const valueA = a[mapReviewsType];
    const valueB = b[mapReviewsType];
    if (mapReviewOrder === 'asc') {
      return valueA - valueB;
    } else if (mapReviewOrder === 'dsc') {
      return valueB - valueA;
    } else {
      // Default to no sorting
      return 0;
    }
  });

  return pages;
}

function updateMapPropertyListNavButtons(curPg, nextPagePossible) {
  var mapPageManager = document.getElementById('map-page-manager-container');
  const managerNext = mapPageManager.querySelector('.next-page');
  const managerPrev = mapPageManager.querySelector('.prev-page');
  const managerInput = mapPageManager.querySelector('.page-input');// cont

  managerPrev.style.display = curPg === 0 ? 'none' : 'initial'; 
  managerNext.style.display = nextPagePossible ? 'initial' : 'none';
  managerInput.value = curPg; 
}


function displayVisibleMarkersData() { // just redo this tbh
  document.getElementById('frame-container').scrollTop = 0;


  cluster.clearLayers();
  
  globalVisiblePosts.forEach(property => {
    // create markers
    var marker =  new customMarker(new L.LatLng(property.Y, property.X), {
      propertyData: property
    }).addTo(cluster);
    // Customize the marker if needed
    // marker.bindPopup(property.Address);
  });
}

var initAlready = false;

document.addEventListener('DOMContentLoaded', () => {
  //clear bt
        // Get the "Clear" button element
      var popBox = document.getElementById('filter-popup-box');
      const clearButton = popBox.querySelector('.clear');

      // Get all the checkboxes
      const checkboxes = popBox.querySelectorAll('input[type="checkbox"]');

      // Add a click event listener to the "Clear" button
      clearButton.addEventListener('click', function () {
        // Loop through all checkboxes and uncheck them
        checkboxes.forEach(function (checkbox) {
          checkbox.checked = false;
        });
      });
  // Check if the current page is the home page ("/")
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');
  // init shit, reoganize this

  const logoContainer = document.getElementById('logo-container');
  const frameContainer = document.getElementById('frame-container');
  const propertPageCont = document.getElementById('property-page-container');

  // Clicked on logo handler
  logoContainer.addEventListener('click', function() {
    frameContainer.style.display = 'flex';
    propertPageCont.style.display = 'none';
    document.getElementById('filter-container').style.display = 'flex';
    history.pushState(null, null, window.location.origin);

    if (!initAlready) { // cont
      initializeMap();
      addPageManagerHandlersM('map-page-manager-container', propsPerPageN);
      initAlready = true;
    }
  });
  if (propertyId) {
    openPropertyPage(propertyId);
  }
  if (window.location.pathname === '/') {
    initializeMap();
    addPageManagerHandlersM('map-page-manager-container', propsPerPageN);
    initAlready = true;
  }
});
