/**
 * Seed script: creates vendor profiles, products, and collections.
 *
 * Prerequisites:
 *   1. Run `npm run setup:metaobjects` first to create the vendor_profile definition.
 *   2. Set env vars in .env (same as setup-metaobjects.ts).
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/seed.ts
 *   npm run seed
 *
 * Required .env variables:
 *   SHOPIFY_SHOP          e.g. my-store.myshopify.com
 *   SHOPIFY_ACCESS_TOKEN  Admin API access token (write_products, write_metaobjects,
 *                         write_collections scopes required)
 */

export {};

// ── Config ────────────────────────────────────────────────

const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = "2025-01";

if (!SHOP || !TOKEN) {
  console.error(
    "❌  Missing env vars. Set SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN in .env\n" +
      "    then run:  npx tsx --env-file=.env scripts/seed.ts",
  );
  process.exit(1);
}

const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

// ── GraphQL client ────────────────────────────────────────

async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    data: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length)
    throw new Error(json.errors.map((e) => e.message).join("\n"));
  return json.data;
}

// ── Mutations ─────────────────────────────────────────────

const METAOBJECT_CREATE = `
  mutation MetaobjectCreate($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }
`;

const PRODUCT_CREATE = `
  mutation ProductCreate($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        id title
        variants(first: 1) { edges { node { id } } }
      }
      userErrors { field message }
    }
  }
`;

const VARIANT_UPDATE = `
  mutation VariantUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id price compareAtPrice }
      userErrors { field message }
    }
  }
`;

const METAFIELDS_SET = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { key value }
      userErrors { field message }
    }
  }
`;

const COLLECTION_CREATE = `
  mutation CollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection { id title }
      userErrors { field message }
    }
  }
`;

const COLLECTION_ADD_PRODUCTS = `
  mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection { id title productsCount { count } }
      userErrors { field message }
    }
  }
