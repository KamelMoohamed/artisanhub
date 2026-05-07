// Used in the Search component dropdown (client-side, real-time)
export const PREDICTIVE_SEARCH_QUERY = `
  query PredictiveSearch($query: String!) {
    predictiveSearch(query: $query) {
      products {
        id title handle vendor
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        featuredImage { url altText }
      }
      collections {
        id title handle
      }
    }
  }
`;

// Used on the /search results page (server-side, full product cards)
export const SEARCH_QUERY = `
  query Search($query: String!, $first: Int!) {
    search(query: $query, first: $first, types: [PRODUCT]) {
      totalCount
      edges {
        node {
          ... on Product {
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