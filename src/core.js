import * as L from 'leaflet';
import 'leaflet.markercluster';

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

function addReviews(thresh, reviewsContainer, data) {
  for (let i = 0; i < data.Reviews.length; i++) {
    if (data.Reviews[i].Rating < thresh)
      continue;

    var reviewData = data.Reviews[i];
    var reviewWrap = document.createElement('div');
    reviewWrap.classList.add('property-review');
  

    var reviewName = document.createElement('p');
    reviewName.className = 'property-review-name';
    reviewName.innerText = reviewData.ReviewerName;
    reviewWrap.append(reviewName);

    // Show Name, title, review, and the text
    // Name - Title - 4/5 Stars
    var reviewStarRatingWrapper = document.createElement('div');
    reviewStarRatingWrapper.className = 'property-star-rating-wrapper';
    var reviewTop = getReviewStarContainer(data.Reviews[i], false);
    reviewTop.className = 'property-review-top';

    var reviewTitle = document.createElement('span');
    reviewTitle.className = 'property-review-title';
    reviewTitle.innerText = reviewData.Title;

    reviewTop.append(reviewTitle);
    reviewStarRatingWrapper.append(reviewTop);
    reviewWrap.append(reviewStarRatingWrapper);

    var reviewDate = document.createElement('p');
    reviewDate.className = 'property-review-date';
    reviewDate.innerText = "Reviewed on July 5, 2023";
    reviewWrap.append(reviewDate);

    // Text
    var reviewText = document.createElement('p');
    reviewText.className = 'property-review-text';
    reviewText.innerText = reviewData.Text;
    reviewWrap.append(reviewText);

    reviewsContainer.append(reviewWrap);
  }
}

