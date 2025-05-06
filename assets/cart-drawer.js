// Modified Cart Script with Swym Wishlist Plus Integration
document.addEventListener('DOMContentLoaded', function() {
  // Debug mode
  const DEBUG = true;
  
  // Log helper
  function log(...args) {
    if (DEBUG) console.log('Cart Drawer:', ...args);
  }
  
  log('Script loaded');
  
  // IMPORTANT: Set this to match your section file name (without .liquid)
  const CART_SECTION_ID = 'cart-drawer-section';
  
  // Track add to cart buttons to prevent double binding
  const boundButtons = new Set();
  
  // Main cart drawer element
  const cartDrawer = document.getElementById('cart-drawer') || 
                     document.querySelector('.cart-drawer');
  
  // Backdrop element - get a reference but don't modify it
  const getBackdrop = () => document.querySelector('.cart-drawer-backdrop');
  
  if (!cartDrawer) {
    console.error('Cart drawer element not found');
    return;
  }
  
  // Initialize
  initCartDrawer();
  
  function initCartDrawer() {
    log('Initializing cart drawer');
    
    // Update cart count on page load
    updateCartCount();
    
    // Set up Add to Cart buttons
    setupAddToCartButtons();
    
    // Set up cart toggle functionality
    setupCartToggle();
    
    // Set up cart item controls using event delegation
    document.addEventListener('click', handleCartItemEvents);
    
    // Initialize product page quantity selectors
    initProductQuantitySelectors();
    
    // Set up Swym event listeners
    setupSwymEventListeners();
  }
  
  // Set up Swym event listeners to detect wishlist actions
  function setupSwymEventListeners() {
    log('Setting up Swym event listeners');
    
    // Check if Swym is available
    if (typeof window.SwymCallbacks === 'undefined') {
      // If SwymCallbacks doesn't exist, create it
      window.SwymCallbacks = [];
    }
    
    // Listen for Swym initialization
    window.SwymCallbacks.push(function(swat) {
      log('Swym initialized, setting up event listeners');
      
      // Listen for "added to cart" events from Swym
      swat.evtLayer.addEventListener(swat.JSEvents.addedToCart, function(e) {
        log('Swym addedToCart event detected', e);
        
        // Refresh cart and open it
        refreshCart()
          .then(() => {
            // Update cart count
            return fetch('/cart.js')
              .then(response => response.json())
              .then(cart => {
                updateCartCount(cart.item_count);
                openCart();
              });
          })
          .catch(error => {
            console.error('Error handling Swym addedToCart event:', error);
            
            // Try to open cart anyway
            openCart();
          });
      });
      
      // Add other Swym event listeners if needed
      // e.g., moved to wishlist, etc.
    });
    
    // Also intercept the Swym continue shopping button as a fallback
    // This is for older Swym versions or if the events aren't firing
    interceptSwymButton();
  }
  
  // Complete replacement of Swym cart buttons with duplication prevention
  function interceptSwymButton() {
    // Flag to track if we've already processed buttons in this session
    let hasProcessedInitialButtons = false;
    
    // Function to handle all cart buttons
    function processAllButtons() {
      const buttons = document.querySelectorAll('.swym-sfl-cart-btn.swym-bg-2');
      log(`Found ${buttons.length} Swym cart buttons`);
      
      // If multiple buttons exist, hide all but the first one
      if (buttons.length > 1) {
        log('Multiple buttons detected - hiding duplicates');
        for (let i = 1; i < buttons.length; i++) {
          buttons[i].style.display = 'none';
        }
      }
      
      // Process the visible button (first one)
      if (buttons.length > 0) {
        const primaryButton = buttons[0];
        
        // Only process if not already processed
        if (!primaryButton.hasAttribute('data-cart-intercept')) {
          log('Processing primary Swym cart button');
          
          // Mark as processed
          primaryButton.setAttribute('data-cart-intercept', 'true');
          
          // Force text to uppercase using CSS
          primaryButton.style.textTransform = 'uppercase';
          
          // Remove any href that might cause navigation
          if (primaryButton.hasAttribute('href')) {
            primaryButton.removeAttribute('href');
          }
          
          // Remove any onclick handler
          primaryButton.onclick = null;
          
          // Add our own click handler
          primaryButton.addEventListener('click', function(e) {
            // Stop any default behavior or event propagation
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            log('Swym cart button clicked - opening cart drawer');
            openCart();
            
            return false;
          }, true); // Use capture phase to ensure our handler runs first
          
          log('Swym button behavior overridden and styled uppercase');
        }
      }
    }
    
    // Process buttons immediately
    processAllButtons();
    hasProcessedInitialButtons = true;
    
    // Set up mutation observer to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      // Process all buttons again when DOM changes
      processAllButtons();
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Global event handler for any Swym button clicks
    document.addEventListener('click', function(e) {
      // Check if the click target is or is inside a Swym cart button
      let target = e.target;
      
      while (target && target !== document) {
        if (target.classList && 
            target.classList.contains('swym-sfl-cart-btn') && 
            target.classList.contains('swym-bg-2')) {
          
          // Prevent any navigation
          e.preventDefault();
          e.stopPropagation();
          
          log('Global handler: Intercepted click on Swym cart button');
          openCart();
          
          return false;
        }
        target = target.parentNode;
      }
    }, true); // Use capture phase
    
    // Return a function that can be called to manually process buttons
    return processAllButtons;
  }
  
  // Store the function so we can call it when needed
  const refreshSwymButtons = interceptSwymButton();
  
  // Listen for specific Swym events
  if (typeof window.SwymCallbacks !== 'undefined') {
    window.SwymCallbacks.push(function(swat) {
      if (swat.evtLayer) {
        // Listen for various Swym events
        const events = [
          "swym:tab-change",
          "swym:modal-open", 
          "swym:wishlist-loaded",
          "swym:before-open",
          "swym:load"
        ];
        
        events.forEach(event => {
          swat.evtLayer.addEventListener(event, function() {
            log(`Swym event ${event} - refreshing buttons`);
            setTimeout(refreshSwymButtons, 100);
          });
        });
      }
    });
  }
  
  // Add a periodic checker to make sure buttons are always processed
  // This is a fallback in case mutation observer or events miss something
  setInterval(refreshSwymButtons, 1000);
  
  // FIXED: Re-implement product quantity selectors
  function initProductQuantitySelectors() {
    const minusBtn = document.querySelector('[data-quantity-minus]');
    const plusBtn = document.querySelector('[data-quantity-plus]');
    const quantityInput = document.querySelector('[data-quantity-input]');
    
    if (minusBtn && plusBtn && quantityInput) {
      log('Setting up product quantity selectors');
      
      // Remove existing listeners first
      const newMinusBtn = minusBtn.cloneNode(true);
      const newPlusBtn = plusBtn.cloneNode(true);
      
      minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
      plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);
      
      // Set up new event listeners
      newMinusBtn.addEventListener('click', function() {
        let value = parseInt(quantityInput.value, 10);
        if (value > 1) {
          quantityInput.value = value - 1;
        }
      });
      
      newPlusBtn.addEventListener('click', function() {
        let value = parseInt(quantityInput.value, 10);
        quantityInput.value = value + 1;
      });
    }
  }
  
  // Set up Add to Cart buttons
  function setupAddToCartButtons() {
    // Find all add to cart buttons
    const addButtons = document.querySelectorAll('#AddToCart, [data-add-to-cart], button[name="add"]');
    
    log(`Found ${addButtons.length} add to cart buttons`);
    
    // Add click event to each button (only if not already bound)
    addButtons.forEach(button => {
      // Skip if already bound
      if (boundButtons.has(button)) {
        return;
      }
      
      // Mark as bound
      boundButtons.add(button);
      
      // Clone the button to remove any existing handlers
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Add our handler
      newButton.addEventListener('click', handleAddToCart);
      boundButtons.add(newButton); // Track the new button
    });
  }
  
  // Handle Add to Cart button click
  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const button = e.currentTarget;
    
    // If already processing, don't submit again
    if (button.hasAttribute('data-processing')) {
      log('Button already processing, ignoring click');
      return;
    }
    
    log('Add to cart button clicked');
    
    // Store original button content
    const originalContent = button.innerHTML;
    
    // Update button to loading state
    button.setAttribute('data-processing', 'true');
    button.innerHTML = 'Adding...';
    button.classList.add('loading');
    button.disabled = true;
    
    // Find the form
    const form = button.closest('form[action*="/cart/add"]');
    if (!form) {
      console.error('Add to cart button not in a form with action="/cart/add"');
      resetButton(button, originalContent);
      return;
    }
    
    // Get variant ID
    let variantId;
    const variantInput = form.querySelector('input[name="id"]');
    const variantSelect = form.querySelector('select[name="id"]');
    
    if (variantInput) {
      variantId = variantInput.value;
    } else if (variantSelect) {
      variantId = variantSelect.value;
    } else {
      console.error('Could not find variant ID input');
      resetButton(button, originalContent);
      return;
    }
    
    // Get quantity
    let quantity = 1;
    const quantityInput = form.querySelector('input[name="quantity"]');
    if (quantityInput) {
      quantity = parseInt(quantityInput.value, 10) || 1;
    }
    
    log(`Adding to cart: variant ${variantId}, quantity ${quantity}`);
    
    // Use promise pattern with finally for reliable button reset
    const addToCartPromise = addToCart(variantId, quantity)
      .then(item => {
        log('Successfully added to cart:', item);
        
        // Update cart count
        return fetch('/cart.js')
          .then(response => response.json())
          .then(cart => {
            updateCartCount(cart.item_count);
            
            // Refresh cart and open it
            return refreshCart()
              .then(() => {
                openCart();
              })
              .catch(error => {
                console.error('Error refreshing cart:', error);
                openCart();
              });
          });
      })
      .catch(error => {
        console.error('Error adding to cart:', error);
        alert('There was an error adding this item to your cart. Please try again.');
      })
      .finally(() => {
        // Always reset button state
        resetButton(button, originalContent);
      });
  }
  
  // Helper function to reset button state
  function resetButton(button, originalContent) {
    if (!button) return;
    
    log('Resetting button state');
    button.innerHTML = originalContent;
    button.classList.remove('loading');
    button.disabled = false;
    button.removeAttribute('data-processing');
  }
  
  // Set up cart toggle functionality
  function setupCartToggle() {
    // Open cart buttons
    const toggleButtons = document.querySelectorAll('.cart-drawer-trigger, .cart-icon');
    toggleButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        openCart();
      });
    });
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.cart-drawer-close, .cart-close, .drawer-close');
    log(`Found ${closeButtons.length} close buttons`);
    
    closeButtons.forEach(button => {
      // Clone to remove existing listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Add click event
      newButton.addEventListener('click', function(e) {
        e.preventDefault();
        log('Close button clicked');
        closeCart();
      });
    });
    
    // FIXED: Do not clone backdrop, just add event listener directly
    const backdrop = getBackdrop();
    if (backdrop) {
      log('Setting up backdrop click handler');
      
      // Remove existing click event handlers by using once option
      backdrop.addEventListener('click', function backdropHandler(e) {
        backdrop.removeEventListener('click', backdropHandler);
        setupBackdropHandler();
      }, { once: true });
      
      setupBackdropHandler();
    }
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeCart();
      }
    });
  }
  
  // FIXED: Setup backdrop handler separately
  function setupBackdropHandler() {
    const backdrop = getBackdrop();
    if (!backdrop) return;
    
    backdrop.addEventListener('click', function(e) {
      log('Backdrop clicked');
      closeCart();
    });
  }
  
  // Handle cart item events (increase, decrease, remove)
  function handleCartItemEvents(e) {
    // Quantity decrease button
    if (e.target.closest('.quantity-button.decrease')) {
      e.preventDefault();
      const button = e.target.closest('.quantity-button.decrease');
      const line = button.getAttribute('data-line');
      const input = button.nextElementSibling;
      
      if (!line || !input) return;
      
      const currentQty = parseInt(input.value, 10);
      const newQty = Math.max(0, currentQty - 1);
      
      // Immediate UI feedback
      if (newQty !== currentQty) {
        input.value = newQty;
        updateCartItemQuantity(line, newQty);
      }
    }
    
    // Quantity increase button
    if (e.target.closest('.quantity-button.increase')) {
      e.preventDefault();
      const button = e.target.closest('.quantity-button.increase');
      const line = button.getAttribute('data-line');
      const input = button.previousElementSibling;
      
      if (!line || !input) return;
      
      const currentQty = parseInt(input.value, 10);
      const newQty = currentQty + 1;
      
      // Immediate UI feedback
      input.value = newQty;
      updateCartItemQuantity(line, newQty);
    }
    
    // Remove button
    if (e.target.closest('.remove-button')) {
      e.preventDefault();
      const button = e.target.closest('.remove-button');
      const line = button.getAttribute('data-line');
      
      if (!line) return;
      
      // Immediate UI feedback - hide the item
      const cartItem = button.closest('.cart-item');
      if (cartItem) {
        cartItem.style.opacity = '0.5';
      }
      
      updateCartItemQuantity(line, 0);
    }
    
    // Save for later (Move to Wishlist) button
    if (e.target.closest('.move-to-wishlist-button')) {
      e.preventDefault();
      const button = e.target.closest('.move-to-wishlist-button');
      const productId = button.getAttribute('data-product-id');
      const variantId = button.getAttribute('data-variant-id');
      const line = button.getAttribute('data-line');
      
      if (!productId || !variantId || !line) return;
      
      // Check if Swym is loaded and ready
      if (window.SwymWatchProducts && window.SwymWatchProducts.addToWishList) {
        log('Moving item to wishlist:', productId, variantId);
        
        // Add to wishlist first, then remove from cart
        window.SwymWatchProducts.addToWishList(
          productId, 
          variantId, 
          null, // collection
          function() {
            // Success callback - now remove from cart
            log('Added to wishlist successfully, removing from cart');
            updateCartItemQuantity(line, 0);
          }
        );
      } else {
        log('Swym not ready, attempting to use generic wishlist functionality');
        
        // If Swym API not available, try with event
        if (window._swat && window._swat.addToWishList) {
          window._swat.addToWishList(
            {
              "epi": variantId,
              "empi": productId
            },
            function() {
              // Success callback
              log('Added to wishlist with _swat API, removing from cart');
              updateCartItemQuantity(line, 0);
            }
          );
        } else {
          // Fallback: just remove from cart
          alert('Could not add to wishlist. Item will be removed from cart.');
          updateCartItemQuantity(line, 0);
        }
      }
    }
  }
  
  // Add item to cart
  function addToCart(id, quantity) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        id: parseInt(id, 10),
        quantity: parseInt(quantity, 10)
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Add to cart failed: ${response.status}`);
      }
      return response.json();
    });
  }
  
  // Update cart item quantity
  function updateCartItemQuantity(line, quantity) {
    // Add loading state to cart
    document.body.classList.add('cart-loading');
    
    // Update UI values immediately for faster feedback
    updateCartUIValues(line, quantity);
    
    // Send request to Shopify
    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        line: parseInt(line, 10),
        quantity: parseInt(quantity, 10)
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Update cart failed: ${response.status}`);
      }
      return response.json();
    })
    .then(cart => {
      // Update cart count
      updateCartCount(cart.item_count);
      
      // Update subtotal
      updateCartSubtotal(cart.total_price);
      
      // Only do full refresh if item was removed (quantity = 0)
      if (quantity === 0) {
        return refreshCart();
      }
      
      return Promise.resolve();
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      // Do a full refresh to ensure consistent state
      return refreshCart();
    })
    .finally(() => {
      document.body.classList.remove('cart-loading');
    });
  }
  
  // Update UI values immediately for faster response
  function updateCartUIValues(line, quantity) {
    // If quantity is 0 (remove), we already handled it with opacity change
    if (quantity === 0) return;
    
    // Update the item price based on new quantity
    const cartItem = document.querySelector(`.cart-item [data-line="${line}"]`)?.closest('.cart-item');
    if (!cartItem) return;
    
    // Get price per item
    const priceElement = cartItem.querySelector('.cart-item-price');
    if (!priceElement) return;
    
    const priceText = priceElement.textContent;
    const currencySymbol = priceText.replace(/[\d\s,.]/g, '')[0]; // Extract currency symbol
    const priceValue = extractPrice(priceText);
    
    if (priceValue) {
      const currentQty = parseInt(cartItem.querySelector('input')?.value, 10) || 1;
      const singleItemPrice = priceValue / currentQty;
      const newPrice = singleItemPrice * quantity;
      priceElement.textContent = formatMoney(newPrice, currencySymbol);
    }
  }
  
  // Extract price value from price text
  function extractPrice(priceText) {
    const matches = priceText.match(/[\d,.]+/);
    if (matches) {
      return parseFloat(matches[0].replace(/,/g, ''));
    }
    return null;
  }
  
  // Update cart subtotal
  function updateCartSubtotal(totalCents) {
    const subtotalElements = document.querySelectorAll('.cart-subtotal-price');
    subtotalElements.forEach(element => {
      const currencySymbol = element.textContent.replace(/[\d\s,.]/g, '')[0]; // Extract currency symbol
      element.textContent = formatMoney(totalCents / 100, currencySymbol);
    });
  }
  
  // Format money with currency symbol
  function formatMoney(amount, symbol = '£') {
    return `${symbol}${amount.toFixed(2)}`;
  }
  
  // Refresh cart drawer content
  function refreshCart() {
    log('Refreshing cart drawer content');
    
    return fetch(`/?section_id=${CART_SECTION_ID}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Fetch cart section failed: ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        // Parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Find the cart drawer in the fetched HTML
        const newCartDrawer = doc.getElementById('cart-drawer') || 
                            doc.querySelector('.cart-drawer');
        
        if (!newCartDrawer) {
          log('Cart drawer not found in fetched HTML');
          throw new Error('Cart drawer not found in fetched HTML');
        }
        
        // Update the inner content to avoid breaking event handlers
        const currentContent = cartDrawer.querySelector('.cart-drawer-content');
        const newContent = newCartDrawer.querySelector('.cart-drawer-content');
        
        if (currentContent && newContent) {
          // Update just the content
          currentContent.innerHTML = newContent.innerHTML;
        } else {
          // Fallback to updating entire drawer
          cartDrawer.innerHTML = newCartDrawer.innerHTML;
          
          // Reattach close button event
          setupCartToggle();
        }
        
        return Promise.resolve();
      })
      .catch(error => {
        console.error('Error refreshing cart:', error);
        return Promise.reject(error);
      });
  }
  
  // Update cart count badge
  function updateCartCount(count) {
    if (typeof count === 'undefined') {
      fetch('/cart.js')
        .then(response => response.json())
        .then(cart => {
          updateCartCountBadges(cart.item_count);
        })
        .catch(error => {
          console.error('Error fetching cart:', error);
        });
    } else {
      updateCartCountBadges(count);
    }
  }
  
  // Function to update cart count badges - with "+9" limit
  function updateCartCountBadges(count) {
    const badges = document.querySelectorAll('.cart-count');
    
    badges.forEach(badge => {
      // If count is greater than 9, display "+9"
      const displayText = count > 9 ? "+9" : count;
      badge.textContent = displayText;
      badge.setAttribute('data-count', count);
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }
  
  // Open cart drawer
  function openCart() {
    if (!cartDrawer) return;
    
    log('Opening cart drawer');
    
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartDrawer.classList.add('active', 'is-active', 'open', 'is-open');
    document.body.classList.add('drawer-open');
    
    const backdrop = getBackdrop();
    if (backdrop) {
      backdrop.classList.add('visible');
    }
  }
  
  // Close cart drawer
  function closeCart() {
    if (!cartDrawer) return;
    
    log('Closing cart drawer');
    
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartDrawer.classList.remove('active', 'is-active', 'open', 'is-open');
    document.body.classList.remove('drawer-open');
    
    const backdrop = getBackdrop();
    if (backdrop) {
      backdrop.classList.remove('visible');
    }
  }

  // Global AJAX request listener to catch Swym and other scripts' cart updates
  (function() {
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
      // Call the original fetch
      const promise = originalFetch.apply(this, arguments);
      
      // If this is a cart update or add request
      if (typeof url === 'string' && 
          (url.includes('/cart/add') || 
           url.includes('/cart/change') || 
           url.includes('/cart/update') ||
           url.includes('/cart/clear'))) {
        
        // Wait for the operation to complete
        promise.then(response => {
          if (response.ok) {
            log('Cart modified by fetch to:', url);
            
            // Wait a moment to let the operation complete server-side
            setTimeout(() => {
              // Update cart
              fetch('/cart.js')
                .then(res => res.json())
                .then(cart => {
                  log('Cart fetched after modification:', cart.item_count, 'items');
                  updateCartCount(cart.item_count);
                  refreshCart();
                })
                .catch(err => console.error('Error updating cart after intercept:', err));
            }, 300);
          }
        }).catch(err => {
          console.error('Error in intercepted fetch:', err);
        });
      }
      
      return promise;
    };
    
    // Also intercept XMLHttpRequest for older scripts
    const originalXHROpen = window.XMLHttpRequest.prototype.open;
    const originalXHRSend = window.XMLHttpRequest.prototype.send;
    
    window.XMLHttpRequest.prototype.open = function() {
      // Store the URL being requested
      this._url = arguments[1];
      return originalXHROpen.apply(this, arguments);
    };
    
    window.XMLHttpRequest.prototype.send = function() {
      if (this._url && typeof this._url === 'string' && 
         (this._url.includes('/cart/add') || 
          this._url.includes('/cart/change') || 
          this._url.includes('/cart/update') ||
          this._url.includes('/cart/clear'))) {
          
        // Add load event listener to detect when request completes
        this.addEventListener('load', function() {
          if (this.status >= 200 && this.status < 300) {
            log('Cart modified by XHR to:', this._url);
            
            // Wait a moment to let the operation complete server-side
            setTimeout(() => {
              // Update cart
              fetch('/cart.js')
                .then(res => res.json())
                .then(cart => {
                  log('Cart fetched after XHR modification:', cart.item_count, 'items');
                  updateCartCount(cart.item_count);
                  refreshCart();
                })
                .catch(err => console.error('Error updating cart after XHR intercept:', err));
            }, 300);
          }
        });
      }
      
      return originalXHRSend.apply(this, arguments);
    };
  })();


// Simple event handler for jewelry box buttons
document.addEventListener('click', function(e) {
  const button = e.target.closest('.add-jewelry-box-button');
  if (!button) return;
  
  e.preventDefault();
  
  // Ignore if already processed
  if (button.classList.contains('added-box')) return;
  
  // Get the cart item
  const cartItem = button.closest('.cart-item');
  if (!cartItem) return;
  
  // Get item title to check if it's a jewelry box
  const itemTitle = cartItem.querySelector('.cart-item-title')?.textContent || '';
  if (itemTitle.toLowerCase().includes('box')) {
    // Hide button on jewelry boxes
    button.style.display = 'none';
    return;
  }
  
  // Get required data
  const itemKey = cartItem.getAttribute('data-item-key');
  const quantityBtn = cartItem.querySelector('.quantity-button');
  const lineNumber = quantityBtn ? quantityBtn.getAttribute('data-line') : null;
  
  if (!itemKey || !lineNumber) return;
  
  // Show adding state
  button.textContent = 'Adding...';
  button.disabled = true;
  
  // Determine jewelry type from title or attribute
  let type = button.getAttribute('data-primary-category');
  if (!type) {
    if (itemTitle.toLowerCase().includes('ring')) type = 'rings';
    else if (itemTitle.toLowerCase().includes('necklace')) type = 'necklaces';
    else if (itemTitle.toLowerCase().includes('bracelet')) type = 'bracelets';
    else if (itemTitle.toLowerCase().includes('earring')) type = 'earrings';
    else type = 'charms';
  }
  
  // Variant IDs
  const boxVariants = {
    'rings': '52487391084876',
    'necklaces': '52487391150412',
    'bracelets': '52487391183180',
    'earrings': '52487391117644',
    'charms': '52487391215948'
  };
  
  // Add to cart
  fetch('/cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: boxVariants[type] || boxVariants.charms,
      quantity: 1,
      properties: {
        '_jewelry_box_for': itemKey,
        '_box_type': type
      }
    })
  })
  .then(response => response.json())
  .then(() => {
    // Mark as added
    button.textContent = 'Added';
    button.classList.add('added-box');
    
    // Refresh cart
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        if (typeof updateCartCount === 'function') {
          updateCartCount(cart.item_count);
        }
        if (typeof refreshCart === 'function') {
          refreshCart();
        }
      });
  })
  .catch(() => {
    // Reset on error
    button.disabled = false;
    button.textContent = 'Add a Jewelry Box';
  });
});
  
});