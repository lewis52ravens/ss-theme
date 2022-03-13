import utils from '@bigcommerce/stencil-utils';

export default function (itemId) {
    console.log("Removing from cart");
    utils.api.cart.itemRemove(itemId, (err, response) => {
        if (response.data.status === 'succeed') {
            console.log("succeeded in removing item");
            utils.api.cart.getCartQuantity({}, (err2, response2) => {
                $('body').trigger('mcdesign-cart-quantity-update', response2);
            })
        } else {
            alert(response.data.errors.join('\n'));
        }
    })
}