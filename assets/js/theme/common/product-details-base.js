import Wishlist from '../wishlist';
import { initRadioOptions } from './aria';
import { isObject, isNumber } from 'lodash';

const optionsTypesMap = {
    INPUT_FILE: 'input-file',
    INPUT_TEXT: 'input-text',
    INPUT_NUMBER: 'input-number',
    INPUT_CHECKBOX: 'input-checkbox',
    TEXTAREA: 'textarea',
    DATE: 'date',
    SET_SELECT: 'set-select',
    SET_RECTANGLE: 'set-rectangle',
    SET_RADIO: 'set-radio',
    SWATCH: 'swatch',
    PRODUCT_LIST: 'product-list',
};

export function optionChangeDecorator(areDefaultOtionsSet) {
    return (err, response) => {
        const attributesData = response.data || {};
        const attributesContent = response.content || {};

        this.updateProductAttributes(attributesData);
        if (areDefaultOtionsSet) {
            this.updateView(attributesData, attributesContent);
        } else {
            this.updateDefaultAttributesForOOS(attributesData);
        }
    };
}

export default class ProductDetailsBase {
    constructor($scope, context) {
        this.$scope = $scope;
        this.context = context;
        this.initRadioAttributes();
        Wishlist.load(this.context);
        this.getTabRequests();

        this.additionalPrice = 0;

        $('[data-product-attribute]').each((__, value) => {
            const type = value.getAttribute('data-product-attribute');

            this._makeProductVariantAccessible(value, type);
        });
    }

    _makeProductVariantAccessible(variantDomNode, variantType) {
        switch (variantType) {
        case optionsTypesMap.SET_RADIO:
        case optionsTypesMap.SWATCH: {
            initRadioOptions($(variantDomNode), '[type=radio]');
            break;
        }

        default: break;
        }
    }

    /**
     * Allow radio buttons to get deselected
     */
    initRadioAttributes() {
        $('[data-product-attribute] input[type="radio"]', this.$scope).each((i, radio) => {
            const $radio = $(radio);

            // Only bind to click once
            if ($radio.attr('data-state') !== undefined) {
                $radio.on('click', () => {
                    if ($radio.data('state') === true) {
                        $radio.prop('checked', false);
                        $radio.data('state', false);

                        $radio.trigger('change');
                    } else {
                        $radio.data('state', true);
                    }

                    this.initRadioAttributes();
                });
            }

            $radio.attr('data-state', $radio.prop('checked'));
        });
    }

    /**
     * Hide or mark as unavailable out of stock attributes if enabled
     * @param  {Object} data Product attribute data
     */
    updateProductAttributes(data) {
        const behavior = data.out_of_stock_behavior;
        const inStockIds = data.in_stock_attributes;
        const outOfStockMessage = ` (${data.out_of_stock_message})`;

        if (behavior !== 'hide_option' && behavior !== 'label_option') {
            return;
        }

        $('[data-product-attribute-value]', this.$scope).each((i, attribute) => {
            const $attribute = $(attribute);
            const attrId = parseInt($attribute.data('productAttributeValue'), 10);


            if (inStockIds.indexOf(attrId) !== -1) {
                this.enableAttribute($attribute, behavior, outOfStockMessage);
            } else {
                this.disableAttribute($attribute, behavior, outOfStockMessage);
            }
        });
    }

    /**
     * Check for fragment identifier in URL requesting a specific tab
     */
    getTabRequests() {
        if (window.location.hash && window.location.hash.indexOf('#tab-') === 0) {
            const $activeTab = $('.tabs').has(`[href='${window.location.hash}']`);
            const $tabContent = $(`${window.location.hash}`);

            if ($activeTab.length > 0) {
                $activeTab.find('.tab')
                    .removeClass('is-active')
                    .has(`[href='${window.location.hash}']`)
                    .addClass('is-active');

                $tabContent.addClass('is-active')
                    .siblings()
                    .removeClass('is-active');
            }
        }
    }

