document.addEventListener("DOMContentLoaded", function() {
  // Only initialize on desktop
  if (window.innerWidth > 768) {
    initMegaMenu();
  }
  
  // Re-initialize on window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      initMegaMenu();
    }
  });
  
  function initMegaMenu() {
    // Find the Catalog link specifically
    const catalogContainer = Array.from(document.querySelectorAll('.nav-link-container')).find(container => {
      const link = container.querySelector('.navbar-links');
      return link && link.textContent.trim() === 'Catalog';
    });
    
    if (!catalogContainer) return;
    
    const megaMenu = catalogContainer.querySelector('.mega-menu-wrapper');
    if (!megaMenu) return;
    
    // Let's ensure the mega menu is setup correctly
    let timeout;
    
    catalogContainer.addEventListener('mouseenter', function() {
      clearTimeout(timeout);
      megaMenu.classList.add('active');
    });
    
    catalogContainer.addEventListener('mouseleave', function() {
      timeout = setTimeout(function() {
        megaMenu.classList.remove('active');
      }, 200);
    });
    
    // Keep menu open when mouse enters the mega menu
    megaMenu.addEventListener('mouseenter', function() {
      clearTimeout(timeout);
    });
    
    // Set a delay when leaving the mega menu
    megaMenu.addEventListener('mouseleave', function() {
      timeout = setTimeout(function() {
        megaMenu.classList.remove('active');
      }, 200);
    });
    
    // Add accessibility for keyboard navigation
    const catalogLink = catalogContainer.querySelector('.navbar-links');
    
    // Prevent the Catalog link from navigating when clicked
    catalogLink.addEventListener('click', function(e) {
      e.preventDefault();
    });
    
    catalogLink.addEventListener('focus', function() {
      megaMenu.classList.add('active');
    });
    
    // Handle focus out events
    catalogContainer.addEventListener('focusout', function(e) {
      // Check if the new focus target is still within this container
      if (!catalogContainer.contains(e.relatedTarget)) {
        megaMenu.classList.remove('active');
      }
    });
    
    // Close mega menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!catalogContainer.contains(e.target)) {
        megaMenu.classList.remove('active');
      }
    });
    
    // Allow the mega menu to be dismissed with escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && megaMenu.classList.contains('active')) {
        megaMenu.classList.remove('active');
        catalogLink.focus();
      }
    });
  }
});