function generateHTMLData() {
  const div = document.createElement('div');
  div.className = 'review-star-filter-container';

  // need to go through data.Reviews & calculate the % for each star, cont

  const progressBarWrappers = [
      { star: '5 Star', width: '65%', percentage: '65%' },
      { star: '4 Star', width: '20%', percentage: '20%' },
      { star: '3 Star', width: '7%', percentage: '7%' },
      { star: '2 Star', width: '3%', percentage: '3%' },
      { star: '1 Star', width: '2%', percentage: '2%' }
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
      percentageLink.textContent = item.percentage;
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
    starRating.textContent = '★';
    starFilterCont.appendChild(starRating);
  }
  return starFilterCont;
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
  const reviewAddContainer = document.createElement('div');
  reviewAddContainer.id = 'review-add-container';

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
  // Create the input for the detail title
  const reviewAddDetailTitle = document.createElement('input');
  reviewAddDetailTitle.id = 'review-add-detail-title';
  reviewAddDetailTitle.placeholder = 'Title...';
  reviewAddTextContainer.appendChild(reviewAddDetailTitle);

  reviewAddTop.append(reviewAddDetailTitle);
  reviewAddTop.append(reviewAddStarContainer);
  reviewAddTextContainer.append(reviewAddTop);

  // HERE


  // Create the textarea for the review text
  const reviewAddText = document.createElement('textarea');
  reviewAddText.id = 'review-add-text';
  reviewAddText.placeholder = 'Type your review here...';
  reviewAddTextContainer.appendChild(reviewAddText);

  // Append the text container to the left section
  reviewAddLeft.appendChild(reviewAddTextContainer);

  // Create the submit button
  const reviewAddSubmit = document.createElement('button');
  reviewAddSubmit.id = 'review-add-submit';
  reviewAddSubmit.textContent = 'Submit';
  reviewAddLeft.appendChild(reviewAddSubmit);

  // Append the left section to the main container
  reviewAddContainer.appendChild(reviewAddLeft);

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

  // Create the input for adding tags
  const tagAddText = document.createElement('input');
  tagAddText.id = 'tag-add-text';
  tagAddText.placeholder = 'Type tags here...';
  reviewAddTagContainer.appendChild(tagAddText);

  // Create the div for property tags
  const propertyTags = document.createElement('div');
  propertyTags.id = 'property-tags';
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

  // Create the input containers for different property details
  const propertyDetails = [
    { label: 'Bedrooms', id: 'bedrooms-input', placeholder: 'n/a' },
    { label: 'Bathrooms', id: 'bathrooms-input', placeholder: 'n/a' },
    { label: 'Name', id: 'name-input', placeholder: 'n/a' },
    { label: 'Address', id: 'address-input', placeholder: 'n/a' },
    { label: 'Monthly Rent', id: 'monthly-rent-input', placeholder: 'n/a' },
    { label: 'Security Deposit', id: 'security-deposit-input', placeholder: 'n/a' },
    { label: 'Term', id: 'term-input', placeholder: 'n/a' },
  ];

  propertyDetails.forEach(detail => {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';

    const label = document.createElement('label');
    label.htmlFor = detail.id;
    label.className = 'input-title';
    label.textContent = detail.label;
    inputContainer.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = detail.id;
    input.className = 'input-field';
    input.placeholder = detail.placeholder;
    inputContainer.appendChild(input);

    reviewAddDetailContainer.appendChild(inputContainer);
  });

  // Append the detail container to the detail wrapper
  reviewAddDetailWrapper.appendChild(reviewAddDetailContainer);

  // Append the detail wrapper to the right section
  reviewAddRight.appendChild(reviewAddDetailWrapper);

  // Append the right section to the main container
  reviewAddContainer.appendChild(reviewAddRight);

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

      var propertyName = document.createElement('p');
      propertyName.className = 'property-name';
      propertyName.innerText = data.PropertyData[0].Name;
      propertyDetails.append(propertyName);

      var propReviewCont = getReviewStarContainer(data.PropertyData[0], true);
      propertyDetails.append(propReviewCont);

      var propertyAddress = document.createElement('p');
      propertyAddress.className = 'property-address';
      propertyAddress.innerText = data.PropertyData[0].Address;
      propertyDetails.append(propertyAddress);

      var propertyLeaseTerm = document.createElement('p');
      propertyLeaseTerm.className = 'property-lease-term';
      propertyLeaseTerm.innerText = 'Lease Term: ' + data.PropertyData[0].LeaseTerm;
      propertyDetails.append(propertyLeaseTerm);

      var propertyBedRange = document.createElement('p');
      propertyBedRange.className = 'property-bed-range';
      propertyBedRange.innerText = 'Bedrooms: ' + data.PropertyData[0].BedRange;
      propertyDetails.append(propertyBedRange);

      var propertyBathRange = document.createElement('p');
      propertyBathRange.className = 'property-bath-range';
      propertyBathRange.innerText = 'Bathrooms: ' + data.PropertyData[0].BathRange;
      propertyDetails.append(propertyBathRange);

      var propertyPriceRange = document.createElement('p');
      propertyPriceRange.className = 'property-price-range';
      propertyPriceRange.innerText = 'Monthly Rent: ' + data.PropertyData[0].PriceRange;
      propertyDetails.append(propertyPriceRange);

      var propertyFootageRange = document.createElement('p');
      propertyFootageRange.className = 'property-footage-range';
      propertyFootageRange.innerText = 'Square Footage: ' + data.PropertyData[0].SqFootageRange;
      propertyDetails.append(propertyFootageRange);

      propertyPage.append(propertyDetails);

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

      // Left side review section
      var reviewLeftCont = document.createElement('div');
      reviewLeftCont.className = 'property-review-left-container';

      var reviewCont = getReviewStarContainer(data.PropertyData[0], true);
      reviewCont.style.alignSelf = 'center';
      reviewCont.style.fontSize = '18px';
      var filterStarCont = getReviewStarFilterContainer(); //stars added here
      var progressBarWrapper = generateHTMLData();

      var reviewFilterText = document.createElement('h4');
      reviewFilterText.innerText = 'Filters';
      
      reviewLeftCont.append(reviewCont);
      reviewLeftCont.append(reviewFilterText);
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

      // Add a review section
      var reviewAddContainer = document.createElement('div');
      reviewAddContainer.className = 'property-review-add-container';
      reviewRightCont.append(reviewAddContainer);
      reviewBotHead.append(reviewLeftCont);
      reviewBotHead.append(reviewRightCont);
      
      reviewComp.append(reviewBotHead);
      propertyPage.append(reviewComp);

      var propertyAddComponent = createPropertyAddComponent(); // stars added here
      propertyPage.append(propertyAddComponent);

      propertyPageContainer.append(propertyPage);
      document.body.append(propertyPageContainer);


      // HANDLERS
      // Property review tag auto correct element
      const textarea = document.getElementById('tag-add-text');
      const tagContainer = document.getElementById('property-tags');
      const addedTags = new Set();

      var tempTagdata = { Tags: ['HOA', 'Garage'] };

      textarea.addEventListener('keyup', function (event) {
        if (event.key === 'Enter' || event.key === ',') {
          const tagsArray = textarea.value.split(/,|\n/).map(tag => tag.trim()).filter(tag => tag !== '');
          const tag = tagsArray.length > 0 ? tagsArray[0] : '';
          textarea.value = '';

          // Check if user input exists in tag array, if so add it as a tag
          for (let i = 0; i < tempTagdata.Tags.length; i++) {
            let lowerCheckTag = tempTagdata.Tags[i].toLowerCase();
            if (tag.toLowerCase() === lowerCheckTag) {
              if (!addedTags.has(tag)) {
                const tagDiv = document.createElement('div');
                tagDiv.className = 'tag-container';
                tagDiv.textContent = tempTagdata.Tags[i];
                tagContainer.appendChild(tagDiv);
                addedTags.add(tag);
              }
              break;
            }
          }
        }
      });
       // add handler for starFilter here for now
      // hanndler for filter-stars
      var filteredStars = 5;
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
              addReviews(filteredStars, reviewsContainer, data);
              reviewRightCont.append(reviewsContainer);
            }
          });
          
          container.addEventListener('mouseleave', () => {
            for (let i = 0; i < filteredStars; i++) {
              stars[i].textContent = '★';
            }
            for (let i = index; i > 5; i++) {
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
    var prevButton = document.querySelector(".prev");
    var nextButton = document.querySelector(".next");;
  
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

function initializeMap() {
    const popupButtons = document.querySelectorAll('.popup-button');
    const popupBoxes = document.querySelectorAll('.popup-box');
    const dropDownButton = document.getElementById('sort-drop-b')
    const dropDownBox = document.getElementById('sort-drop-c')
    var postContainer = document.getElementById('post-container');

    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');


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
      post.dataset.postId = property.ID;

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
})
  .catch(error => {
    console.error('Error fetching data:', error);
  });
}

var initAlready = false;

document.addEventListener('DOMContentLoaded', () => {
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

    if (!initAlready) {
      initializeMap();
      initAlready = true;
    }
  });
  if (propertyId) {
    openPropertyPage(propertyId);
  }
  if (window.location.pathname === '/') {
    initializeMap();
    initAlready = true;
  }
});
