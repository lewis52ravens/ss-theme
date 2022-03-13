import 'focus-within-polyfill';

import { bind, debounce } from 'lodash';
import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import cartPreview2 from './global/cart-preview2';
import privacyCookieNotification from './global/cookieNotification';
import adminBar from './global/adminBar';
import carousel from './common/carousel';
import loadingProgressBar from './global/loading-progress-bar';
import svgInjector from './global/svg-injector';
import removeItemFromCart from './cart/remove-from-cart';

export default class Global extends PageManager {
    onReady() {
        const {
            channelId, cartId, productId, categoryId, secureBaseUrl, maintenanceModeSettings, adminBarLanguage, showAdminBar,
        } = this.context;
        //cartPreview(secureBaseUrl, cartId);
        cartPreview2(secureBaseUrl, cartId);
        quickSearch();
        currencySelector(cartId);
        foundation($(document));
        quickView(this.context);
        carousel(this.context);
        menu();
        mobileMenuToggle();
        privacyCookieNotification();
        if (showAdminBar) {
            adminBar(secureBaseUrl, channelId, maintenanceModeSettings, JSON.parse(adminBarLanguage), productId, categoryId);
        }
        loadingProgressBar();
        svgInjector();
        this.$cartMenu = $('#mcdesign-cart-dropdown-content');
        this.bindCartEvents();
        
    }

    bindCartEvents() {
        const debounceTimeout = 400;
        const removeItem = bind(debounce(removeItemFromCart, debounceTimeout), this);

        this.$cartMenu.on('click', '.mcdesign-cart-remove', event => {
            console.log("Hit remove button");
            const itemId = $(event.currentTarget).data('removeItemid');
            event.preventDefault();
            removeItem(itemId);
        })
    }
}
