document.addEventListener('DOMContentLoaded', function() {

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
           container.dataset.rating = filteredStars;
             
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

    var activePopup = -1;

    function toggleBox(popupBox) {
    if (popupBox.style.display === 'block') {
        popupBox.style.display = 'none'; // Hide the popup box
        activePopup = -1;
    } else {
        popupBox.style.display = 'block'; // Show the popup box
    }
}
    const data = {
        PossibleTags: ['HVAC', 'HOA', 'Gym', 'Dishwasher', 'CarCharger', 'Gated', 'Pool', 'Spa', 'Tennis Court', 'Garage', 'Parking']
    }
    const reviewAddForm = document.getElementById('review-add-container');
    const reviewAddSub = document.getElementById('review-add-submit');
    const reviewAddDrop = document.getElementById('review-add-term-dropdown');
    const reviewAddDropdown = document.getElementById('review-term-dropdown');
    const tagsContainer = document.getElementById('property-add-tags');
    const inputHiddenTag = document.getElementById('hidden-tags');
    const inputHiddenDrop = document.getElementById('hidden-term');
    const inputHiddenPropID = document.getElementById('hidden-prop-id');
    const reviewSqfootage = document.getElementById('sqfootage-input');

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
        const address = document.getElementById('address-input');
        const ratingSelect = document.getElementById('review-rating-select');
        const reviewName = document.getElementById('review-add-detail-reviewer-name');

        let errors = '';
        let errorDetected = false;

        if (reviewTitle.value === '') {
        errors += 'Missing title.\n';
        errorDetected = true;
        }

        if (address.value === '') {
            errors += 'Missing address.\n';
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
            address: address.value,
            sqfootage: reviewSqfootage.value
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
        tagOption.textContent = tag;
        tagOption.addEventListener('click', () => {
            addTag(tag);
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
        return data.PossibleTags.filter(tag => tag.toLowerCase().startsWith(inputText));
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
});