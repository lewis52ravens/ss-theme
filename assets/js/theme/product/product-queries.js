
export default class ProductQuery {
    constructor(token) {
        this.token = token;
    }

    getProductInfo(productIds, handler) {
        if (productIds == undefined) {
            return Promise.resolve();
        }
        const response = fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                query: `
                query productQuery {
                    site {
                        products(entityIds: [${productIds}]) {
                            edges {
                                node {
                                    entityId
                                    name
                                    addToCartUrl
                                    prices {
                                        price {
                                            currencyCode
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                `
            }),
        }).then(res => res.json()).then(json => {
            const products = [];
            json.data.site.products.edges.forEach(edge => {
                const newProduct = {
                    entityId: edge.node.entityId,
                    name: edge.node.name,
                    addToCartUrl: edge.node.addToCartUrl,
                    price: edge.node.prices.price.value
                }
                products.push(newProduct);
            });

            if (handler) {
                handler(products);
            }
            return products;
        })
        return response;
    }

    getMetafields(productId, handler) {
        
        fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                query: `
                query metafieldQuery {
                    site {
                        product(entityId: ${productId}) {
                            entityId
                            name
                            metafields(namespace: "mcdesign") {
                                edges {
                                    node {
                                        entityId
                                        key
                                        value
                                    }
                                }
                            }
                            variants {
                                edges {
                                    node {
                                        entityId
                                        sku
                                        height {
                                            value
                                            unit
                                        }
                                        width {
                                            value
                                            unit
                                        }
                                        depth {
                                            value
                                            unit
                                        }
                                        options {
                                            edges {
                                                node {
                                                    displayName
                                                    values {
                                                        edges {
                                                            node {
                                                                label
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        metafields(namespace: "mcdesign") {
                                            edges {
                                                node {
                                                    entityId
                                                    key
                                                    value
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                `
            }),
        }).then(res => res.json()).then(json => {
            const product = {};
            const jsonProdFields = json.data.site.product.metafields.edges;
            jsonProdFields.forEach(edge => {
                product[edge.node.key] = edge.node.value;
            });
            const jsonVariants = json.data.site.product.variants.edges;
            const variants = [];
            jsonVariants.forEach(variantEdge => {
                const variant = {
                    entityId: variantEdge.node.entityId,
                    sku: variantEdge.node.sku,
                    height: variantEdge.node.height.value,
                    width: variantEdge.node.width.value,
                    depth: variantEdge.node.depth.value,
                    unit: variantEdge.node.height.unit,
                    metafields: {},
                    options: {}
                };
                variantEdge.node.metafields.edges.forEach(metaEdge => {
                    variant.metafields[metaEdge.node.key] = metaEdge.node.value;
                });
                variantEdge.node.options.edges.forEach(optionEdge => {
                    variant.options[optionEdge.node.displayName] = optionEdge.node.values.edges[0].node.label;
                })
                variants.push(variant);
            })
            
            product.variants = variants;
            handler(product, this);
        });
    }

}