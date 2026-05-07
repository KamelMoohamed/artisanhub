import type { ActionFunctionArgs } from "react-router";
import db from "../db.server";
import { authenticate } from "../shopify.server";

// ── Webhook payload shapes (Shopify REST format) ──────────

interface OrderLineItem {
  id: number;
  title: string;
  quantity: number;
  product_id: number | null;
  vendor: string;
}

interface OrdersCreatePayload {
  id: number;
  name: string;         // e.g. "#1001"
  created_at: string;
  financial_status: string;
  total_price: string;
  currency: string;
  tags: string;         // comma-separated string, NOT an array
  line_items: OrderLineItem[];
}

interface ProductsUpdatePayload {
  id: number;
  title: string;
  handle: string;
  status: string;
  tags: string;
}

// ── Helpers ───────────────────────────────────────────────

/** Parse "vendor-my-shop, handmade" → ["my-shop"] */
function extractVendorHandles(tagsString: string): string[] {
  return tagsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.startsWith("vendor-"))
    .map((t) => t.replace(/^vendor-/, ""));
}

async function storeNotification(params: {
  shop: string;
  topic: string;
  referenceId: string;
  vendorHandle?: string;
  summary: string;
  payload: unknown;
}): Promise<void> {
  await db.notification.create({
    data: {
      shop: params.shop,
      topic: params.topic,
      referenceId: params.referenceId,
      vendorHandle: params.vendorHandle ?? null,
      summary: params.summary,
      payload: JSON.stringify(params.payload),
    },
  });
}

// ── ORDERS_CREATE handler ─────────────────────────────────

async function handleOrdersCreate(
  shop: string,
  payload: OrdersCreatePayload,
): Promise<void> {
  const vendorHandles = extractVendorHandles(payload.tags);

  const lineItemsSummary = payload.line_items
    .map((li) => `${li.title} ×${li.quantity}`)
    .join(", ");

  console.log(
    `[ORDERS_CREATE] shop=${shop} order=${payload.name} ` +
      `vendors=[${vendorHandles.join(", ")}] ` +
      `total=${payload.total_price} ${payload.currency} ` +
      `items=${lineItemsSummary}`,
  );

  // Store one notification per vendor tag found on the order so each
  // vendor's notification inbox stays scoped to their own handle.
  if (vendorHandles.length > 0) {
    await Promise.all(
      vendorHandles.map((handle) =>
        storeNotification({
          shop,
          topic: "ORDERS_CREATE",
          referenceId: String(payload.id),
          vendorHandle: handle,
          summary: `New order ${payload.name} — ${payload.total_price} ${payload.currency} (${payload.financial_status})`,
          payload,
        }),
      ),
    );
  } else {
    // No vendor tag — store an unscoped notification for admin awareness.
    await storeNotification({
      shop,
      topic: "ORDERS_CREATE",
      referenceId: String(payload.id),
      summary: `New order ${payload.name} — no vendor tag found`,
      payload,
    });
  }
}

// ── PRODUCTS_UPDATE handler ───────────────────────────────

const VENDOR_ID_QUERY = `#graphql
  query GetProductVendorMetafield($id: ID!) {
    product(id: $id) {
      title
      vendorId: metafield(namespace: "artisanhub", key: "vendor_id") {
        value
      }
    }
  }
`;

type VendorMetafieldData = {
  product: {
    title: string;
    vendorId: { value: string } | null;
  } | null;
};

async function handleProductsUpdate(
  shop: string,
  admin:
    | {
        graphql: (
          query: string,
          options?: { variables: Record<string, unknown> }
        ) => Promise<Response>;
      }
    | undefined,
  payload: ProductsUpdatePayload,
): Promise<void> {
  const gid = `gid://shopify/Product/${payload.id}`;

  console.log(
    `[PRODUCTS_UPDATE] shop=${shop} product="${payload.title}" handle=${payload.handle} status=${payload.status}`,
  );

  if (!admin) {
    console.warn(
      `[PRODUCTS_UPDATE] No admin session for ${shop} — skipping metafield check`,
    );
    return;
  }

  // Verify the vendor_id metafield is still present.
  let vendorHandle: string | undefined;
  try {
    const res = await admin.graphql(VENDOR_ID_QUERY, {
      variables: { id: gid },
    });
    const json = (await res.json()) as { data: VendorMetafieldData };
    vendorHandle = json.data.product?.vendorId?.value ?? undefined;
  } catch (err) {
    console.error(`[PRODUCTS_UPDATE] Metafield check failed for ${gid}:`, err);
  }

  if (vendorHandle) {
    console.log(
      `[PRODUCTS_UPDATE] vendor_id intact: ${vendorHandle} on product ${payload.handle}`,
    );
    await storeNotification({
      shop,
      topic: "PRODUCTS_UPDATE",
      referenceId: String(payload.id),
      vendorHandle,
      summary: `Product "${payload.title}" updated — vendor_id present`,
      payload,
    });
  } else {
    console.warn(
      `[PRODUCTS_UPDATE] vendor_id MISSING on product ${payload.handle} (${shop}) — manual re-sync needed`,
    );
    await storeNotification({
      shop,
      topic: "PRODUCTS_UPDATE",
      referenceId: String(payload.id),
      summary: `Product "${payload.title}" updated — vendor_id metafield is MISSING`,
      payload,
    });
  }
}

// ── Action ────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[webhook] ${topic} for ${shop}`);

  try {
    switch (topic) {
      case "ORDERS_CREATE":
        await handleOrdersCreate(shop, payload as OrdersCreatePayload);
        break;

      case "PRODUCTS_UPDATE":
        await handleProductsUpdate(
          shop,
          admin as Parameters<typeof handleProductsUpdate>[1],
          payload as ProductsUpdatePayload,
        );
        break;

      default:
        console.warn(`[webhook] Unhandled topic: ${topic}`);
    }
  } catch (err) {
    // Log but always return 200 — Shopify retries on non-2xx responses
    // which can flood the queue with duplicate events.
    console.error(`[webhook] Handler error for ${topic}:`, err);
  }

  return new Response(null, { status: 200 });
};
