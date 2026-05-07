/**
 * One-time script: creates the vendor_profile metaobject definition
 * via the Shopify Admin GraphQL API using a private app access token.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/setup-metaobjects.ts
 *
 * Required .env variables:
 *   SHOPIFY_SHOP          e.g. my-store.myshopify.com
 *   SHOPIFY_ACCESS_TOKEN  a private app or custom app Admin API access token
 *                         (needs write_metaobject_definitions scope)
 */

export { };

// ── Config ────────────────────────────────────────────────

const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = "2025-01";

if (!SHOP || !TOKEN) {
  console.error(
    "❌  Missing env vars.\n" +
      "    Set SHOPIFY_SHOP and SHOPIFY_ACCESS_TOKEN in your .env file\n" +
      "    and run:  npx tsx --env-file=.env scripts/setup-metaobjects.ts",
  );
  process.exit(1);
}

const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

// ── GraphQL helpers ───────────────────────────────────────

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("\n"));
  }

  return json.data;
}

// ── Mutation ──────────────────────────────────────────────

const CREATE_DEFINITION = `
  mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        type
        name
        fieldDefinitions {
          name
          key
          type { name }
          required
        }
      }
      userErrors { field message code }
    }
  }
`;

type CreateResult = {
  metaobjectDefinitionCreate: {
    metaobjectDefinition: {
      type: string;
      name: string;
      fieldDefinitions: { name: string; key: string; type: { name: string }; required: boolean }[];
    } | null;
    userErrors: { field: string[]; message: string; code: string }[];
  };
};

// ── Definition ────────────────────────────────────────────

const VENDOR_PROFILE_DEFINITION = {
  type: "vendor_profile",
  name: "Vendor Profile",
  description: "Stores public profile data for each vendor on ArtisanHub",
  access: {
    storefront: "PUBLIC_READ",
  },
  capabilities: {
    publishable: { enabled: true },
  },
  fieldDefinitions: [
    {
      name: "Name",
      key: "name",
      type: "single_line_text_field",
      required: true,
      description: "Vendor or brand display name",
    },
    {
      name: "Bio",
      key: "bio",
      type: "multi_line_text_field",
      required: false,
      description: "Short vendor biography shown on the storefront",
    },
    {
      name: "Country",
      key: "country",
      type: "single_line_text_field",
      required: false,
      description: "Country where the vendor is based",
    },
    {
      name: "Logo",
      key: "logo",
      type: "file_reference",
      required: false,
      description: "Vendor logo image (Shopify Files reference)",
    },
    {
      name: "Shipping Note",
      key: "shipping_note",
      type: "multi_line_text_field",
      required: false,
      description: "Vendor-specific shipping information shown to customers",
    },
    {
      name: "Founded Year",
      key: "founded_year",
      type: "number_integer",
      required: false,
      description: "Year the vendor's business was founded",
    },
    {
      name: "Email",
      key: "email",
      type: "single_line_text_field",
      required: false,
      description: "Public contact email for the vendor",
    },
  ],
};

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log(`\n🔧  Creating vendor_profile metaobject definition on ${SHOP}…\n`);

  const data = await graphql<CreateResult>(CREATE_DEFINITION, {
    definition: VENDOR_PROFILE_DEFINITION,
  });

  const { metaobjectDefinition, userErrors } =
    data.metaobjectDefinitionCreate;

  // Check for "already exists" — safe to treat as a success
  const alreadyExists = userErrors.some((e) => e.code === "TAKEN");

  if (alreadyExists) {
    console.log(
      "⚠️   vendor_profile definition already exists — no changes made.\n" +
        "    Use the Shopify Admin or metaobjectDefinitionUpdate to modify it.",
    );
    process.exit(0);
  }

  if (userErrors.length) {
    console.error("❌  userErrors:");
    userErrors.forEach((e) =>
      console.error(`    [${e.code}] ${e.field?.join(".") ?? ""}: ${e.message}`),
    );
    process.exit(1);
  }

  if (!metaobjectDefinition) {
    console.error("❌  No definition returned — check your access token scopes.");
    process.exit(1);
  }

  console.log(`✅  Created: ${metaobjectDefinition.type} — "${metaobjectDefinition.name}"\n`);
  console.log("    Fields:");
  metaobjectDefinition.fieldDefinitions.forEach((f) => {
    const req = f.required ? " (required)" : "";
    console.log(`      ${f.key.padEnd(16)} ${f.type.name}${req}`);
  });
  console.log(
    "\n💡  Query this type via GraphQL using:\n" +
      '    metaobjects(type: "vendor_profile", first: 10) { ... }\n',
  );
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
