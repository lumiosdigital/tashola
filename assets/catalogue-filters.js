// catalogue-filters.js - Catalogue page functionality
document.addEventListener('DOMContentLoaded', function() {
  initCatalogueFilters();
  initInfiniteScroll();
  
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
    
    // Handle filter form submission
    if (filterForm) {
      filterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(filterForm);
        const searchParams = new URLSearchParams();
        
        // Build filter parameters
        for (const [key, value] of formData.entries()) {
          if (value) {
            searchParams.append(key, value);
          }
        }
        
        // Redirect to filtered catalogue URL
        window.location.href = `${window.location.pathname}?${searchParams.toString()}`;
      });
      
      // Handle filter form reset
      filterForm.addEventListener('reset', function() {
        // Wait for form to reset
        setTimeout(() => {
          // Redirect to base catalogue URL
          window.location.href = window.location.pathname;
        }, 0);
      });
    }
  }
  
  // Initialize infinite scroll functionality
  function initInfiniteScroll() {
    const catalogueGrid = document.querySelector('[data-catalogue-grid]');
    const loadMoreButton = document.querySelector('[data-load-more-button]');
    
    if (!catalogueGrid || !loadMoreButton) return;
    
    let currentPage = 1;
    let isLoading = false;
    
    // Handle load more button click
    loadMoreButton.addEventListener('click', function() {
      if (isLoading) return;
      
      isLoading = true;
      currentPage++;
      
      // Show loading state
      loadMoreButton.textContent = 'Loading...';
      
      // Build URL for next page
      const url = new URL(window.location.href);
      url.searchParams.set('page', currentPage);
      
      // Fetch next page products
      fetch(url)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newProducts = doc.querySelectorAll('.catalogue-product');
          
          // Append new products to the grid
          newProducts.forEach(product => {
            // Check if we need to insert a banner after specific products
            const productIndex = Array.from(catalogueGrid.children).length + 1;
            
            // Banner placements - add banners at specific positions
            if (productIndex === 8) {
              // Catalogue Banner 1 - 4th column, 2nd row
              insertCatalogueBanner(1);
            } else if (productIndex === 12) {
              // Catalogue Banner 2 - 1st column, 4th row
              insertCatalogueBanner(2);
            }
            
            catalogueGrid.appendChild(product.cloneNode(true));
          });
          
          // Check if there are more pages
          const nextPageLink = doc.querySelector('.pagination-next');
          if (!nextPageLink || nextPageLink.classList.contains('disabled')) {
            loadMoreButton.style.display = 'none';
          } else {
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
    
    // Function to insert catalogue banners
    function insertCatalogueBanner(bannerNumber) {
      const bannerTemplate = document.createElement('template');
      
      if (bannerNumber === 1) {
        bannerTemplate.innerHTML = `
          <li class="catalogue-banner banner-1">
            <a href="${document.querySelector('.banner-1 a')?.getAttribute('href') || '#'}" class="catalogue-banner-link">
              <div class="catalogue-banner-image-wrapper">
                <img src="${document.querySelector('.banner-1 img')?.getAttribute('src') || ''}" alt="Catalogue Banner 1" class="catalogue-banner-image">
              </div>
              <div class="catalogue-banner-content">
                <h3 class="catalogue-banner-title">${document.querySelector('.banner-1 .catalogue-banner-title')?.innerHTML || 'Collection'}</h3>
                <p class="catalogue-banner-text">${document.querySelector('.banner-1 .catalogue-banner-text')?.textContent || ''}</p>
              </div>
            </a>
          </li>
        `;
      } else {
        bannerTemplate.innerHTML = `
          <li class="catalogue-banner banner-2">
            <a href="${document.querySelector('.banner-2 a')?.getAttribute('href') || '#'}" class="catalogue-banner-link">
              <div class="catalogue-banner-image-wrapper">
                <img src="${document.querySelector('.banner-2 img')?.getAttribute('src') || ''}" alt="Catalogue Banner 2" class="catalogue-banner-image">
              </div>
              <div class="catalogue-banner-content">
                <h3 class="catalogue-banner-title">${document.querySelector('.banner-2 .catalogue-banner-title')?.innerHTML || 'Collection'}</h3>
                <p class="catalogue-banner-text">${document.querySelector('.banner-2 .catalogue-banner-text')?.textContent || ''}</p>
              </div>
            </a>
          </li>
        `;
      }
      
      // Only insert if template content is valid
      if (bannerTemplate.content.firstElementChild) {
        catalogueGrid.appendChild(bannerTemplate.content.firstElementChild);
      }
    }
  }
});