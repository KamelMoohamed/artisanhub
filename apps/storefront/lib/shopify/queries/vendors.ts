// Lightweight query used only for generateStaticParams
export const VENDOR_HANDLES_QUERY = `
  query VendorHandles($first: Int!) {
    metaobjects(type: "vendor_profile", first: $first) {
      edges {
        node { handle }
      }
    }
  }
`;

export const VENDOR_PROFILES_QUERY = `
  query VendorProfiles($first: Int!) {
    metaobjects(type: "vendor_profile", first: $first) {
      edges {
        node {
          id handle
          fields {
            key value
            reference {
              ... on MediaImage { image { url altText } }
            }
          }
        }
      }
    }
  }
`;

export const VENDOR_PROFILE_BY_HANDLE_QUERY = `
  query VendorProfileByHandle($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id handle
      fields {
        key value
        reference {
          ... on MediaImage { image { url altText } }
        }
      }
    }
  }
`;