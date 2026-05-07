import { boundary } from "@shopify/shopify-app-react-router/server";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { adminFetch } from "../lib/admin-client";
import { ORDERS_BY_TAG } from "../lib/queries";
import { authenticate } from "../shopify.server";

// ── Types ─────────────────────────────────────────────────

type LineItem = { title: string; quantity: number };

type Order = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  totalPriceSet: {
    shopMoney: { amount: string; currencyCode: string };
  };
  lineItems: { edges: { node: LineItem }[] };
};

type OrdersData = {
  orders: { edges: { node: Order }[] };
};

// ── Helpers ───────────────────────────────────────────────

function shopToHandle(shop: string): string {
  return shop
    .replace(".myshopify.com", "")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTotal(order: Order): string {
  const { amount, currencyCode } = order.totalPriceSet.shopMoney;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

function statusTone(
  status: string,
): "success" | "warning" | "critical" | "info" {
  const s = status.toUpperCase();
  if (s === "PAID") return "success";
  if (s === "PARTIALLY_PAID" || s === "PARTIALLY_REFUNDED") return "warning";
  if (s === "REFUNDED" || s === "VOIDED") return "critical";
  return "info";
}

function formatLineItems(order: Order): string {
  return order.lineItems.edges
    .map(({ node }) => `${node.title} ×${node.quantity}`)
    .join(", ");
}

// ── Loader ────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const handle = shopToHandle(session.shop);

  const data = await adminFetch<OrdersData>(admin, ORDERS_BY_TAG, {
    first: 50,
    query: `tag:vendor-${handle}`,
  });

  return { orders: data.orders.edges.map((e) => e.node), handle };
};

// ── Component ─────────────────────────────────────────────

export default function OrdersPage() {
  const { orders, handle } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Orders">
      <s-section>
        {orders.length === 0 ? (
          <s-stack direction="block" gap="base">
            <s-paragraph>
              No orders found for vendor tag{" "}
              <s-badge tone="info">vendor-{handle}</s-badge>.
            </s-paragraph>
            <s-paragraph>
              Orders are matched by the Shopify tag{" "}
              <s-text type="strong">vendor-{handle}</s-text>. Make sure orders
              are tagged when they contain your products.
            </s-paragraph>
          </s-stack>
        ) : (
          <s-table variant="auto">
            <s-table-header-row>
              <s-table-header listSlot="primary">Order</s-table-header>
              <s-table-header listSlot="labeled">Date</s-table-header>
              <s-table-header listSlot="labeled">Status</s-table-header>
              <s-table-header listSlot="labeled" format="currency">
                Total
              </s-table-header>
              <s-table-header listSlot="labeled">Items</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {orders.map((order) => (
                <s-table-row key={order.id}>
                  <s-table-cell>
                    <s-text type="strong">{order.name}</s-text>
                  </s-table-cell>
                  <s-table-cell>{formatDate(order.createdAt)}</s-table-cell>
                  <s-table-cell>
                    <s-badge tone={statusTone(order.displayFinancialStatus)}>
                      {order.displayFinancialStatus.replace(/_/g, " ")}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>{formatTotal(order)}</s-table-cell>
                  <s-table-cell>{formatLineItems(order)}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>

      <s-section slot="aside" heading="About order tagging">
        <s-paragraph>
          Orders appear here when they carry the tag{" "}
          <s-text type="strong">vendor-{handle}</s-text>. You can apply this
          tag automatically using a Shopify Flow workflow triggered when a
          vendor product is purchased.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
