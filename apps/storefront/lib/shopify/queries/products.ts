// Lightweight query used only for generateStaticParams — fetches up to 250 handles.
export const PRODUCT_HANDLES_QUERY = `
  query ProductHandles($first: Int!) {
    products(first: $first) {
      edges {
        node { handle }
      }
    }
  }
`;

export const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id title handle vendor tags
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          featuredImage { url altText }
          metafield(namespace: "artisanhub", key: "vendor_id") {
            value
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id title handle descriptionHtml vendor tags
      priceRange {
        minVariantPrice { amount currencyCode }
      }
      images(first: 10) {
        edges { node { url altText } }
      }
      variants(first: 20) {
        edges {
          node {
            id title availableForSale
            price { amount currencyCode }
            selectedOptions { name value }
          }
        }
      }
      metafield(namespace: "artisanhub", key: "vendor_id") {
        value
      }
    }
  }
`;

export const FEATURED_COLLECTION_QUERY = `
  query FeaturedCollection {
    collection(handle: "featured") {
      title
      products(first: 8) {
        edges {
          node {
            id title handle vendor tags
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            featuredImage { url altText }
          }
        }
      }
    }
  }
`;