// search-overlay.js
document.addEventListener('DOMContentLoaded', function() {
  const searchButton = document.querySelector('.search-button');
  const searchOverlay = document.getElementById('search-overlay');
  const searchClose = document.querySelector('.search-close');
  const searchBackdrop = document.querySelector('.search-overlay-backdrop');
  const searchInput = document.getElementById('search-input');
  const predictiveSearchResults = document.getElementById('predictive-search-results');
  
  // Initialize variables for predictive search
  let searchTimeout;
  
  if (!searchButton || !searchOverlay) return;
  
  // Open search overlay
  searchButton.addEventListener('click', function(e) {
    e.preventDefault();
    searchOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-open');
    searchBackdrop.classList.add('visible');
    
    // Focus search input after a short delay to ensure the animation completes
    setTimeout(() => {
      searchInput.focus();
    }, 300);
  });
  
  // Close search overlay
  searchClose.addEventListener('click', function() {
    closeSearchOverlay();
  });
  
  // Close search overlay when clicking on backdrop
  searchBackdrop.addEventListener('click', function() {
    closeSearchOverlay();
  });
  
  // Close on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && searchOverlay.getAttribute('aria-hidden') === 'false') {
      closeSearchOverlay();
    }
  });
  
  // Function to close search overlay
  function closeSearchOverlay() {
    searchOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-open');
    searchBackdrop.classList.remove('visible');
    searchInput.value = '';
    predictiveSearchResults.innerHTML = '';
  }
  
  // Handle predictive search input
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.trim();
    
    // Clear previous timeout
    clearTimeout(searchTimeout);
    
    // Clear results if search term is empty
    if (searchTerm === '') {
      predictiveSearchResults.innerHTML = '';
      return;
    }
    
    // Set timeout to avoid too many requests
    searchTimeout = setTimeout(() => {
      // Fetch search results
      fetchPredictiveSearch(searchTerm);
    }, 300);
  });
  
  // Function to fetch predictive search results
  function fetchPredictiveSearch(searchTerm) {
    // Create URL for search endpoint
    const searchUrl = `/search/suggest.json?q=${encodeURIComponent(searchTerm)}&resources[type]=product`;
    
    // Fetch results
    fetch(searchUrl)
      .then(response => response.json())
      .then(data => {
        // Process search results
        displayPredictiveResults(data.resources.results);
      })
      .catch(error => {
        console.error('Error fetching search results:', error);
      });
  }
  
  // Function to display predictive search results
  function displayPredictiveResults(results) {
    // Clear previous results
    predictiveSearchResults.innerHTML = '';
    
    // Get product results
    const products = results.products || [];
    
    if (products.length > 0) {
      // Create container for results
      const resultsContainer = document.createElement('div');
      resultsContainer.className = 'predictive-search-items';
      
      // Loop through products and create result items
      products.slice(0, 4).forEach(product => {
        const resultItem = document.createElement('a');
        resultItem.className = 'predictive-search-item';
        resultItem.href = product.url;
        
        // Create image element
        const image = document.createElement('img');
        image.className = 'predictive-search-image';
        image.src = product.image || 'no-image.jpg';
        image.alt = product.title;
        resultItem.appendChild(image);
        
        // Create info container
        const infoContainer = document.createElement('div');
        infoContainer.className = 'predictive-search-info';
        
        // Create title
        const title = document.createElement('div');
        title.className = 'predictive-search-title';
        title.textContent = product.title;
        infoContainer.appendChild(title);
        
        // Create price
        const price = document.createElement('div');
        price.className = 'predictive-search-price';
        price.textContent = product.price;
        infoContainer.appendChild(price);
        
        resultItem.appendChild(infoContainer);
        resultsContainer.appendChild(resultItem);
      });
      
      // Add "View all results" link
      const viewAllLink = document.createElement('a');
      viewAllLink.className = 'predictive-search-item';
      viewAllLink.href = `/search?q=${encodeURIComponent(searchInput.value.trim())}`;
      viewAllLink.innerHTML = '<div class="predictive-search-info"><div class="predictive-search-title">View all results</div></div>';
      resultsContainer.appendChild(viewAllLink);
      
      predictiveSearchResults.appendChild(resultsContainer);
    } else {
      // Display "no results" message
      const noResults = document.createElement('div');
      noResults.className = 'predictive-search-message';
      noResults.textContent = 'No products found. Try a different search term.';
      predictiveSearchResults.appendChild(noResults);
    }
  }
});