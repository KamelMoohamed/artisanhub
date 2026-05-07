export const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id title handle
          image { url altText }
        }
      }
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!, $first: Int!, $filters: [ProductFilter!]) {
    collection(handle: $handle) {
      id title handle description
      products(first: $first, filters: $filters) {
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