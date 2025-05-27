document.addEventListener('DOMContentLoaded', function() {
  initCatalogueFilters();
  initSortDropdown();
  initDesignFilters();
  initInfiniteScroll();
  updateFilterButtonCount(); // Initialize filter button count
  
  // Initialize catalogue filters functionality
  function initCatalogueFilters() {
    const filterTrigger = document.querySelector('[data-filter-trigger]');
    const filtersContainer = document.querySelector('[data-catalogue-filters]');
    const filtersClose = document.querySelector('[data-filter-close]');
    const filtersBackdrop = document.querySelector('[data-filters-backdrop]');
    const filterForm = document.querySelector('[data-filter-form]');
    
    if (!filterTrigger || !filtersContainer || !filtersClose || !filtersBackdrop) return;
    
    // Open filters panel
    filterTrigger.addEventListener('click', function() {
      filtersContainer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('filters-open');
      filtersBackdrop.classList.add('visible');
    });
    
    // Close filters panel
    filtersClose.addEventListener('click', function() {
      closeFilters();
    });
    
    // Close filters when clicking on backdrop
    filtersBackdrop.addEventListener('click', function() {
      closeFilters();
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && filtersContainer.getAttribute('aria-hidden') === 'false') {
        closeFilters();
      }
    });
    
    // Function to close filters panel
    function closeFilters() {
      filtersContainer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('filters-open');
      filtersBackdrop.classList.remove('visible');
    }
    
    // Set up filter form handlers
    if (filterForm) {
      handleFilterFormSubmission(filterForm);
      handlePersonalizationFilters(filterForm); // Add personalization OR logic
      
      // Check for active filters and highlight them
      highlightActiveFilters();
    }
    
    // Function to highlight active filters based on URL parameters
    function highlightActiveFilters() {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for each type of filter in the URL
      for (const [key, value] of urlParams.entries()) {
        if (key.startsWith('filter.')) {
          // For metafield filters that might have multiple values
          if (key.startsWith('filter.p.m.')) {
            // Split comma-separated values
            const values = value.split(',');
            
            values.forEach(val => {
              // Find corresponding checkbox and check it
              const checkbox = filterForm.querySelector(`input[name="${key}"][value="${val}"]`);
              if (checkbox) {
                checkbox.checked = true;
              }
            });
          } else {
            // For regular filters
            const filterInputs = filterForm.querySelectorAll(`input[name="${key}"]`);
            
            filterInputs.forEach(input => {
              if (input.value === value || value.split(',').includes(input.value)) {
                input.checked = true;
              }
            });
          }
        }
      }
    }
  }
  
  // Handle filter form submission for metafield filters
  function handleFilterFormSubmission(filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(filterForm);
      const searchParams = new URLSearchParams();
      const metafieldFilters = {};
      
      // Build filter parameters
      for (const [key, value] of formData.entries()) {
        if (!value) continue;
        
        // Check if this is a metafield filter
        if (key.startsWith('filter.p.m.')) {
          // Extract the metafield path
          const metafieldPath = key.replace('filter.p.m.', '');
          
          // Group values for the same metafield
          if (!metafieldFilters[metafieldPath]) {
            metafieldFilters[metafieldPath] = [];
          }
          metafieldFilters[metafieldPath].push(value);
        } else {
          // Regular filter parameter
          searchParams.append(key, value);
        }
      }
      
      // Add metafield filters to search params
      for (const [path, values] of Object.entries(metafieldFilters)) {
        // Format for Shopify: filter.p.m.metafield_path=value1,value2,...
        searchParams.append(`filter.p.m.${path}`, values.join(','));
      }
      
      // Preserve sort parameter if it exists
      const url = new URL(window.location.href);
      const sortBy = url.searchParams.get('sort_by');
      if (sortBy) {
        searchParams.append('sort_by', sortBy);
      }
      
      // Redirect to filtered catalogue URL
      window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
    });
    
    // Handle filter form reset
    filterForm.addEventListener('reset', function() {
      // Wait for form to reset
      setTimeout(() => {
        // Preserve sort parameter if it exists
        const url = new URL(window.location.href);
        const sortBy = url.searchParams.get('sort_by');
        
        // Redirect to base catalogue URL with sort parameter if it exists
        if (sortBy) {
          window.location.href = `${window.location.pathname}?sort_by=${sortBy}`;
        } else {
          window.location.href = window.location.pathname;
        }
      }, 0);
    });
  }
  
  // Handle personalization filter OR logic
  function handlePersonalizationFilters(filterForm) {
    filterForm.addEventListener('submit', function(e) {
      // Find all checked personalization theme checkboxes
      const personalizationCheckboxes = filterForm.querySelectorAll('input[name*="personalization_themes"]:checked');
      
      if (personalizationCheckboxes.length > 1) {
        e.preventDefault();
        
        // Get all other form data
        const formData = new FormData(filterForm);
        const searchParams = new URLSearchParams();
        
        // Add non-personalization filters normally
        for (const [key, value] of formData.entries()) {
          if (!key.includes('personalization_themes')) {
            searchParams.append(key, value);
          }
        }
        
        // Add personalization filters as separate parameters for OR logic
        personalizationCheckboxes.forEach(checkbox => {
          searchParams.append(checkbox.name, checkbox.value);
        });
        
        // Preserve sort parameter if it exists
        const url = new URL(window.location.href);
        const sortBy = url.searchParams.get('sort_by');
        if (sortBy) {
          searchParams.append('sort_by', sortBy);
        }
        
        // Redirect with proper OR parameters
        window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
      }
      // If only one personalization filter is selected, let the form submit normally
    });
  }
  
  // Function to update filter button with active filter count
  function updateFilterButtonCount() {
    const filterButton = document.querySelector('[data-filter-trigger]');
    if (!filterButton) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    let activeFilterCount = 0;
    
    // Count active filters
    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith('filter.')) {
        // For comma-separated values, count each as a separate filter
        if (value.includes(',')) {
          activeFilterCount += value.split(',').length;
        } else {
          activeFilterCount += 1;
        }
      }
    }
    
    // Update the filter button text
    const filterButtonText = filterButton.querySelector('span');
    if (filterButtonText) {
      if (activeFilterCount > 0) {
        filterButtonText.textContent = `Filters (${activeFilterCount})`;
      } else {
        filterButtonText.textContent = 'Filters';
      }
    }
    
    // Add an active class to the filter button if filters are applied
    if (activeFilterCount > 0) {
      filterButton.classList.add('has-active-filters');
    } else {
      filterButton.classList.remove('has-active-filters');
    }
  }
  
  // Initialize design filters functionality
  function initDesignFilters() {
    const designFilterButtons = document.querySelectorAll('.design-filter-button');
    
    if (!designFilterButtons.length) return;
    
    // Handle design filter button click
    designFilterButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        designFilterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Get filter value
        const filterValue = this.getAttribute('data-filter-value');
        
        // Note: Actual filtering logic will be added later
        console.log('Filter by design:', filterValue);
      });
    });
  }
  
  // Initialize sort dropdown functionality
  function initSortDropdown() {
    const sortButton = document.querySelector('[data-sort-trigger]');
    const sortDropdown = document.getElementById('sort-dropdown');
    const sortOptions = document.querySelectorAll('.sort-option');
    
    if (!sortButton || !sortDropdown) return;
    
    // Get current sort from URL if exists
    const urlParams = new URLSearchParams(window.location.search);
    const currentSort = urlParams.get('sort_by');
    
    // Set active sort option on page load
    if (currentSort) {
      sortOptions.forEach(option => {
        if (option.getAttribute('data-sort-value') === currentSort) {
          // Mark this option as active
          option.classList.add('active');
          
          // Update button text to show current sort
          const sortButtonText = sortButton.querySelector('span');
          if (sortButtonText) {
            sortButtonText.textContent = 'Sort: ' + option.textContent;
          }
        }
      });
    }
    
    // Toggle sort dropdown
    sortButton.addEventListener('click', function() {
      const isExpanded = sortButton.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        closeSortDropdown();
      } else {
        openSortDropdown();
      }
    });
    
    // Handle sort option click
    sortOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Get sort value
        const sortValue = this.getAttribute('data-sort-value');
        
        // Update button text to show current sort
        const sortButtonText = sortButton.querySelector('span');
        if (sortButtonText) {
          sortButtonText.textContent = 'Sort: ' + this.textContent;
        }
        
        // Mark this option as active
        sortOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');
        
        // Close dropdown
        closeSortDropdown();
        
        // Apply the sort parameter to the URL
        const url = new URL(window.location.href);
        
        // Set the sort_by parameter
        if (sortValue) {
          url.searchParams.set('sort_by', sortValue);
        } else {
          url.searchParams.delete('sort_by');
        }
        
        // Redirect to the new URL
        window.location.href = url.toString();
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!sortButton.contains(e.target) && !sortDropdown.contains(e.target) && 
          sortDropdown.getAttribute('aria-hidden') === 'false') {
        closeSortDropdown();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sortDropdown.getAttribute('aria-hidden') === 'false') {
        closeSortDropdown();
      }
    });
    
    function openSortDropdown() {
      sortButton.setAttribute('aria-expanded', 'true');
      sortDropdown.setAttribute('aria-hidden', 'false');
    }
    
    function closeSortDropdown() {
      sortButton.setAttribute('aria-expanded', 'false');
      sortDropdown.setAttribute('aria-hidden', 'true');
    }
  }
  
  // Initialize infinite scroll functionality for pagination
  function initInfiniteScroll() {
    const catalogueGrid = document.querySelector('[data-catalogue-grid]');
    const loadMoreButton = document.querySelector('[data-load-more-button]');
    
    if (!catalogueGrid || !loadMoreButton) return;
    
    let isLoading = false;
    
    // Handle load more button click
    loadMoreButton.addEventListener('click', function() {
        if (isLoading) return;
        
        isLoading = true;
        
        // Show loading state
        loadMoreButton.textContent = 'Loading...';
        
        // Find the next page URL from pagination
        const nextPageLink = document.querySelector('.pagination-next');
        if (!nextPageLink) {
            loadMoreButton.style.display = 'none';
            return;
        }
        
        // Fetch next page products
        fetch(nextPageLink.href)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newProducts = doc.querySelectorAll('.catalogue-product');
                
                // Append new products to the grid
                newProducts.forEach(product => {
                    catalogueGrid.appendChild(product.cloneNode(true));
                });
                
                // Update pagination links
                const newNextPageLink = doc.querySelector('.pagination-next');
                if (!newNextPageLink) {
                    loadMoreButton.style.display = 'none';
                } else {
                    // Update the next page link for subsequent loads
                    const currentNextLink = document.querySelector('.pagination-next');
                    if (currentNextLink) {
                        currentNextLink.href = newNextPageLink.href;
                    }
                    loadMoreButton.textContent = 'Load More';
                }
                
                isLoading = false;
            })
            .catch(error => {
                console.error('Error loading more products:', error);
                loadMoreButton.textContent = 'Load More';
                isLoading = false;
            });
    });
  }
});