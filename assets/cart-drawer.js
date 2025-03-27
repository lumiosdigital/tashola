// Cart Drawer Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const cartDrawer = document.getElementById('cart-drawer');
  const cartToggle = document.querySelector('.cart-drawer-trigger');
  const closeButton = document.querySelector('.cart-drawer-close');
  const backdrop = document.querySelector('.cart-drawer-backdrop');
  const decreaseButtons = document.querySelectorAll('.quantity-button.decrease');
  const increaseButtons = document.querySelectorAll('.quantity-button.increase');
  const removeButtons = document.querySelectorAll('.remove-button');
  const jewelryBoxOption = document.getElementById('jewelry-box-option');

  // Open cart drawer when cart icon is clicked
  if (cartToggle) {
    cartToggle.addEventListener('click', function(event) {
      event.preventDefault();
      openCartDrawer();
    });
  }

  // Close drawer functions
  if (closeButton) {
    closeButton.addEventListener('click', closeCartDrawer);
  }

  if (backdrop) {
    backdrop.addEventListener('click', function(event) {
      event.stopPropagation();
      closeCartDrawer();
    });
  }

  // Close drawer when pressing Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && cartDrawer.getAttribute('aria-hidden') === 'false') {
      closeCartDrawer();
    }
  });

  // Quantity change functions
  decreaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const lineItem = this.getAttribute('data-line');
      const input = this.nextElementSibling;
      let quantity = parseInt(input.value) - 1;

      if (quantity >= 0) {
        updateCartItem(lineItem, quantity);
      }
    });
  });

  increaseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const lineItem = this.getAttribute('data-line');
      const input = this.previousElementSibling;
      let quantity = parseInt(input.value) + 1;

      updateCartItem(lineItem, quantity);
    });
  });

  // Remove item function
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const lineItem = this.getAttribute('data-line');
      updateCartItem(lineItem, 0);
    });
  });

  // Jewelry box option (if enabled)
  if (jewelryBoxOption) {
    jewelryBoxOption.addEventListener('change', function() {
      // Here you would update cart with jewelry box option
      // This would need to be implemented based on your Shopify setup
    });
  }

  // Helper functions
  function openCartDrawer() {
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    backdrop.classList.add('visible'); // Show the backdrop with opacity effect
  }

  function closeCartDrawer() {
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    backdrop.classList.remove('visible'); // Hide the backdrop
  }

  // Function to update cart count badges
  function updateCartCountBadge(itemCount) {
    const cartCountBadges = document.querySelectorAll('.cart-count');

    cartCountBadges.forEach(badge => {
      badge.textContent = itemCount;
      badge.setAttribute('data-count', itemCount);
      if (itemCount > 0) {
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }

      // Update any cart button aria-labels
      const cartButton = badge.closest('.cart-drawer-trigger');
      if (cartButton) {
        cartButton.setAttribute('aria-label', `Cart with ${itemCount} items`);
      }
    });
  }

  function updateCartItem(line, quantity) {
    document.body.classList.add('cart-loading');

    fetch('/cart/change.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        line: line,
        quantity: quantity
      })
    })
    .then(response => response.json())
    .then(cart => {
      updateCartCountBadge(cart.item_count);
      fetchCartDrawerContent();
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      document.body.classList.remove('cart-loading');
    });
  }

  function fetchCartDrawerContent() {
    fetch('/?section_id=cart-drawer')
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newCartDrawer = doc.getElementById('cart-drawer');

        if (newCartDrawer) {
          cartDrawer.innerHTML = newCartDrawer.innerHTML;
          attachEventListeners();
        }

        document.body.classList.remove('cart-loading');
      })
      .catch(error => {
        console.error('Error fetching cart content:', error);
        document.body.classList.remove('cart-loading');
      });
  }

  function attachEventListeners() {
    const newCloseButton = document.querySelector('.cart-drawer-close');
    if (newCloseButton) {
      newCloseButton.addEventListener('click', closeCartDrawer);
    }

    const newBackdrop = document.querySelector('.cart-drawer-backdrop');
    if (newBackdrop) {
      newBackdrop.addEventListener('click', closeCartDrawer);
    }

    const newDecreaseButtons = document.querySelectorAll('.quantity-button.decrease');
    newDecreaseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const lineItem = this.getAttribute('data-line');
        const input = this.nextElementSibling;
        let quantity = parseInt(input.value) - 1;

        if (quantity >= 0) {
          updateCartItem(lineItem, quantity);
        }
      });
    });

    const newIncreaseButtons = document.querySelectorAll('.quantity-button.increase');
    newIncreaseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const lineItem = this.getAttribute('data-line');
        const input = this.previousElementSibling;
        let quantity = parseInt(input.value) + 1;

        updateCartItem(lineItem, quantity);
      });
    });

    const newRemoveButtons = document.querySelectorAll('.remove-button');
    newRemoveButtons.forEach(button => {
      button.addEventListener('click', function() {
        const lineItem = this.getAttribute('data-line');
        updateCartItem(lineItem, 0);
      });
    });

    const newJewelryBoxOption = document.getElementById('jewelry-box-option');
    if (newJewelryBoxOption) {
      newJewelryBoxOption.addEventListener('change', function() {
        // Jewelry box option logic
      });
    }
  }

  // Initialize the cart count badge on page load
  fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      updateCartCountBadge(cart.item_count);
    })
    .catch(error => {
      console.error('Error fetching cart:', error);
    });
});
