// ── METAOBJECTS ──────────────────────────────────────────

export const METAOBJECT_DEFINITION_CREATE = `#graphql
  mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { type }
      userErrors { field message }
    }
  }
`;

export const VENDOR_PROFILE_CREATE = `#graphql
  mutation MetaobjectCreate($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message }
    }
  }
`;

export const VENDOR_PROFILE_UPDATE = `#graphql
  mutation MetaobjectUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message }
    }
  }
`;

export const VENDOR_PROFILE_GET = `#graphql
  query GetVendorProfile($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id handle
      fields { key value }
    }
  }
`;

export const VENDOR_PROFILES_LIST = `#graphql
  query VendorProfiles($first: Int!) {
    metaobjects(type: "$app:vendor_profile", first: $first) {
      edges {
        node {
          id handle
          fields { key value }
        }
      }
    }
  }
`;

// ── PRODUCTS ─────────────────────────────────────────────

export const PRODUCTS_LIST = `#graphql
  query Products($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id title status handle
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
          }
          metafield(namespace: "artisanhub", key: "vendor_id") {
            value
          }
        }
      }
    }
  }
`;

export const PRODUCT_GET = `#graphql
  query GetProduct($id: ID!) {
    product(id: $id) {
      id title descriptionHtml status
      tags
      variants(first: 1) {
        edges { node { id price compareAtPrice } }
      }
      featuredImage { url altText }
    }
  }
`;

export const PRODUCT_CREATE = `#graphql
  mutation ProductCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id title handle
        variants(first: 1) { edges { node { id } } }
      }
      userErrors { field message }
    }
  }
`;

export const PRODUCT_UPDATE = `#graphql
  mutation ProductUpdate($id: ID!, $product: ProductUpdateInput!) {
    productUpdate(id: $id, product: $product) {
      product { id title }
      userErrors { field message }
    }
  }
`;

export const PRODUCT_VARIANT_BULK_UPDATE = `#graphql
  mutation ProductVariantsBulkUpdate(
    $productId: ID!
    $variants: [ProductVariantsBulkInput!]!
  ) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }
`;

export const PRODUCT_CREATE_MEDIA = `#graphql
  mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media { ... on MediaImage { id image { url } } }
      mediaUserErrors { field message }
      product { id }
    }
  }
`;

export const PRODUCT_DELETE = `#graphql
  mutation ProductDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors { field message }
    }
  }
`;

export const PRODUCT_METAFIELD_SET = `#graphql
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { key value }
      userErrors { field message }
    }
  }
`;

// ── ORDERS ────────────────────────────────────────────────

export const ORDERS_BY_TAG = `#graphql
  query OrdersByTag($first: Int!, $query: String!) {
    orders(first: $first, query: $query) {
      edges {
        node {
          id name createdAt displayFinancialStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          lineItems(first: 10) {
            edges { node { title quantity } }
          }
        }
      }
    }
  }
`;