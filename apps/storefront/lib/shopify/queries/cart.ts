const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id checkoutUrl
    totalQuantity
    cost {
      totalAmount { amount currencyCode }
      subtotalAmount { amount currencyCode }
    }
    lines(first: 100) {
      edges {
        node {
          id quantity
          cost {
            totalAmount { amount currencyCode }
          }
          merchandise {
            ... on ProductVariant {
              id title
              price { amount currencyCode }
              product {
                title handle
                featuredImage { url altText }
              }
              selectedOptions { name value }
            }
          }
        }
      }
    }
  }
`;

export const CART_CREATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFragment }
      userErrors { field message }
    }
  }
`;

export const CART_QUERY = `
  ${CART_FRAGMENT}
  query Cart($cartId: ID!) {
    cart(id: $cartId) { ...CartFragment }
  }
`;