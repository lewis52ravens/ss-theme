
export default class AddonList {

    constructor() {
        /** @field (AddonListItem) */
        this.firstItem = null;
        /** @field (AddonListItem) */
        this.lastItem = null;
    }

    /**
     * Adds an item to the end of the linked list
     * @param item The item to add
     */
    addItem(item) {
        if (this.firstItem == null) {
            this.firstItem = new AddonListItem(item);
            this.lastItem = this.firstItem;
        } else {
            const newItem = new AddonListItem(item, this.lastItem);
            this.lastItem.nextItem = newItem;
            this.lastItem = newItem;
        }
    }

    isEmpty() {
        return this.firstItem == null;
    }

    emptyList() {
        this.firstItem = null;
        this.lastItem = null;
    }
}

class AddonListItem {

    constructor(item, previous, next) {
        this.item = item;
        this.prevItem = null;
        this.nextItem = null;
        if (previous) {
            this.prevItem = previous
        }
        if (next) {
            this.nextItem = next;
        }
    }

    hasNextItem() {
        return this.nextItem != null
    }

    hasPrevItem() {
        return this.prevItem != null;
    }

}