    /**
     * Since $productView can be dynamically inserted using render_with,
     * We have to retrieve the respective elements
     *
     * @param $scope
     */
    getViewModel($scope) {
        return {
            $priceWithTax: $('[data-product-price-with-tax]', $scope),
            $priceWithoutTax: $('[data-product-price-without-tax]', $scope),
            rrpWithTax: {
                $div: $('.rrp-price--withTax', $scope),
                $span: $('[data-product-rrp-with-tax]', $scope),
            },
            rrpWithoutTax: {
                $div: $('.rrp-price--withoutTax', $scope),
                $span: $('[data-product-rrp-price-without-tax]', $scope),
            },
            nonSaleWithTax: {
                $div: $('.non-sale-price--withTax', $scope),
                $span: $('[data-product-non-sale-price-with-tax]', $scope),
            },
            nonSaleWithoutTax: {
                $div: $('.non-sale-price--withoutTax', $scope),
                $span: $('[data-product-non-sale-price-without-tax]', $scope),
            },
            priceSaved: {
                $div: $('.price-section--saving', $scope),
                $span: $('[data-product-price-saved]', $scope),
            },
            priceNowLabel: {
                $span: $('.price-now-label', $scope),
            },
            priceLabel: {
                $span: $('.price-label', $scope),
            },
            $weight: $('.productView-info [data-product-weight]', $scope),
            $increments: $('.form-field--increments :input', $scope),
            $addToCart: $('#form-action-addToCart', $scope),
            $wishlistVariation: $('[data-wishlist-add] [name="variation_id"]', $scope),
            stock: {
                $container: $('.form-field--stock', $scope),
                $input: $('[data-product-stock]', $scope),
            },
            sku: {
                $label: $('dt.sku-label', $scope),
                $value: $('[data-product-sku]', $scope),
            },
            upc: {
                $label: $('dt.upc-label', $scope),
                $value: $('[data-product-upc]', $scope),
            },
            quantity: {
                $text: $('.incrementTotal', $scope),
                $input: $('[name=qty\\[\\]]', $scope),
            },
            $bulkPricing: $('.productView-info-bulkPricing', $scope),
            $productDescription: $('.mcd-product-description-text', $scope),
        };
    }

    /**
     * Hide the pricing elements that will show up only when the price exists in API
     * @param viewModel
     */
    clearPricingNotFound(viewModel) {
        viewModel.rrpWithTax.$div.hide();
        viewModel.rrpWithoutTax.$div.hide();
        viewModel.nonSaleWithTax.$div.hide();
        viewModel.nonSaleWithoutTax.$div.hide();
        viewModel.priceSaved.$div.hide();
        viewModel.priceNowLabel.$span.hide();
        viewModel.priceLabel.$span.hide();
    }

    /**
     * Update the view of price, messages, SKU and stock options when a product option changes
     * @param  {Object} data Product attribute data
     */
    updateView(data, content = null) {
        const viewModel = this.getViewModel(this.$scope);
        console.log('updateView:');
        console.log(data);
        console.log('context:');
        console.log(this.context);

        if (data.v3_variant_id) {
            this.updateDescription(viewModel, data.v3_variant_id);
        }
        this.showMessageBox(data.stock_message || data.purchasing_message);

        if (isObject(data.price)) {
            this.updatePriceView(viewModel, data.price);
        }

        if (isObject(data.weight)) {
            viewModel.$weight.html(data.weight.formatted);
        }

        // Set variation_id if it exists for adding to wishlist
        if (data.variantId) {
            viewModel.$wishlistVariation.val(data.variantId);
        }

        // If SKU is available
        if (data.sku) {
            viewModel.sku.$value.text(data.sku);
            viewModel.sku.$label.show();
        } else {
            viewModel.sku.$label.hide();
            viewModel.sku.$value.text('');
        }

        // If UPC is available
        if (data.upc) {
            viewModel.upc.$value.text(data.upc);
            viewModel.upc.$label.show();
        } else {
            viewModel.upc.$label.hide();
            viewModel.upc.$value.text('');
        }

        // if stock view is on (CP settings)
        if (viewModel.stock.$container.length && isNumber(data.stock)) {
            // if the stock container is hidden, show
            viewModel.stock.$container.removeClass('u-hiddenVisually');

            viewModel.stock.$input.text(data.stock);
        } else {
            viewModel.stock.$container.addClass('u-hiddenVisually');
            viewModel.stock.$input.text(data.stock);
        }

        this.updateDefaultAttributesForOOS(data);

        // If Bulk Pricing rendered HTML is available
        if (data.bulk_discount_rates && content) {
            viewModel.$bulkPricing.html(content);
        } else if (typeof (data.bulk_discount_rates) !== 'undefined') {
            viewModel.$bulkPricing.html('');
        }

        const addToCartWrapper = $('#add-to-cart-wrapper');

        if (addToCartWrapper.is(':hidden') && data.purchasable) {
            addToCartWrapper.show();
        }
    }

