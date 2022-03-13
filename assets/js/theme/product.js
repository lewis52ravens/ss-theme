/*
 Import all product specific js
 */
import PageManager from './page-manager';
import Review from './product/reviews';
import collapsibleFactory from './common/collapsible';
import ProductDetails from './common/product-details';
import videoGallery from './product/video-gallery';
import { classifyForm } from './common/utils/form-utils';
import modalFactory from './global/modal';
import ProductQuery from './product/product-queries';

export default class Product extends PageManager {
    constructor(context) {
        super(context);
        this.url = window.location.href;
        this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
        this.$bulkPricingLink = $('[data-reveal-id="modal-bulk-pricing"]');
        this.reviewModal = modalFactory('#modal-review-form')[0];
        
        this.$addOnFieldset = $('.mcd-addon-fieldset');
        this.$freeAddOnSection = $('#freeAddOnSection');
        this.$freeAddOnSelect = $('#freeAddOnSelect');
        this.$additionalAddOnFieldset = $('mcd-additional-addons-fieldset');
        this.$additionalAddOnChecks = $('#additionalAddOns');
        this.variants = [];

        this.$addonCounters = $();
        console.log(context);
    }

    onReady() {
        var pq = new ProductQuery(this.context.storefrontAPIToken);
        pq.getMetafields(this.context.productId, this.metafieldHandler.bind(this));

        // Listen for foundation modal close events to sanitize URL after review.
        $(document).on('close.fndtn.reveal', () => {
            if (this.url.indexOf('#write_review') !== -1 && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, document.title, window.location.pathname);
            }
        });

        let validator;

        // Init collapsible
        collapsibleFactory();

        //this.productDetails = new ProductDetails($('.productView'), this.context, window.BCData.product_attributes);
        //this.productDetails = new ProductDetails($('.mcd-product-view'), this.context, window.BCData.product_attributes);
        //this.productDetails.setProductVariant();

        videoGallery();

        this.bulkPricingHandler();

        const $reviewForm = classifyForm('.writeReview-form');

        if ($reviewForm.length === 0) return;

        const review = new Review({ $reviewForm });

        $('body').on('click', '[data-reveal-id="modal-review-form"]', () => {
            validator = review.registerValidation(this.context);
            this.ariaDescribeReviewInputs($reviewForm);
        });

        $reviewForm.on('submit', () => {
            if (validator) {
                validator.performCheck();
                return validator.areAll('valid');
            }

            return false;
        });

        this.productReviewHandler();
    }

    loadProductDetails() {
        //this.productDetails = new ProductDetails($('.productView'), this.context, window.BCData.product_attributes);
        this.productDetails = new ProductDetails($('.mcd-product-view'), this.context, window.BCData.product_attributes);
        this.productDetails.setProductVariant();
        if (this.variants && this.variants.length > 0) {
            this.productDetails.variantInfo = this.variants;
        }
    }

    addToPrice(additionalPrice) {
        this.productDetails.addToCurrentPrice(additionalPrice);
    }
    
    addCounter(counter) {
        this.$addonCounters = this.$addonCounters.add(counter);
        counter.val(1);
        counter.trigger("change");
    }

    removeCounter(counter) {
        counter.val(0);
        counter.trigger("change");
        this.$addonCounters = this.$addonCounters.not(counter);
        
    }

    setupCounters() {
        $('.mcd-addon-counter').hide();
        
        $('input[data-addons-input]').on("change", null, this, function($event) {
            var $counter = $(`#${$event.target.dataset.addonCounter}`);
            //console.log($counter);
            if ($event.target.checked) {
                $counter.show();
                $event.data.addCounter($counter);
                $event.data.$addonCounters.off();
                $event.data.$addonCounters.on("change", null, $event.data, event => {
                    console.log("counter change");
                    var totalPrice = 0;
                    event.data.$addonCounters.each( (index, element) => {
                        const price = element.dataset.addonPrice * element.value;
                        totalPrice += price;
                    });
                    event.data.addToPrice(totalPrice);
                });
                $event.data.$addonCounters.trigger("change");
            } else {
                //$counter.removeClass('visible');
                //$counter.addClass('invisible');
                $counter.hide();
                $event.data.removeCounter($counter);
            }
        });
    }

    metafieldHandler(productMeta, pq) {
        var freePromise = pq.getProductInfo(productMeta.free_add_ons);
        var additionalPromise = pq.getProductInfo(productMeta.additional_add_ons);
        Promise.all([freePromise, additionalPromise]).then(([free, additional]) => {
            console.log("Free:");
            console.log(free);
            console.log("Additional:");
            console.log(additional);

            if (productMeta.free_add_on_count == '0' || productMeta.free_add_ons == undefined) {
                if (this.$freeAddOnSection) {
                    this.$freeAddOnSection.hide();
                }
            } else {
                free.forEach(item => {
                    this.$freeAddOnSelect.children().last().after(`
                        <option value="${item.entityId}">${item.name}</option>
                    `);
                });
            }

            if (productMeta.additional_add_ons == undefined) {
                if (this.$additionalAddonFieldset) {
                    this.$additionalAddonFieldset.hide();
                }
            } else {
                let additionalHtml = '';
                additional.forEach(item => {
                    /**
                     * addToCartUrl: String
                     * entityId: Int
                     * name: String
                     * price: Double
                     */
                    const name = item.name.toLowerCase().replaceAll(' ', '_');
                    const formLine = `
                        <div class="mcd-addon-line row">
                            <div class="form-check col-sm-4 col-md-5 col-12">
                                <input class="form-check-input" type="checkbox" id="${name}_box" data-addons-input data-addon-counter="num_${name}" data-entity-id="${item.entityId}" data-addon-price="${item.price}" />
                                <label class="form-check-label" for="${name}_box">${item.name}</label>
                            </div>
                            <input type="number" class="mcd-addon-counter col-auto ms-4 ms-sm-0 my-2 my-sm-0" id="num_${name}" name="${item.name}" data-addon-price="${item.price}" aria-label="amount of additional ${item.name}s" min="1" max="10" value="1" />
                        </div>
                    `;
                    additionalHtml += formLine;
                });
                this.$additionalAddOnChecks.html(additionalHtml);
            }
            
            if ( (productMeta.free_add_on_count > 0 && productMeta.free_add_ons) || productMeta.additional_add_ons) {
                this.setupCounters();
            }
            this.loadProductDetails();
        });
        if (productMeta.variants && productMeta.variants.length > 0) {
            this.variants = productMeta.variants;
            if (this.productDetails) {
                this.productDetails.variantInfo = productMeta.variants;
            }
        }
        console.log('Product meta:');
        console.log(productMeta);
    }

    ariaDescribeReviewInputs($form) {
        $form.find('[data-input]').each((_, input) => {
            const $input = $(input);
            const msgSpanId = `${$input.attr('name')}-msg`;

            $input.siblings('span').attr('id', msgSpanId);
            $input.attr('aria-describedby', msgSpanId);
        });
    }

    productReviewHandler() {
        if (this.url.indexOf('#write_review') !== -1) {
            this.$reviewLink.trigger('click');
        }
    }

    bulkPricingHandler() {
        if (this.url.indexOf('#bulk_pricing') !== -1) {
            this.$bulkPricingLink.trigger('click');
        }
    }
}
