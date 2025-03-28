// Production Shopify Cart Drawer Script
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const cartDrawer = document.getElementById('cart-drawer');
  const cartToggle = document.querySelector('.cart-drawer-trigger');
  const backdrop = document.querySelector('.cart-drawer-backdrop');
  
  // Initialize cart drawer
  initCartDrawer();
  
  function initCartDrawer() {
    // Initial cart count update
    updateCartCountBadge();
    
    // Setup event handlers
    setupCartToggle();
    setupAddToCartButtons();
    setupCartItemEvents();
  }
  
  // Setup cart toggle functionality
  function setupCartToggle() {
    // Cart toggle buttons
    const toggleButtons = document.querySelectorAll('.cart-drawer-trigger');
    toggleButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        openCartDrawer();
      });
    });
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.cart-drawer-close');
    closeButtons.forEach(button => {
      button.addEventListener('click', closeCartDrawer);
    });
    
    // Backdrop
    if (backdrop) {
      backdrop.addEventListener('click', closeCartDrawer);
    }
    
    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && cartDrawer && cartDrawer.getAttribute('aria-hidden') === 'false') {
        closeCartDrawer();
      }
    });
  }
  
  // Open cart drawer
  function openCartDrawer() {
    if (!cartDrawer) return;
    
    // Refresh cart content before opening
    refreshCartDrawer().then(() => {
      cartDrawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('drawer-open');
      
      if (backdrop) {
        backdrop.classList.add('visible');
      }
    });
  }
  
  // Close cart drawer
  function closeCartDrawer() {
    if (!cartDrawer) return;
    
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    
    if (backdrop) {
      backdrop.classList.remove('visible');
    }
  }
  
  // Setup add to cart buttons
  function setupAddToCartButtons() {
    const addButtons = document.querySelectorAll('#AddToCart, [data-add-to-cart]');
    
    addButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Get product details
        const variantId = document.getElementById('VariantId')?.value;
        const quantityInput = document.querySelector('[data-quantity-input]');
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
        
        if (!variantId) {
          console.error('No variant ID found');
          return;
        }
        
        // Add loading state
        const originalText = button.textContent;
        button.textContent = 'ADDING...';
        button.classList.add('loading');
        
        // Add to cart
        addItemToCart(variantId, quantity)
          .then(() => {
            // Update cart count
            return updateCartCountBadge();
          })
          .then(() => {
            // Reset button state
            button.textContent = originalText;
            button.classList.remove('loading');
            
            // Open cart drawer with refreshed content
            openCartDrawer();
          })
          .catch(error => {
            console.error('Error adding to cart:', error);
            button.textContent = originalText;
            button.classList.remove('loading');
          });
      });
    });
  }
  
  // Setup cart item event handling using event delegation
  function setupCartItemEvents() {
    document.addEventListener('click', function(e) {
      // Handle quantity decrease
      if (e.target.closest('.quantity-button.decrease')) {
        e.preventDefault();
        const button = e.target.closest('.quantity-button.decrease');
        const line = button.getAttribute('data-line');
        const input = button.nextElementSibling;
        
        if (line && input) {
          const newQuantity = Math.max(0, parseInt(input.value, 10) - 1);
          updateCartItemQuantity(line, newQuantity);
        }
      }
      
      // Handle quantity increase
      if (e.target.closest('.quantity-button.increase')) {
        e.preventDefault();
        const button = e.target.closest('.quantity-button.increase');
        const line = button.getAttribute('data-line');
        const input = button.previousElementSibling;
        
        if (line && input) {
          const newQuantity = parseInt(input.value, 10) + 1;
          updateCartItemQuantity(line, newQuantity);
        }
      }
      
      // Handle remove button
      if (e.target.closest('.remove-button')) {
        e.preventDefault();
        const button = e.target.closest('.remove-button');
        const line = button.getAttribute('data-line');
        
        if (line) {
          updateCartItemQuantity(line, 0);
        }
      }
    });
  }
  
  // Add item to cart
  function addItemToCart(id, quantity) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: parseInt(id, 10),
        quantity: parseInt(quantity, 10)
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Add to cart failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    });
  }
  
  // Update cart item quantity
  function updateCartItemQuantity(line, quantity) {
    // Add loading state
    document.body.classList.add('cart-loading');
    
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        line: parseInt(line, 10),
        quantity: parseInt(quantity, 10)
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Update cart failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(cart => {
      // Update cart count
      updateCartCountBadge(cart.item_count);
      
      // Refresh cart drawer content
      return refreshCartDrawer();
    })
    .catch(error => {
      console.error('Error updating cart:', error);
    })
    .finally(() => {
      document.body.classList.remove('cart-loading');
    });
  }
  
  // Refresh cart drawer content
  function refreshCartDrawer() {
    return fetch('/?section_id=cart-drawer')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Fetch cart drawer failed: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newCartDrawer = doc.getElementById('cart-drawer');
        
        if (!newCartDrawer) {
          throw new Error('New cart drawer content not found in response');
        }
        
        if (!cartDrawer) {
          throw new Error('Cart drawer element not found on page');
        }
        
        // Replace the cart drawer content
        cartDrawer.innerHTML = newCartDrawer.innerHTML;
        
        return Promise.resolve();
      })
      .catch(error => {
        console.error('Error refreshing cart drawer:', error);
        return Promise.reject(error);
      });
  }
  
  // Update cart count badge
  function updateCartCountBadge() {
    return fetch('/cart.js')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Fetch cart failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(cart => {
        const count = cart.item_count;
        const badges = document.querySelectorAll('.cart-count');
        
        badges.forEach(badge => {
          badge.textContent = count;
          badge.setAttribute('data-count', count);
          badge.style.display = count > 0 ? 'flex' : 'none';
          
          // Update accessibility
          const cartButton = badge.closest('.cart-drawer-trigger');
          if (cartButton) {
            cartButton.setAttribute('aria-label', `Cart with ${count} items`);
          }
        });
        
        return Promise.resolve(cart);
      })
      .catch(error => {
        console.error('Error updating cart badge:', error);
        return Promise.reject(error);
      });
  }
});