    updateDescription(viewModel, variantId) {
        //let viewModel = this.getViewModel('scope');
        if (this.variantInfo && this.variantInfo.length > 0) {
            let newVariant = null;
            for (let i = 0; i < this.variantInfo.length; i++) {
                const variant = this.variantInfo[i];
                if (variant.entityId == variantId) {
                    newVariant = variant;
                    break;
                }
            }
            if (newVariant) {
                //console.log('Description:');
                //console.log(viewModel.$productDescription.html());
                console.log('new variant: ');
                console.log(newVariant);
                const newSizes = {
                    ssMax: newVariant.metafields.serving_size_max,
                    ssMin: newVariant.metafields.serving_size_min,
                    cheeseQty: newVariant.metafields.cheese_qty,
                    meatQty: newVariant.metafields.meat_qty,
                    vWidth: newVariant.width,
                    vHeight: newVariant.height,
                    vDepth: newVariant.depth,
                    vUnit: newVariant.unit,
                    vSize: newVariant.options.Size,
                };
                /*
                viewModel.$productDescription.find('[data-replace]').text((index, oldText) => {
                    const replace = $(this).data('replace');
                    const rr = this.dataset;
                    if (replace == 'serving_size' && sizes.ssMax && sizes.ssMin) {
                        return `${sizes.ssMin} - ${sizes.ssMax}`;
                    } else if (replace == 'size_w' && sizes.vWidth) {
                        return `${sizes.vWidth} ${sizes.vUnit}`;
                    } else if (replace == 'size_l' && sizes.vDepth) {
                        return `${sizes.vDepth} ${sizes.vUnit}`;
                    } else if (replace == 'size_h' && sizes.vHeight) {
                        return `${sizes.vHeight} ${sizes.vUnit}`;
                    } else if (replace == 'size_cheese' && sizes.cheeseQty) {
                        return sizes.cheeseQty;
                    } else if (replace == 'size_meat' && sizes.meatQty) {
                        return sizes.meatQty;
                    } else if (replace == 'size' && sizes.vSize) {
                        return sizes.vSize;
                    } else {
                        return oldText;
                    }
                });
                */
               viewModel.$productDescription.find('[data-replace]').each((index, element) => {
                const replace = $(element).data('replace');
                if (replace == 'serving_size' && newSizes.ssMax && newSizes.ssMin) {
                    $(element).text(`${newSizes.ssMin} - ${newSizes.ssMax}`);
                } else if (replace == 'size_w' && newSizes.vWidth) {
                    $(element).text(`${newSizes.vWidth} ${newSizes.vUnit}`);
                } else if (replace == 'size_l' && newSizes.vDepth) {
                    $(element).text(`${newSizes.vDepth} ${newSizes.vUnit}`);
                } else if (replace == 'size_h' && newSizes.vHeight) {
                    $(element).text(`${newSizes.vHeight} ${newSizes.vUnit}`);
                } else if (replace == 'size_cheese' && newSizes.cheeseQty) {
                    $(element).text(newSizes.cheeseQty);
                } else if (replace == 'size_meat' && newSizes.meatQty) {
                    $(element).text(newSizes.meatQty);
                } else if (replace == 'size' && newSizes.vSize) {
                    $(element).text(newSizes.vSize);
                } 
               });
               /*
                (function (viewModel, sizes) {
                    viewModel.$productDescription.find('[data-replace]').text((_this, index, oldText) => {
                        //const replace = $(this).data('replace');
                        //const rr = this.dataset;
                        
                        if ($(this).data('replace') == 'serving_size' && sizes.ssMax && sizes.ssMin) {
                            return `${sizes.ssMin} - ${sizes.ssMax}`;
                        } else if ($(this).data('replace') == 'size_w' && sizes.vWidth) {
                            return `${sizes.vWidth} ${sizes.vUnit}`;
                        } else if ($(this).data('replace') == 'size_l' && sizes.vDepth) {
                            return `${sizes.vDepth} ${sizes.vUnit}`;
                        } else if ($(this).data('replace') == 'size_h' && sizes.vHeight) {
                            return `${sizes.vHeight} ${sizes.vUnit}`;
                        } else if ($(this).data('replace') == 'size_cheese' && sizes.cheeseQty) {
                            return sizes.cheeseQty;
                        } else if ($(this).data('replace') == 'size_meat' && sizes.meatQty) {
                            return sizes.meatQty;
                        } else if ($(this).data('replace') == 'size' && sizes.vSize) {
                            return sizes.vSize;
                        } else {
                            return oldText;
                        }
                    });
                })(viewModel, newSizes);
                */
            }
        }
    }