`;

// ── Seed data ─────────────────────────────────────────────

interface VendorSeed {
  handle: string;
  fields: { key: string; value: string }[];
}

interface ProductSeed {
  vendorHandle: string;
  title: string;
  descriptionHtml: string;
  status: "ACTIVE" | "DRAFT";
  tags: string[];
  price: string;
  compareAtPrice?: string;
  collectionKey: string; // maps to COLLECTIONS array
}

const VENDORS: VendorSeed[] = [
  {
    handle: "nile-ceramics",
    fields: [
      { key: "name", value: "Nile Ceramics Studio" },
      {
        key: "bio",
        value:
          "Family-run ceramics studio based in Cairo, Egypt. Three generations of artisans hand-painting traditional Nubian patterns on locally sourced clay. Every piece is kiln-fired and food-safe.",
      },
      { key: "country", value: "Egypt" },
      { key: "email", value: "hello@nile-ceramics.com" },
      {
        key: "shipping_note",
        value:
          "Ships from Cairo. Fragile items are wrapped in recycled paper and double-boxed. Allow 10–14 business days for international delivery.",
      },
      { key: "founded_year", value: "2008" },
    ],
  },
  {
    handle: "la-toile",
    fields: [
      { key: "name", value: "La Toile de Lin" },
      {
        key: "bio",
        value:
          "Artisan linen house from the Normandy coast of France. We weave, stonewash, and naturally dye our fabrics using plant-based pigments. Our linen is OEKO-TEX certified and sustainably farmed.",
      },
      { key: "country", value: "France" },
      { key: "email", value: "bonjour@la-toile.fr" },
      {
        key: "shipping_note",
        value:
          "Ships from Rouen, France. Allow 7–10 business days to Australia. Orders over $150 ship free.",
      },
      { key: "founded_year", value: "2015" },
    ],
  },
  {
    handle: "outback-hide",
    fields: [
      { key: "name", value: "Outback Hide Co." },
      {
        key: "bio",
        value:
          "Premium leather goods handcrafted in the Grampians region of Victoria, Australia. We use full-grain vegetable-tanned hides sourced from Australian cattle farms, hand-finished with natural beeswax.",
      },
      { key: "country", value: "Australia" },
      { key: "email", value: "info@outbackhide.com.au" },
      {
        key: "shipping_note",
        value:
          "Ships from Melbourne. 3–5 business days within Australia, 10–14 days internationally. All orders tracked.",
      },
      { key: "founded_year", value: "2019" },
    ],
  },
];

const PRODUCTS: ProductSeed[] = [
  // ── Nile Ceramics ────────────────────────────────────────
  {
    vendorHandle: "nile-ceramics",
    collectionKey: "ceramics",
    title: "Hand-painted Ceramic Bowl",
    descriptionHtml:
      "<p>A wide-rimmed ceramic bowl adorned with traditional Nubian motifs in cobalt and terracotta. Hand-painted and kiln-fired in Cairo. Food-safe glaze. Each piece is unique.</p>",
    status: "ACTIVE",
    price: "45.00",
    compareAtPrice: "60.00",
    // 'fragile' tag is required for Shopify Function testing
    tags: ["ceramics", "handmade", "fragile", "kitchen", "vendor-nile-ceramics"],
  },
  {
    vendorHandle: "nile-ceramics",
    collectionKey: "ceramics",
    title: "Blue Lotus Vase",
    descriptionHtml:
      "<p>Tall hand-thrown vase inspired by the blue lotus of the Nile. Decorated with a repeat lotus motif in cobalt blue glaze. Perfect for dried or fresh flowers.</p>",
    status: "ACTIVE",
    price: "65.00",
    tags: ["ceramics", "handmade", "fragile", "home-decor", "vendor-nile-ceramics"],
  },
  {
    vendorHandle: "nile-ceramics",
    collectionKey: "ceramics",
    title: "Geometric Tile Set (Pack of 6)",
    descriptionHtml:
      "<p>Set of six hand-painted terracotta tiles with interlocking geometric patterns. Suitable for kitchen splashbacks or decorative wall installations. Each tile measures 15×15 cm.</p>",
    status: "ACTIVE",
    price: "89.00",
    tags: ["ceramics", "handmade", "tiles", "home-decor", "vendor-nile-ceramics"],
  },
  {
    vendorHandle: "nile-ceramics",
    collectionKey: "ceramics",
    title: "Clay Tea Set for Two",
    descriptionHtml:
      "<p>Traditional Egyptian clay tea set including a teapot, two cups, and a small tray. Unglazed exterior for heat retention; food-safe glazed interior. Fragile — packaged with extra care.</p>",
    status: "ACTIVE",
    price: "120.00",
    tags: ["ceramics", "handmade", "fragile", "kitchen", "tea", "vendor-nile-ceramics"],
  },
  {
    vendorHandle: "nile-ceramics",
    collectionKey: "ceramics",
    title: "Mosaic Wall Plate",
    descriptionHtml:
      "<p>Decorative ceramic wall plate featuring an intricate mosaic of hand-cut coloured tiles set in white grout. Includes hanging hardware. Limited run — coming soon.</p>",
    status: "DRAFT",
    price: "55.00",
    tags: ["ceramics", "handmade", "fragile", "home-decor", "vendor-nile-ceramics"],
  },

  // ── La Toile ─────────────────────────────────────────────
  {
    vendorHandle: "la-toile",
    collectionKey: "textiles",
    title: "Stonewashed Linen Throw",
    descriptionHtml:
      "<p>Generously sized linen throw (140×200 cm) in natural undyed flax. Stonewashed for instant softness. Gets better with every wash. OEKO-TEX certified.</p>",
    status: "ACTIVE",
    price: "95.00",
    compareAtPrice: "120.00",
    tags: ["textiles", "linen", "home-decor", "sustainable", "vendor-la-toile"],
  },
  {
    vendorHandle: "la-toile",
    collectionKey: "textiles",
    title: "Natural Linen Curtain Panel",
    descriptionHtml:
      "<p>Rod-pocket linen curtain in raw natural flax (250 cm drop, 140 cm wide). Semi-sheer for diffused light. Sold as a single panel. Rod not included.</p>",
    status: "ACTIVE",
    price: "75.00",
    tags: ["textiles", "linen", "home-decor", "vendor-la-toile"],
  },
  {
    vendorHandle: "la-toile",
    collectionKey: "textiles",
    title: "Organic Linen Tote Bag",
    descriptionHtml:
      "<p>Market tote woven from certified organic linen. Reinforced straps, interior pocket, and natural beeswax lining at the base. Holds up to 8 kg comfortably.</p>",
    status: "ACTIVE",
    price: "35.00",
    tags: ["textiles", "linen", "accessories", "sustainable", "vendor-la-toile"],
  },
  {
    vendorHandle: "la-toile",
    collectionKey: "textiles",
    title: "Herbal-dyed Cushion Cover",
    descriptionHtml:
      "<p>50×50 cm cushion cover dyed with a blend of weld, madder root, and indigo from the Normandy herb garden. No two covers are exactly alike. Zip closure; insert not included.</p>",
    status: "ACTIVE",
    price: "55.00",
    tags: ["textiles", "linen", "home-decor", "natural-dye", "vendor-la-toile"],
  },

  // ── Outback Hide ─────────────────────────────────────────
  {
    vendorHandle: "outback-hide",
    collectionKey: "leather",
    title: "Hand-stitched Leather Wallet",
    descriptionHtml:
      "<p>Slim bifold wallet hand-stitched in full-grain vegetable-tanned leather. Six card slots, two note compartments. Develops a rich patina with use. Made to last decades.</p>",
    status: "ACTIVE",
    price: "85.00",
    tags: ["leather", "accessories", "handmade", "wallet", "vendor-outback-hide"],
  },
  {
    vendorHandle: "outback-hide",
    collectionKey: "leather",
    title: "Leather Journal Cover",
    descriptionHtml:
      "<p>A5 journal cover in natural saddle leather. Wraparound strap closure, pen loop, and two interior pockets. Fits standard A5 notebooks. Journal not included.</p>",
    status: "ACTIVE",
    price: "65.00",
    tags: ["leather", "stationery", "handmade", "vendor-outback-hide"],
  },
  {
    vendorHandle: "outback-hide",
    collectionKey: "leather",
    title: "Wide-brim Leather Hat",
    descriptionHtml:
      "<p>Sun hat with a 10 cm brim, hand-shaped from a single piece of oil-tanned cowhide. Internal sweatband and chin strap included. Sizes S–XL available. Water-resistant finish.</p>",
    status: "ACTIVE",
    price: "185.00",
    compareAtPrice: "220.00",
    tags: ["leather", "accessories", "handmade", "hat", "vendor-outback-hide"],
  },
  {
    vendorHandle: "outback-hide",
    collectionKey: "leather",
    title: "Leather Card Holder",
    descriptionHtml:
      "<p>Minimalist card holder stamped with the Outback Hide brand mark. Holds 4–8 cards. Made from the same full-grain leather as our wallets. Great gift option.</p>",
    status: "ACTIVE",
    price: "45.00",
    tags: ["leather", "accessories", "handmade", "vendor-outback-hide"],
  },
];

const COLLECTIONS: { key: string; title: string; descriptionHtml: string }[] = [
  {
    key: "ceramics",
    title: "Ceramics",
    descriptionHtml:
      "<p>Hand-thrown and hand-painted ceramics from artisan studios around the world. Each piece is one of a kind.</p>",
  },
  {
    key: "textiles",
    title: "Textiles",
    descriptionHtml:
      "<p>Sustainably woven, naturally dyed linens and fabrics from independent textile makers.</p>",
  },
  {
    key: "leather",
    title: "Leather Goods",
    descriptionHtml:
      "<p>Full-grain, vegetable-tanned leather pieces made to last a lifetime. Ethically sourced and hand-finished.</p>",
  },
];

// ── Step helpers ──────────────────────────────────────────

type UserError = { field: string[]; message: string; code?: string };

function logErrors(label: string, errors: UserError[]): void {
  errors.forEach((e) =>
    console.warn(`    ⚠️  ${label} — ${e.field?.join(".") ?? ""}: ${e.message}`),
  );
}

async function createVendorProfile(
  vendor: VendorSeed,
): Promise<string | null> {
  type R = {
    metaobjectCreate: {
      metaobject: { id: string; handle: string } | null;
      userErrors: UserError[];
    };
  };
  const data = await gql<R>(METAOBJECT_CREATE, {
    metaobject: {
      type: "vendor_profile",
      handle: vendor.handle,
      fields: vendor.fields,
    },
  });
  const { metaobject, userErrors } = data.metaobjectCreate;

  if (userErrors.some((e) => e.code === "TAKEN")) {
    console.log(`  ↩  vendor_profile "${vendor.handle}" already exists — skipped`);
    return null;
  }
  if (userErrors.length) {
    logErrors(`vendor ${vendor.handle}`, userErrors);
    return null;
  }
  console.log(`  ✅  vendor_profile created: ${metaobject!.handle}`);
  return metaobject!.id;
}

async function createProduct(
  product: ProductSeed,
): Promise<{ productId: string; variantId: string } | null> {
  type R = {
    productCreate: {
      product: {
        id: string;
        title: string;
        variants: { edges: { node: { id: string } }[] };
      } | null;
      userErrors: UserError[];
    };
  };
  const data = await gql<R>(PRODUCT_CREATE, {
    product: {
      title: product.title,
      descriptionHtml: product.descriptionHtml,
      status: product.status,
      tags: product.tags,
    },
  });
  const { product: created, userErrors } = data.productCreate;

  if (userErrors.length) {
    logErrors(`product "${product.title}"`, userErrors);
    return null;
  }
  const variantId = created!.variants.edges[0]?.node.id;
  if (!variantId) {
    console.warn(`  ⚠️  No variant returned for "${product.title}"`);
    return null;
  }
  return { productId: created!.id, variantId };
}

async function setVariantPrice(
  productId: string,
  variantId: string,
  price: string,
  compareAtPrice?: string,
): Promise<void> {
  type R = {
    productVariantsBulkUpdate: {
      productVariants: { id: string }[];
      userErrors: UserError[];
    };
  };
  const variantInput: Record<string, string> = { id: variantId, price };
  if (compareAtPrice) variantInput.compareAtPrice = compareAtPrice;

  const data = await gql<R>(VARIANT_UPDATE, {
    productId,
    variants: [variantInput],
  });
  if (data.productVariantsBulkUpdate.userErrors.length) {
    logErrors("variant price", data.productVariantsBulkUpdate.userErrors);
  }
}

async function linkVendorMetafield(
  productId: string,
  vendorHandle: string,
): Promise<void> {
  type R = {
    metafieldsSet: {
      metafields: { key: string }[] | null;
      userErrors: UserError[];
    };
  };
  const data = await gql<R>(METAFIELDS_SET, {
    metafields: [
      {
        ownerId: productId,
        namespace: "artisanhub",
        key: "vendor_id",
        value: vendorHandle,
        type: "single_line_text_field",
      },
    ],
  });
  if (data.metafieldsSet.userErrors.length) {
    logErrors("vendor metafield", data.metafieldsSet.userErrors);
  }
}

async function createCollection(col: {
  title: string;
  descriptionHtml: string;
}): Promise<string | null> {
  type R = {
    collectionCreate: {
      collection: { id: string; title: string } | null;
      userErrors: UserError[];
    };
  };
  const data = await gql<R>(COLLECTION_CREATE, {
    input: { title: col.title, descriptionHtml: col.descriptionHtml },
  });
  const { collection, userErrors } = data.collectionCreate;
  if (userErrors.length) {
    logErrors(`collection "${col.title}"`, userErrors);
    return null;
  }
  console.log(`  ✅  collection created: ${collection!.title}`);
  return collection!.id;
}

async function addProductsToCollection(
  collectionId: string,
  productIds: string[],
): Promise<void> {
  type R = {
    collectionAddProducts: {
      collection: { title: string; productsCount: { count: number } } | null;
      userErrors: UserError[];
    };
  };
  const data = await gql<R>(COLLECTION_ADD_PRODUCTS, {
    id: collectionId,
    productIds,
  });
  const { collection, userErrors } = data.collectionAddProducts;
  if (userErrors.length) {
    logErrors("collectionAddProducts", userErrors);
    return;
  }
  console.log(
    `  ✅  ${collection!.productsCount.count} product(s) in "${collection!.title}"`,
  );
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log(`\n🌱  Seeding ArtisanHub on ${SHOP}\n`);

  // ── 1. Vendor profiles ───────────────────────────────────
  console.log("── Vendor profiles ─────────────────────────────────────");
  for (const vendor of VENDORS) {
    await createVendorProfile(vendor);
  }

  // ── 2. Products ──────────────────────────────────────────
  console.log("\n── Products ────────────────────────────────────────────");
  const productsByCollection = new Map<string, string[]>();

  for (const product of PRODUCTS) {
    process.stdout.write(`  Creating "${product.title}"… `);

    const result = await createProduct(product);
    if (!result) {
      console.log("skipped");
      continue;
    }
    const { productId, variantId } = result;

    await setVariantPrice(
      productId,
      variantId,
      product.price,
      product.compareAtPrice,
    );

    await linkVendorMetafield(productId, product.vendorHandle);

    const existing = productsByCollection.get(product.collectionKey) ?? [];
    productsByCollection.set(product.collectionKey, [...existing, productId]);

    const fragileNote = product.tags.includes("fragile") ? " 📦 fragile" : "";
    console.log(
      `✅  $${product.price} · ${product.status}${fragileNote}`,
    );
  }

  // ── 3. Collections ───────────────────────────────────────
  console.log("\n── Collections ─────────────────────────────────────────");
  for (const col of COLLECTIONS) {
    const collectionId = await createCollection(col);
    if (!collectionId) continue;

    const productIds = productsByCollection.get(col.key) ?? [];
    if (productIds.length === 0) {
      console.log(`  ⚠️   No products to add to "${col.title}"`);
      continue;
    }
    await addProductsToCollection(collectionId, productIds);
  }

  // ── Summary ──────────────────────────────────────────────
  const totalProducts = [...productsByCollection.values()].reduce(
    (n, ids) => n + ids.length,
    0,
  );
  const fragileCount = PRODUCTS.filter((p) => p.tags.includes("fragile")).length;

  console.log(`
✨  Seed complete
    Vendors:     ${VENDORS.length}
    Products:    ${totalProducts} (${fragileCount} tagged fragile)
    Collections: ${COLLECTIONS.length}

💡  Next steps:
    • Open your Shopify Admin → Products to verify the seed data.
    • Fragile products are tagged with "fragile" for Shopify Function cart validation testing.
    • Vendor tags (vendor-<handle>) are set on each product for order filtering.
`);
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
