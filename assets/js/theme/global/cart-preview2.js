import utils from '@bigcommerce/stencil-utils';
import removeFromCart from '../cart/remove-from-cart';

export default function (secureBaseUrl, cartId) {

    const $cart = $('.mcdesign-cart-dropdown');
    const $body = $('body');
    const $cartDropdown = $('#mcdesign-cart-dropdown-content-full');
    //const $cartDropdown = $('.mcdesign-cart-dropdown-content');
    //const $cartDropdownMobile = $('#mcdesign-cart-dropdown-content-mobile');

    $body.on('mcdesign-cart-quantity-update', (event, quantity) => {
        $('.mcdesign-cart-quantity').text(quantity > 0 ? quantity : '');
        if (utils.tools.storage.localStorageAvailable()) {
            localStorage.setItem('cart-quantity', quantity);
        }
    });

    let quantity = 0;

    if (cartId) {
        // Get existing quantity from localStorage if found
        if (utils.tools.storage.localStorageAvailable()) {
            if (localStorage.getItem('cart-quantity')) {
                quantity = Number(localStorage.getItem('cart-quantity'));
                $body.trigger('mcdesign-cart-quantity-update', quantity);
            }
        }

        // Get updated cart quantity from the Cart API
        const cartQtyPromise = new Promise((resolve, reject) => {
            utils.api.cart.getCartQuantity({ baseUrl: secureBaseUrl, cartId }, (err, qty) => {
                if (err) {
                    // If this appears to be a 404 for the cart ID, set cart quantity to 0
                    if (err === 'Not Found') {
                        resolve(0);
                    } else {
                        reject(err);
                    }
                }
                resolve(qty);
            });
        });

        cartQtyPromise.then(qty => {
            quantity = qty;
            $body.trigger('mcdesign-cart-quantity-update', quantity);
        });
    } else {
        $body.trigger('mcdesign-cart-quantity-update', quantity);
    }

    $cart.on('click', event => {
        console.log('cart clicked');
        const options = {
            template: 'common/cart-preview'
        };

        // Redirect to full cart page for mobile devices
        /**
        if (/Mobi/i.test(navigator.userAgent)) {
            console.log('mobile user agent');
            return event.stopPropagation();
        }
         */

        event.preventDefault();

        $cartDropdown.html(`<div class="d-flex justify-content-center">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>`);

        utils.api.cart.getContent(options, (err, response) => {
            console.log('got response');
            if (response) {
                $cartDropdown.css('min-width', '22rem');
                $cartDropdown.html(response);
                let $removeButtons = $cartDropdown.find('.mcdesign-cart-remove');
                
                // Setup the remove buttons
                $removeButtons.each( (index, element) => {
                    const prodId = $(element).data('removeItemid');
                    $(element).on('click', null, prodId, (event) => {
                        removeFromCart(event.data);
                    })
                });

            } else {
                $cartDropdown.addClass('p-2');
                $cartDropdown.addClass('text-muted');
                $cartDropdown.html('<p class="m-2">Error: could not load cart</p>');
            }
        });
    });
}