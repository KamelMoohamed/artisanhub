export const PREDICTIVE_SEARCH_QUERY = `
  query PredictiveSearch($query: String!) {
    predictiveSearch(query: $query) {
      products {
        id title handle
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