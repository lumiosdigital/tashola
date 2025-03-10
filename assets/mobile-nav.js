// mobile-nav.js - Complete Redesign
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
      menuToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="1" y1="1" x2="19" y2="1"></line><line x1="1" y1="6" x2="19" y2="6"></line><line x1="1" y1="11" x2="19" y2="11"></line></svg>`;
      
      // Insert at beginning of nav container
      navFlexWrapper.insertBefore(menuToggle, navFlexWrapper.firstChild);
      
      // Create mobile menu container
      const mobileMenu = document.createElement('div');
      mobileMenu.className = 'mobile-menu';
      mobileMenu.setAttribute('aria-hidden', 'true');
      
      // Create the two-column layout
      mobileMenu.innerHTML = `
        <div class="mobile-menu-inner">
          <div class="mobile-menu-left">
            <div class="mobile-menu-main-links"></div>
            <div class="mobile-menu-account"></div>
          </div>
          <div class="mobile-menu-divider"></div>
          <div class="mobile-menu-right">
            <h2 class="mobile-menu-heading">Jewelry</h2>
            <div class="mobile-menu-categories"></div>
            <h2 class="mobile-menu-heading">Collections</h2>
            <div class="mobile-menu-collections"></div>
            <h2 class="mobile-menu-heading">Personalization</h2>
            <div class="mobile-menu-personalization"></div>
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
      
      // Add the navigation links to the mobile menu
      const mainLinks = mobileMenu.querySelector('.mobile-menu-main-links');
      mainLinks.innerHTML = navLinks.innerHTML;
      
      // Add account links
      const accountLinks = mobileMenu.querySelector('.mobile-menu-account');
      const isLoggedIn = document.body.classList.contains('customer-logged-in');
      
      if (isLoggedIn) {
        accountLinks.innerHTML = `<a href="/account" class="mobile-account-link">YOUR PROFILE</a>`;
      } else {
        accountLinks.innerHTML = `
          <a href="/account/login" class="mobile-account-link">LOGIN</a>
          <a href="/account/register" class="mobile-account-link">REGISTER</a>
        `;
      }
      
      // Fetch categories and collections
      // These are hardcoded here, but could be pulled dynamically from Shopify collections
      const categories = mobileMenu.querySelector('.mobile-menu-categories');
      categories.innerHTML = `
        <a href="/collections/new-in" class="mobile-menu-link">New In</a>
        <a href="/collections/earrings" class="mobile-menu-link">Earrings</a>
        <a href="/collections/rings" class="mobile-menu-link">Rings</a>
        <a href="/collections/necklaces" class="mobile-menu-link">Necklaces</a>
        <a href="/collections/bracelets" class="mobile-menu-link">Bracelets</a>
        <a href="/collections/charms" class="mobile-menu-link">Charms</a>
      `;
      
      const collections = mobileMenu.querySelector('.mobile-menu-collections');
      collections.innerHTML = `
        <a href="/collections/stellar" class="mobile-menu-link">Stellar Collection</a>
        <a href="/collections/neptune" class="mobile-menu-link">Neptune Collection</a>
        <a href="/collections/celestial" class="mobile-menu-link">Celestial Collection</a>
        <a href="/collections/spartan" class="mobile-menu-link">Spartan Collection</a>
        <a href="/collections/deia" class="mobile-menu-link">Deia Collection</a>
        <a href="/collections/aurelia" class="mobile-menu-link">Aurelia Collection</a>
        <a href="/collections/iris" class="mobile-menu-link">Iris collection</a>
        <a href="/collections/charmed" class="mobile-menu-link">Charmed collection</a>
      `;
      
      const personalization = mobileMenu.querySelector('.mobile-menu-personalization');
      personalization.innerHTML = `
        <a href="/collections/zodiac" class="mobile-menu-link">Zodiac</a>
        <a href="/collections/birth-stones" class="mobile-menu-link">Birth Stones</a>
      `;
      
      // Add to body
      document.body.appendChild(mobileMenu);
      document.body.insertBefore(closeButton, document.body.firstChild);
      
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
      searchButton.style.width = '16px';
      searchButton.style.height = '16px';
    }
    
    if (cartButton) {
      cartButton.style.width = '16px';
      cartButton.style.height = '16px';
    }
    
    // Resize SVG elements
    if (searchIcon) {
      searchIcon.setAttribute('width', '16');
      searchIcon.setAttribute('height', '16');
    }
    
    if (cartIcon) {
      cartIcon.setAttribute('width', '16');
      cartIcon.setAttribute('height', '16');
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

// Call on load
updateIconSizes();

// Call on window resize
window.addEventListener('resize', updateIconSizes);
});