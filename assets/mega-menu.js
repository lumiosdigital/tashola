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
    // Get the mega menu item name from the global settings
    const megaMenuItem = window.megaMenuSettings?.menuItem || 'Catalog';
    
    // Find the navigation container with the specified menu item
    const megaMenuContainer = Array.from(document.querySelectorAll('.nav-link-container')).find(container => {
      const link = container.querySelector('.navbar-links');
      return link && link.textContent.trim() === megaMenuItem;
    });
    
    if (!megaMenuContainer) {
      console.warn(`Mega menu: Could not find navigation item "${megaMenuItem}". Please check that the "Mega Menu Navigation Item" setting matches your navigation menu exactly.`);
      return;
    }
    
    const megaMenu = megaMenuContainer.querySelector('.mega-menu-wrapper');
    if (!megaMenu) {
      console.warn(`Mega menu: Found navigation item "${megaMenuItem}" but no mega-menu-wrapper found.`);
      return;
    }
    
    // Let's ensure the mega menu is setup correctly
    let timeout;
    
    megaMenuContainer.addEventListener('mouseenter', function() {
      clearTimeout(timeout);
      megaMenu.classList.add('active');
    });
    
    megaMenuContainer.addEventListener('mouseleave', function() {
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
    const megaMenuLink = megaMenuContainer.querySelector('.navbar-links');
    
    // Prevent the mega menu link from navigating when clicked
    megaMenuLink.addEventListener('click', function(e) {
      e.preventDefault();
    });
    
    megaMenuLink.addEventListener('focus', function() {
      megaMenu.classList.add('active');
    });
    
    // Handle focus out events
    megaMenuContainer.addEventListener('focusout', function(e) {
      // Check if the new focus target is still within this container
      if (!megaMenuContainer.contains(e.relatedTarget)) {
        megaMenu.classList.remove('active');
      }
    });
    
    // Close mega menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!megaMenuContainer.contains(e.target)) {
        megaMenu.classList.remove('active');
      }
    });
    
    // Allow the mega menu to be dismissed with escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && megaMenu.classList.contains('active')) {
        megaMenu.classList.remove('active');
        megaMenuLink.focus();
      }
    });
  }
});