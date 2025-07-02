document.addEventListener("DOMContentLoaded", function() {
  // Create mobile menu toggle button if it doesn't exist
  if (!document.querySelector('.mobile-menu-toggle')) {
    const navFlexWrapper = document.querySelector('.nav-flex-wrapper');
    const navLinks = document.querySelector('nav');
    
    if (navFlexWrapper && navLinks) {
      // Create mobile menu toggle with hamburger icon
      const menuToggle = document.createElement('button');
      menuToggle.className = 'mobile-menu-toggle';
      menuToggle.setAttribute('aria-label', 'Toggle mobile menu');
      menuToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="1" y1="1" x2="19" y2="1"></line><line x1="1" y1="6" x2="19" y2="6"></line><line x1="1" y1="11" x2="19" y2="11"></line></svg>`;
      
      // Insert at beginning of nav container
      navFlexWrapper.insertBefore(menuToggle, navFlexWrapper.firstChild);
      
      // Create mobile menu container
      const mobileMenu = document.createElement('div');
      mobileMenu.className = 'mobile-menu';
      mobileMenu.setAttribute('aria-hidden', 'true');
      
      // Create the two-column layout structure
      mobileMenu.innerHTML = `
        <div class="mobile-menu-inner">
          <div class="mobile-menu-left">
            <div class="mobile-menu-main-links"></div>
            <div class="mobile-menu-account"></div>
          </div>
          <div class="mobile-menu-divider"></div>
          <div class="mobile-menu-right">
            <div id="mobile-menu-smart-collections">
              <h2 class="mobile-menu-heading">Jewelry</h2>
              <div class="mobile-menu-categories"></div>
            </div>
            <div id="mobile-menu-manual-collections">
              <h2 class="mobile-menu-heading">Collections</h2>
              <div class="mobile-menu-collections"></div>
            </div>
            <div id="mobile-menu-personalization">
              <h2 class="mobile-menu-heading">Personalization</h2>
              <div class="mobile-menu-personalization"></div>
            </div>
          </div>
        </div>
      `;
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.className = 'mobile-menu-close';
      closeButton.setAttribute('aria-label', 'Close menu');
      closeButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="#373736" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="#373736" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      
      // Add navigation links to mobile menu, excluding the first item (which has the mega menu)
      const mainLinks = mobileMenu.querySelector('.mobile-menu-main-links');
      
      // Get all navigation link containers, excluding the first one
      const allNavContainers = navLinks.querySelectorAll('.nav-link-container');
      let filteredLinksHtml = '';
      
      allNavContainers.forEach((container, index) => {
        // Exclude the first navigation item (index 0) since it has the mega menu
        if (index > 0) {
          const link = container.querySelector('.navbar-links');
          if (link) {
            filteredLinksHtml += link.outerHTML;
          }
        }
      });
      
      mainLinks.innerHTML = filteredLinksHtml;
      
      // Add account links
      const accountLinks = mobileMenu.querySelector('.mobile-menu-account');
      const isLoggedIn = document.body.classList.contains('customer-logged-in');
            
      if (isLoggedIn) {
        accountLinks.innerHTML = `
          <a href="/account" class="mobile-account-link">MY PROFILE</a>
          <a href="#swym-wishlist" class="mobile-account-link swym-wishlist">MY FAVOURITES</a>
          <a href="/account/logout" class="mobile-account-link">LOGOUT</a>
        `;
      } else {
        accountLinks.innerHTML = `
          <a href="/account/login" class="mobile-account-link">LOGIN</a>
          <a href="/account/register" class="mobile-account-link">REGISTER</a>
        `;
      }
      
      // Add to body
      document.body.appendChild(mobileMenu);
      document.body.insertBefore(closeButton, document.body.firstChild);
      
      // Get collections from the hidden data element
      const collectionsData = document.getElementById('collection-data');
      if (collectionsData) {
        // Populate smart collections (Jewelry)
        const smartCollectionsContainer = mobileMenu.querySelector('.mobile-menu-categories');
        const smartCollectionsData = collectionsData.querySelector('#smart-collections-data');
        if (smartCollectionsData) {
          smartCollectionsContainer.innerHTML = smartCollectionsData.innerHTML;
        }
        
        // Populate manual collections
        const manualCollectionsContainer = mobileMenu.querySelector('.mobile-menu-collections');
        const manualCollectionsData = collectionsData.querySelector('#manual-collections-data');
        if (manualCollectionsData) {
          manualCollectionsContainer.innerHTML = manualCollectionsData.innerHTML;
        }
        
        // Populate personalization section from existing data or generate it
        const personalizationContainer = mobileMenu.querySelector('.mobile-menu-personalization');
        const personalizationData = collectionsData.querySelector('#personalization-data');
        if (personalizationData) {
          personalizationContainer.innerHTML = personalizationData.innerHTML;
        } else {
          // Since we can't access Liquid data from JS, we need to create a data element
          // For now, hide the personalization section if no data is available
          document.getElementById('mobile-menu-personalization').style.display = 'none';
        }
      } else {
        // Fallback content if data element not found
        const categoriesContainer = mobileMenu.querySelector('.mobile-menu-categories');
        const collectionsContainer = mobileMenu.querySelector('.mobile-menu-collections');
        const personalizationContainer = mobileMenu.querySelector('.mobile-menu-personalization');
        
        categoriesContainer.innerHTML = `
          <a href="/collections/all" class="mobile-menu-link">All Products</a>
        `;
        
        collectionsContainer.innerHTML = `
          <a href="/collections" class="mobile-menu-link">View All Collections</a>
        `;
        
        // Hide personalization section if no data available
        document.getElementById('mobile-menu-personalization').style.display = 'none';
      }
      
      // Toggle mobile menu
      menuToggle.addEventListener('click', function(event) {
        event.stopPropagation();
        document.body.classList.add('mobile-menu-active');
        mobileMenu.classList.add('active');
        menuToggle.style.display = 'none'; // Hide hamburger icon
        closeButton.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        menuToggle.setAttribute('aria-expanded', 'true');
      });
          
      // Close button functionality
      closeButton.addEventListener('click', function() {
        document.body.classList.remove('mobile-menu-active');
        mobileMenu.classList.remove('active');
        closeButton.classList.remove('active');
        menuToggle.style.display = 'block'; // Show hamburger icon again
        mobileMenu.setAttribute('aria-hidden', 'true');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    }
  }
  
  // Update icon sizes on mobile
  function updateIconSizes() {
    const searchButton = document.querySelector('.search-button');
    const cartButton = document.querySelector('.nav-icons a[href*="cart"]');
    const searchIcon = searchButton ? searchButton.querySelector('svg') : null;
    const cartIcon = cartButton ? cartButton.querySelector('svg') : null;
    
    if (window.innerWidth <= 768) {
      // Resize container elements
      if (searchButton) {
        searchButton.style.width = '24px';
        searchButton.style.height = '24px';
      }
      
      if (cartButton) {
        cartButton.style.width = '24px';
        cartButton.style.height = '24px';
      }
      
      // Resize SVG elements
      if (searchIcon) {
        searchIcon.setAttribute('width', '24');
        searchIcon.setAttribute('height', '24');
      }
      
      if (cartIcon) {
        cartIcon.setAttribute('width', '24');
        cartIcon.setAttribute('height', '24');
      }
    } else {
      // Reset container sizes for desktop
      if (searchButton) {
        searchButton.style.width = '';
        searchButton.style.height = '';
      }
      
      if (cartButton) {
        cartButton.style.width = '';
        cartButton.style.height = '';
      }
      
      // Reset SVG sizes for desktop
      if (searchIcon) {
        searchIcon.setAttribute('width', '24');
        searchIcon.setAttribute('height', '24');
      }
      
      if (cartIcon) {
        cartIcon.setAttribute('width', '24');
        cartIcon.setAttribute('height', '24');
      }
    }
  }
  
  // Improved window resize handling
  function checkWindowSize() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const closeButton = document.querySelector('.mobile-menu-close');
    
    if (window.innerWidth > 768) {
      // Desktop view
      if (mobileMenu) {
        mobileMenu.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
      
      if (menuToggle) {
        menuToggle.style.display = 'none'; // Hide on desktop completely
        menuToggle.setAttribute('aria-expanded', 'false');
      }
      
      if (closeButton) {
        closeButton.classList.remove('active');
      }
      
      // Always remove the mobile-menu-active class on desktop
      document.body.classList.remove('mobile-menu-active');
    } else {
      // Mobile view - always show the hamburger menu
      if (menuToggle) {
        menuToggle.style.display = 'block';
      }
    }
    
    // Call updateIconSizes to ensure icons are sized correctly
    updateIconSizes();
  }

  // Call on page load to ensure proper initial state
  checkWindowSize();
  
  // Call on window resize
  window.addEventListener('resize', checkWindowSize);
});