    /**
     * Update the view of price, messages, SKU and stock options when a product option changes
     * @param  {Object} data Product attribute data
     */
    updatePriceView(viewModel, price) {
        this.clearPricingNotFound(viewModel);
        var priceObject = price.with_tax ? price.with_tax : price.without_tax;
        if (this.additionalPrice > 0) {
            const oldVal = priceObject.value;
            const newVal = oldVal + this.additionalPrice;
            const newFormatted = new Intl.NumberFormat('en-US', {style: 'currency', currency: priceObject.currency}).format(newVal);
            priceObject.formatted = newFormatted;
            priceObject.value = newVal;
        }

        if (price.with_tax) {
            const updatedPrice = price.price_range ?
                `${price.price_range.min.with_tax.formatted} - ${price.price_range.max.with_tax.formatted}`
                : priceObject.formatted;
            viewModel.priceLabel.$span.show();
            viewModel.$priceWithTax.html(updatedPrice);
        }

        if (price.without_tax) {
            const updatedPrice = price.price_range ?
                `${price.price_range.min.without_tax.formatted} - ${price.price_range.max.without_tax.formatted}`
                : priceObject.formatted;
            viewModel.priceLabel.$span.show();
            viewModel.$priceWithoutTax.html(updatedPrice);
        }

        if (price.rrp_with_tax) {
            viewModel.rrpWithTax.$div.show();
            viewModel.rrpWithTax.$span.html(price.rrp_with_tax.formatted);
        }

        if (price.rrp_without_tax) {
            viewModel.rrpWithoutTax.$div.show();
            viewModel.rrpWithoutTax.$span.html(price.rrp_without_tax.formatted);
        }

        if (price.saved) {
            viewModel.priceSaved.$div.show();
            viewModel.priceSaved.$span.html(price.saved.formatted);
        }

        if (price.non_sale_price_with_tax) {
            viewModel.priceLabel.$span.hide();
            viewModel.nonSaleWithTax.$div.show();
            viewModel.priceNowLabel.$span.show();
            viewModel.nonSaleWithTax.$span.html(price.non_sale_price_with_tax.formatted);
        }

        if (price.non_sale_price_without_tax) {
            viewModel.priceLabel.$span.hide();
            viewModel.nonSaleWithoutTax.$div.show();
            viewModel.priceNowLabel.$span.show();
            viewModel.nonSaleWithoutTax.$span.html(price.non_sale_price_without_tax.formatted);
        }
    }

    /**
     * Show an message box if a message is passed
     * Hide the box if the message is empty
     * @param  {String} message
     */
    showMessageBox(message) {
        const $messageBox = $('.productAttributes-message');

        if (message) {
            $('.alertBox-message', $messageBox).text(message);
            $messageBox.show();
        } else {
            $messageBox.hide();
        }
    }

    updateDefaultAttributesForOOS(data) {
        const viewModel = this.getViewModel(this.$scope);
        if (!data.purchasable || !data.instock) {
            viewModel.$addToCart.prop('disabled', true);
            viewModel.$increments.prop('disabled', true);
        } else {
            viewModel.$addToCart.prop('disabled', false);
            viewModel.$increments.prop('disabled', false);
        }
    }

    enableAttribute($attribute, behavior, outOfStockMessage) {
        if (this.getAttributeType($attribute) === 'set-select') {
            return this.enableSelectOptionAttribute($attribute, behavior, outOfStockMessage);
        }

        if (behavior === 'hide_option') {
            $attribute.show();
        } else {
            $attribute.removeClass('unavailable');
        }
    }

    disableAttribute($attribute, behavior, outOfStockMessage) {
        if (this.getAttributeType($attribute) === 'set-select') {
            return this.disableSelectOptionAttribute($attribute, behavior, outOfStockMessage);
        }

        if (behavior === 'hide_option') {
            $attribute.hide(0);
        } else {
            $attribute.addClass('unavailable');
        }
    }

    getAttributeType($attribute) {
        const $parent = $attribute.closest('[data-product-attribute]');

        return $parent ? $parent.data('productAttribute') : null;
    }

    disableSelectOptionAttribute($attribute, behavior, outOfStockMessage) {
        const $select = $attribute.parent();

        if (behavior === 'hide_option') {
            $attribute.toggleOption(false);
            // If the attribute is the selected option in a select dropdown, select the first option (MERC-639)
            if ($select.val() === $attribute.attr('value')) {
                $select[0].selectedIndex = 0;
            }
        } else {
            $attribute.attr('disabled', 'disabled');
            $attribute.html($attribute.html().replace(outOfStockMessage, '') + outOfStockMessage);
        }
    }

    enableSelectOptionAttribute($attribute, behavior, outOfStockMessage) {
        if (behavior === 'hide_option') {
            $attribute.toggleOption(true);
        } else {
            $attribute.prop('disabled', false);
            $attribute.html($attribute.html().replace(outOfStockMessage, ''));
        }
    }
}
