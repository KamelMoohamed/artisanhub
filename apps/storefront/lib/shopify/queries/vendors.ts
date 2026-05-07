export const VENDOR_PROFILES_QUERY = `
  query VendorProfiles($first: Int!) {
    metaobjects(type: "vendor_profile", first: $first) {
      edges {
        node {
          id handle
          fields { key value }
        }
      }
    }
  }
`;

export const VENDOR_PROFILE_BY_HANDLE_QUERY = `
  query VendorProfileByHandle($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id handle
      fields { key value }
    }
  }
`;