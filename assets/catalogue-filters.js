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
      
      // Preserve active design filter or primary category filter if it exists
      const activeDesignButton = document.querySelector('.design-filter-button.active:not([data-filter-value="all"])');
      if (activeDesignButton) {
        const designParam = activeDesignButton.getAttribute('data-filter-param');
        const designValue = activeDesignButton.getAttribute('data-filter-value');
        if (designParam && designValue) {
          searchParams.append(designParam, designValue);
        }
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
        
        // Preserve active design filter or primary category filter if it exists
        const activeDesignButton = document.querySelector('.design-filter-button.active:not([data-filter-value="all"])');
        const searchParams = new URLSearchParams();
        
        if (sortBy) {
          searchParams.append('sort_by', sortBy);
        }
        
        if (activeDesignButton) {
          const designParam = activeDesignButton.getAttribute('data-filter-param');
          const designValue = activeDesignButton.getAttribute('data-filter-value');
          if (designParam && designValue) {
            searchParams.append(designParam, designValue);
          }
        }
        
        // Redirect to base catalogue URL with preserved parameters
        if (searchParams.toString()) {
          window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
        } else {
          window.location.href = window.location.pathname;
        }
      }, 0);
    });
  }

  // Handle multiple filter OR logic (personalization + color + material + styles + collections)
  function handlePersonalizationFilters(filterForm) {
    filterForm.addEventListener('submit', function(e) {
      // Find all checked checkboxes for filters that need OR logic
      const personalizationCheckboxes = filterForm.querySelectorAll('input[name*="personalization_themes"]:checked');
      const colorCheckboxes = filterForm.querySelectorAll('input[name*="color-pattern"]:checked');
      const materialCheckboxes = filterForm.querySelectorAll('input[name*="jewelry-material"]:checked');
      const styleCheckboxes = filterForm.querySelectorAll('input[name*="jewelry-type"]:checked');
      const collectionsCheckboxes = filterForm.querySelectorAll('input[name*="custom.collections"]:checked');
      
      const needsOrLogic = personalizationCheckboxes.length > 1 || 
                          colorCheckboxes.length > 1 || 
                          materialCheckboxes.length > 1 ||
                          styleCheckboxes.length > 1 ||
                          collectionsCheckboxes.length > 1;
      
      if (needsOrLogic) {
        e.preventDefault();
        
        // Get all other form data
        const formData = new FormData(filterForm);
        const searchParams = new URLSearchParams();
        
        // Add non-OR filters normally
        for (const [key, value] of formData.entries()) {
          if (!key.includes('personalization_themes') && 
              !key.includes('color-pattern') && 
              !key.includes('jewelry-material') &&
              !key.includes('jewelry-type') &&
              !key.includes('custom.collections')) {
            searchParams.append(key, value);
          }
        }
        
        // Add personalization filters as separate parameters for OR logic
        personalizationCheckboxes.forEach(checkbox => {
          searchParams.append(checkbox.name, checkbox.value);
        });
        
        // Add color filters as separate parameters for OR logic
        colorCheckboxes.forEach(checkbox => {
          searchParams.append(checkbox.name, checkbox.value);
        });
        
        // Add material filters as separate parameters for OR logic
        materialCheckboxes.forEach(checkbox => {
          searchParams.append(checkbox.name, checkbox.value);
        });
        
        // Add style filters as separate parameters for OR logic
        styleCheckboxes.forEach(checkbox => {
          searchParams.append(checkbox.name, checkbox.value);
        });
        
        // Add collections filters as separate parameters for OR logic
        collectionsCheckboxes.forEach(checkbox => {
          searchParams.append(checkbox.name, checkbox.value);
        });
        
        // Preserve sort parameter if it exists
        const url = new URL(window.location.href);
        const sortBy = url.searchParams.get('sort_by');
        if (sortBy) {
          searchParams.append('sort_by', sortBy);
        }
        
        // Preserve active design filter or primary category filter if it exists
        const activeDesignButton = document.querySelector('.design-filter-button.active:not([data-filter-value="all"])');
        if (activeDesignButton) {
          const designParam = activeDesignButton.getAttribute('data-filter-param');
          const designValue = activeDesignButton.getAttribute('data-filter-value');
          if (designParam && designValue) {
            searchParams.append(designParam, designValue);
          }
        }
        
        // Redirect with proper OR parameters
        window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
      }
      // If only one filter of each type is selected, let the form submit normally
    });
  }
    
    // Function to update filter button with active filter count
    function updateFilterButtonCount() {
      const filterButton = document.querySelector('[data-filter-trigger]');
      if (!filterButton) return;
      
      const urlParams = new URLSearchParams(window.location.search);
      let activeFilterCount = 0;
      
      // Count active filters (excluding design filters)
      for (const [key, value] of urlParams.entries()) {
        if (key.startsWith('filter.') && !isDesignFilter(key)) {
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
    
    // Helper function to check if a filter parameter is a design filter
    function isDesignFilter(paramKey) {
      const designFilterTypes = ['earring-design', 'ring-design', 'necklace-design', 'bracelet-design'];
      const isDesign = designFilterTypes.some(type => paramKey.includes(type));
      const isPrimaryCategory = paramKey.includes('filter.p.m.custom.primary_category');
      return isDesign || isPrimaryCategory;
    }
    
    // Initialize design filters functionality with actual filtering
    function initDesignFilters() {
      console.log('=== DESIGN FILTERS INITIALIZATION ==='); // Debug log
      
      const designFilterButtons = document.querySelectorAll('.design-filter-button');
      console.log('Found design filter buttons:', designFilterButtons.length); // Debug log
      
      if (!designFilterButtons.length) {
        console.log('No design filter buttons found, exiting'); // Debug log
        return;
      }
      
      // Check if we need to create dynamic product type filters instead
      console.log('Checking for collection data...'); // Debug log
      const collectionData = getCollectionData();
      console.log('Collection data result:', collectionData); // Debug log
      
      if (collectionData) {
        console.log('Collection type detected:', collectionData.collection_type); // Debug log
        console.log('Products count:', collectionData.products ? collectionData.products.length : 'No products'); // Debug log
        
        if (collectionData.collection_type === 'collection') {
          console.log('Creating primary category filters for collection type'); // Debug log
          
          // Check if we need to preserve the original button set or get it from storage
          const urlParams = new URLSearchParams(window.location.search);
          const hasActiveFilter = urlParams.has('filter.p.m.custom.primary_category');
          
          if (hasActiveFilter) {
            // We have an active filter, so try to get the original button set from sessionStorage
            const originalCategories = getStoredOriginalCategories();
            if (originalCategories) {
              console.log('Using stored original categories:', originalCategories);
              createProductTypeFiltersFromStored(originalCategories);
            } else {
              // Fallback: create from current data but this might be incomplete
              console.log('No stored categories found, creating from current data (may be incomplete)');
              createProductTypeFilters(collectionData);
            }
          } else {
            // No active filter, this is the unfiltered state - store the categories for later use
            console.log('No active filter, storing original categories for later use');
            createProductTypeFilters(collectionData);
            storeOriginalCategories(collectionData);
          }
          
          // Set active state and add event listeners
          setActiveProductTypeFilterFromURL();
          addProductTypeEventListeners();
          
          // Initialize scroll indicators
          initScrollIndicators();
          return; // Exit early, don't run standard design filter code
        } else {
          console.log('Using standard design filters (collection_type is not "collection")'); // Debug log
        }
      } else {
        console.log('No collection data found, using standard design filters'); // Debug log
      }
      
      // Standard design filter logic
      setActiveDesignFilterFromURL();
      initScrollIndicators();
      
      // Handle design filter button click
      designFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
          console.log('Standard design filter clicked:', this.getAttribute('data-filter-value')); // Debug log
          
          // Remove active class from all buttons
          designFilterButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          this.classList.add('active');
          
          // Apply the design filter
          applyDesignFilter(this);
        });
      });
    }
    
    // Store original categories in sessionStorage for use after filtering
    function storeOriginalCategories(collectionData) {
      const categories = getUniquePrimaryCategories(collectionData.products);
      const collectionHandle = window.location.pathname;
      
      try {
        sessionStorage.setItem(`originalCategories_${collectionHandle}`, JSON.stringify(categories));
        console.log('Stored original categories:', categories);
      } catch (e) {
        console.warn('Could not store categories in sessionStorage:', e);
      }
    }
    
    // Get stored original categories from sessionStorage
    function getStoredOriginalCategories() {
      const collectionHandle = window.location.pathname;
      
      try {
        const stored = sessionStorage.getItem(`originalCategories_${collectionHandle}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Could not retrieve categories from sessionStorage:', e);
      }
      
      return null;
    }
    
    // Create product type filters from stored categories
    function createProductTypeFiltersFromStored(storedCategories) {
      const designFiltersContainer = document.querySelector('.design-filters');
      if (!designFiltersContainer) return;
      
      console.log('Creating primary category filters from stored data...'); // Debug log
      
      // Clear existing buttons
      designFiltersContainer.innerHTML = '';
      
      // Create "All" button first
      const allButton = createProductTypeButton('all', 'All', true);
      designFiltersContainer.appendChild(allButton);
      
      // Create buttons for each stored category
      storedCategories.forEach(category => {
        const button = createProductTypeButton(category.value, category.label, false);
        designFiltersContainer.appendChild(button);
      });
      
      // Initialize scroll indicators for the new buttons
      initScrollIndicators();
    }
    
    // Add event listeners to product type buttons
    function addProductTypeEventListeners() {
      const productTypeButtons = document.querySelectorAll('.design-filter-button');
      productTypeButtons.forEach(button => {
        // Remove any existing listeners by cloning the button
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', function() {
          console.log('Primary category button clicked:', this.getAttribute('data-filter-value')); // Debug log
          
          // Remove active class from all buttons
          const allButtons = document.querySelectorAll('.design-filter-button');
          allButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          this.classList.add('active');
          
          // Apply the product type filter
          applyProductTypeFilter(this);
        });
      });
    }
    
    // Get collection data from the page
    function getCollectionData() {
      console.log('Looking for collection data element...'); // Debug log
      const collectionDataElement = document.querySelector('[data-collection-info]');
      
      if (collectionDataElement) {
        console.log('Collection data element found'); // Debug log
        console.log('Raw text content:', collectionDataElement.textContent); // Debug log
        
        try {
          const data = JSON.parse(collectionDataElement.textContent);
          console.log('Successfully parsed collection data:', data); // Debug log
          return data;
        } catch (e) {
          console.error('Error parsing collection data JSON:', e);
          console.log('Raw content that failed to parse:', collectionDataElement.textContent);
          return null;
        }
      } else {
        console.error('Collection data element with [data-collection-info] not found in DOM');
        // Let's see what elements are available
        const allDataElements = document.querySelectorAll('[data-*]');
        console.log('Available data elements:', Array.from(allDataElements).map(el => el.getAttribute('data-*') || el.outerHTML.substring(0, 100)));
        return null;
      }
    }
    
    // Create product type filters for collections
    function createProductTypeFilters(collectionData) {
      const designFiltersContainer = document.querySelector('.design-filters');
      if (!designFiltersContainer) return;
      
      console.log('Creating primary category filters...'); // Debug log
      
      // Clear existing buttons
      designFiltersContainer.innerHTML = '';
      
      // Get unique primary categories from the collection products
      const primaryCategories = getUniquePrimaryCategories(collectionData.products);
      console.log('Found primary categories:', primaryCategories); // Debug log
      
      if (primaryCategories.length === 0) {
        console.log('No primary categories found, creating fallback'); // Debug log
        // Create just the "All" button as fallback
        const allButton = createProductTypeButton('all', 'All', true);
        designFiltersContainer.appendChild(allButton);
        return;
      }
      
      // Create "All" button first
      const allButton = createProductTypeButton('all', 'All', true);
      designFiltersContainer.appendChild(allButton);
      
      // Create buttons for each primary category found in the collection
      primaryCategories.forEach(category => {
        const button = createProductTypeButton(category.value, category.label, false);
        designFiltersContainer.appendChild(button);
      });
      
      // Initialize scroll indicators for the new buttons
      initScrollIndicators();
    }
    
    // Get unique primary categories from products
    function getUniquePrimaryCategories(products) {
      const categories = new Map();
      
      products.forEach(product => {
        const primaryCategory = product.primary_category;
        if (primaryCategory && primaryCategory.trim() !== '') {
          const value = primaryCategory.toLowerCase().trim();
          const label = primaryCategory.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          
          categories.set(value, { value, label });
        }
      });
      
      return Array.from(categories.values()).sort((a, b) => a.label.localeCompare(b.label));
    }
    
    // Create a product type filter button
    function createProductTypeButton(value, label, isActive) {
      const button = document.createElement('button');
      button.className = `design-filter-button ${isActive ? 'active' : ''}`;
      button.setAttribute('data-filter-value', value);
      // Use correct metafield filter parameter for custom.primary_category
      button.setAttribute('data-filter-param', 'filter.p.m.custom.primary_category');
      button.textContent = label;
      return button;
    }
    
    // Set active product type filter based on URL parameters
    function setActiveProductTypeFilterFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const productTypeButtons = document.querySelectorAll('.design-filter-button');
      
      // First, remove active class from all buttons
      productTypeButtons.forEach(btn => btn.classList.remove('active'));
      
      // Check for primary category filter in URL
      const primaryCategoryParam = urlParams.get('filter.p.m.custom.primary_category');
      console.log('Primary category from URL:', primaryCategoryParam); // Debug log
      
      if (primaryCategoryParam) {
        const matchingButton = Array.from(productTypeButtons).find(button => {
          return button.getAttribute('data-filter-value') === primaryCategoryParam;
        });
        
        if (matchingButton) {
          matchingButton.classList.add('active');
          moveFilterButtonToFront(matchingButton);
          return;
        }
      }
      
      // If no primary category filter is active, activate the "All" button
      const allButton = document.querySelector('.design-filter-button[data-filter-value="all"]');
      if (allButton) {
        allButton.classList.add('active');
      }
    }
    
    // Apply product type filter when button is clicked
    function applyProductTypeFilter(button) {
      const filterValue = button.getAttribute('data-filter-value');
      const filterParam = button.getAttribute('data-filter-param');
      
      console.log('Applying primary category filter:', filterValue, filterParam); // Debug log
      
      // Move the selected button to second position (after "All" button)
      moveFilterButtonToFront(button);
      
      // Get current URL parameters
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(url.search);
      
      // Remove any existing primary category filter parameters
      searchParams.delete('filter.p.m.custom.primary_category');
      
      // Add new primary category filter if not "all"
      if (filterValue !== 'all' && filterParam && filterValue) {
        searchParams.set('filter.p.m.custom.primary_category', filterValue);
      } else if (filterValue === 'all') {
        // Clear stored categories when going back to "All" to reset state
        const collectionHandle = window.location.pathname;
        try {
          sessionStorage.removeItem(`originalCategories_${collectionHandle}`);
        } catch (e) {
          console.warn('Could not clear stored categories:', e);
        }
      }
      
      console.log('New URL will be:', `${window.location.pathname}?${searchParams.toString()}`); // Debug log
      
      // Redirect to the new URL
      window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
    }
    
    // Initialize scroll indicators for design filters
    function initScrollIndicators() {
      const designFiltersContainer = document.querySelector('.design-filters');
      if (!designFiltersContainer) return;
      
      const buttons = designFiltersContainer.querySelectorAll('.design-filter-button');
      
      // Only show indicators if there are more than 6 buttons
      if (buttons.length <= 6) return;
      
      // Find the parent container to position chevrons relative to it
      const parentContainer = designFiltersContainer.parentElement;
      
      // Create left chevron (positioned relative to parent, not the scrolling container)
      const leftChevron = document.createElement('button');
      leftChevron.className = 'scroll-indicator scroll-indicator-left';
      leftChevron.setAttribute('aria-label', 'Scroll left');
      leftChevron.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="#373736" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      leftChevron.style.display = 'none';
      
      // Create right chevron (positioned relative to parent, not the scrolling container)
      const rightChevron = document.createElement('button');
      rightChevron.className = 'scroll-indicator scroll-indicator-right';
      rightChevron.setAttribute('aria-label', 'Scroll right');
      rightChevron.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="#373736" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      
      // Add chevrons to the parent container, not the scrolling container
      parentContainer.appendChild(leftChevron);
      parentContainer.appendChild(rightChevron);
      
      // Add scroll functionality
      setupScrollFunctionality(designFiltersContainer, leftChevron, rightChevron);
    }
    
    // Setup scroll functionality for design filters
    function setupScrollFunctionality(container, leftChevron, rightChevron) {
      const scrollAmount = 120; // Amount to scroll per click
      let scrollInterval;
      
      // Position the right chevron dynamically based on container width
      function positionRightChevron() {
        const containerRect = container.getBoundingClientRect();
        const parentRect = container.parentElement.getBoundingClientRect();
        const rightPosition = containerRect.right - parentRect.left - 28; // 28px is chevron width
        rightChevron.style.left = rightPosition + 'px';
      }
      
      // Update chevron visibility based on scroll position
      function updateChevronVisibility() {
        const isAtStart = container.scrollLeft <= 0;
        const isAtEnd = container.scrollLeft >= (container.scrollWidth - container.clientWidth - 5);
        
        leftChevron.style.display = isAtStart ? 'none' : 'flex';
        rightChevron.style.display = isAtEnd ? 'none' : 'flex';
        
        // Update right chevron position
        if (!isAtEnd) {
          positionRightChevron();
        }
      }
      
      // Smooth scroll function
      function smoothScroll(direction) {
        const targetScroll = direction === 'left' 
          ? Math.max(0, container.scrollLeft - scrollAmount)
          : Math.min(container.scrollWidth - container.clientWidth, container.scrollLeft + scrollAmount);
        
        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
      
      // Continuous scroll while holding button
      function startContinuousScroll(direction) {
        smoothScroll(direction);
        scrollInterval = setInterval(() => {
          smoothScroll(direction);
        }, 150);
      }
      
      function stopContinuousScroll() {
        if (scrollInterval) {
          clearInterval(scrollInterval);
          scrollInterval = null;
        }
      }
      
      // Left chevron event listeners
      leftChevron.addEventListener('mousedown', () => startContinuousScroll('left'));
      leftChevron.addEventListener('mouseup', stopContinuousScroll);
      leftChevron.addEventListener('mouseleave', stopContinuousScroll);
      leftChevron.addEventListener('click', (e) => {
        e.preventDefault();
        smoothScroll('left');
      });
      
      // Right chevron event listeners
      rightChevron.addEventListener('mousedown', () => startContinuousScroll('right'));
      rightChevron.addEventListener('mouseup', stopContinuousScroll);
      rightChevron.addEventListener('mouseleave', stopContinuousScroll);
      rightChevron.addEventListener('click', (e) => {
        e.preventDefault();
        smoothScroll('right');
      });
      
      // Touch support for mobile
      leftChevron.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousScroll('left');
      });
      leftChevron.addEventListener('touchend', stopContinuousScroll);
      
      rightChevron.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousScroll('right');
      });
      rightChevron.addEventListener('touchend', stopContinuousScroll);
      
      // Listen for scroll events to update chevron visibility
      container.addEventListener('scroll', updateChevronVisibility);
      
      // Initial setup
      setTimeout(() => {
        positionRightChevron();
        updateChevronVisibility();
      }, 100);
      
      // Update on window resize
      window.addEventListener('resize', () => {
        setTimeout(() => {
          positionRightChevron();
          updateChevronVisibility();
        }, 100);
      });
    }
    
    // Set active design filter based on URL parameters
    function setActiveDesignFilterFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const designFilterButtons = document.querySelectorAll('.design-filter-button');
      
      // First, remove active class from all buttons
      designFilterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Find if any design filter or primary category filter is active in URL
      let activeFilterFound = false;
      for (const [key, value] of urlParams.entries()) {
        if (isDesignFilter(key)) {
          // Find the button that matches this filter
          const matchingButton = Array.from(designFilterButtons).find(button => {
            const buttonParam = button.getAttribute('data-filter-param');
            const buttonValue = button.getAttribute('data-filter-value');
            return buttonParam === key && buttonValue === value;
          });
          
          if (matchingButton) {
            matchingButton.classList.add('active');
            // Move the active button to front position (after "All" button)
            moveFilterButtonToFront(matchingButton);
            activeFilterFound = true;
            break;
          }
        }
      }
      
      // If no design filter is active, activate the "All" button
      if (!activeFilterFound) {
        const allButton = document.querySelector('.design-filter-button[data-filter-value="all"]');
        if (allButton) {
          allButton.classList.add('active');
        }
      }
    }
    
    // Apply design filter when button is clicked
    function applyDesignFilter(button) {
      const filterValue = button.getAttribute('data-filter-value');
      const filterParam = button.getAttribute('data-filter-param');
      
      // Move the selected button to second position (after "All" button)
      moveFilterButtonToFront(button);
      
      // Get current URL parameters
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(url.search);
      
      // Remove any existing design filter parameters
      const keysToRemove = [];
      for (const [key] of searchParams.entries()) {
        if (isDesignFilter(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => searchParams.delete(key));
      
      // Add new design filter if not "all"
      if (filterValue !== 'all' && filterParam && filterValue) {
        searchParams.set(filterParam, filterValue);
      }
      
      // Redirect to the new URL
      window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
    }
    
    // Move selected filter button to second position (after "All" button)
    function moveFilterButtonToFront(selectedButton) {
      const filterValue = selectedButton.getAttribute('data-filter-value');
      
      // Don't move the "All" button - it should always stay first
      if (filterValue === 'all') {
        return;
      }
      
      const designFiltersContainer = selectedButton.parentElement;
      const allButton = designFiltersContainer.querySelector('.design-filter-button[data-filter-value="all"]');
      
      if (allButton && selectedButton !== allButton) {
        // Move the selected button right after the "All" button
        if (allButton.nextSibling) {
          designFiltersContainer.insertBefore(selectedButton, allButton.nextSibling);
        } else {
          designFiltersContainer.appendChild(selectedButton);
        }
      }
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
    
    // Initialize infinite scroll functionality
    function initInfiniteScroll() {
      const catalogueGrid = document.querySelector('[data-catalogue-grid]');
      const loadingIndicator = document.getElementById('loading-indicator');
      
      if (!catalogueGrid) return;
      
      let isLoading = false;
      let hasMorePages = true;
      let currentProductCount = 0;
      
      // Count initial products (excluding banners)
      function updateProductCount() {
        const products = catalogueGrid.querySelectorAll('.catalogue-product');
        currentProductCount = products.length;
      }
      
      // Initialize product count
      updateProductCount();
      
      // Check if there are more pages available
      function checkForMorePages() {
        const paginationInfo = document.getElementById('pagination-info');
        if (!paginationInfo) {
          hasMorePages = false;
          return null;
        }
        
        const nextUrl = paginationInfo.getAttribute('data-next-url');
        if (!nextUrl) {
          hasMorePages = false;
          return null;
        }
        
        return nextUrl;
      }
      
      // Function to load more products
      function loadMoreProducts() {
        if (isLoading || !hasMorePages) return;
        
        const nextUrl = checkForMorePages();
        if (!nextUrl) return;
        
        isLoading = true;
        
        // Show loading indicator
        if (loadingIndicator) {
          loadingIndicator.style.display = 'flex';
        }
        
        // Fetch next page
        fetch(nextUrl)
          .then(response => response.text())
          .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newProducts = doc.querySelectorAll('.catalogue-product');
            const newPaginationInfo = doc.getElementById('pagination-info');
            
            // Calculate banner positions for the new batch
            const startPosition = currentProductCount + 1;
            
            // Append new products to the grid
            newProducts.forEach((product, index) => {
              const globalPosition = startPosition + index;
              const clonedProduct = product.cloneNode(true);
              
              // Insert banners at correct positions
              if (globalPosition === 8 && !document.querySelector('.banner-1')) {
                // Insert Banner 1 if it doesn't exist and we're at position 8
                insertBannerAtPosition(8, 'banner-1');
              }
              
              if (globalPosition === 12 && !document.querySelector('.banner-2')) {
                // Insert Banner 2 if it doesn't exist and we're at position 12
                insertBannerAtPosition(12, 'banner-2');
              }
              
              catalogueGrid.appendChild(clonedProduct);
            });
            
            // Update product count
            updateProductCount();
            
            // Update pagination info
            const currentPaginationInfo = document.getElementById('pagination-info');
            if (currentPaginationInfo) {
              if (newPaginationInfo) {
                // Update with new pagination data
                const nextUrl = newPaginationInfo.getAttribute('data-next-url');
                const currentPage = newPaginationInfo.getAttribute('data-current-page');
                const totalPages = newPaginationInfo.getAttribute('data-total-pages');
                
                currentPaginationInfo.setAttribute('data-next-url', nextUrl || '');
                currentPaginationInfo.setAttribute('data-current-page', currentPage || '');
                currentPaginationInfo.setAttribute('data-total-pages', totalPages || '');
                
                // Check if this was the last page
                if (!nextUrl) {
                  hasMorePages = false;
                }
              } else {
                // No more pages
                hasMorePages = false;
                currentPaginationInfo.remove();
              }
            }
            
            // Hide loading indicator
            if (loadingIndicator) {
              loadingIndicator.style.display = 'none';
            }
            
            isLoading = false;
          })
          .catch(error => {
            console.error('Error loading more products:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
              loadingIndicator.style.display = 'none';
            }
            
            isLoading = false;
          });
      }
      
      // Function to insert banner at specific position (placeholder - would need actual banner data)
      function insertBannerAtPosition(position, bannerClass) {
        // This is a simplified version - you'd need to get actual banner data from your template
        console.log(`Would insert ${bannerClass} at position ${position}`);
      }
      
      // Scroll event listener for infinite scroll
      function handleScroll() {
        if (isLoading || !hasMorePages) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.offsetHeight;
        
        // Load more when user is within 1000px of the bottom
        if (scrollPosition >= documentHeight - 1000) {
          loadMoreProducts();
        }
      }
      
      // Throttle scroll events for better performance
      let scrollTimeout;
      window.addEventListener('scroll', function() {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        
        scrollTimeout = setTimeout(handleScroll, 100);
      });
      
      // Initial check for pagination info
      checkForMorePages();
    }
    
  });