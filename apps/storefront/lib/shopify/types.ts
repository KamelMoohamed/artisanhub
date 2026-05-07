export interface Money {
    amount: string;
    currencyCode: string;
  }
  
  export interface Image {
    url: string;
    altText: string | null;
  }
  
  export interface ProductVariant {
    id: string;
    title: string;
    availableForSale: boolean;
    price: Money;
    selectedOptions: { name: string; value: string }[];
  }
  
  export interface Product {
    id: string;
    title: string;
    handle: string;
    descriptionHtml?: string;
    vendor: string;
    tags: string[];
    priceRange: {
      minVariantPrice: Money;
    };
    featuredImage: Image | null;
    images?: { edges: { node: Image }[] };
    variants?: { edges: { node: ProductVariant }[] };
    metafield?: { value: string } | null;
  }
  
  export interface Collection {
    id: string;
    title: string;
    handle: string;
    description?: string;
    image?: Image | null;
    products?: { edges: { node: Product }[] };
  }
  
  export interface CartLine {
    id: string;
    quantity: number;
    cost: { totalAmount: Money };
    merchandise: {
      id: string;
      title: string;
      price: Money;
      product: {
        title: string;
        handle: string;
        featuredImage: Image | null;
      };
      selectedOptions: { name: string; value: string }[];
    };
  }
  
  export interface Cart {
    id: string;
    checkoutUrl: string;
    totalQuantity: number;
    cost: {
      totalAmount: Money;
      subtotalAmount: Money;
    };
    lines: { edges: { node: CartLine }[] };
  }
  
  export interface VendorProfileField {
    key: string;
    value: string;
    reference?: {
      image?: { url: string; altText: string | null } | null;
    } | null;
  }

  export interface VendorProfile {
    id: string;
    handle: string;
    fields: VendorProfileField[];
  }