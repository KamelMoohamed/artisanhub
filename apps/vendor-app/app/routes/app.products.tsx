import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { adminFetch } from "../lib/admin-client";
import { PRODUCT_DELETE, PRODUCTS_LIST } from "../lib/queries";
import { authenticate } from "../shopify.server";

// ── Types ─────────────────────────────────────────────────

type Product = {
  id: string;
  title: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  handle: string;
  priceRangeV2: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
};

type ProductsData = {
  products: { edges: { node: Product }[] };
};

type DeleteData = {
  productDelete: {
    deletedProductId: string | null;
    userErrors: { field: string[]; message: string }[];
  };
};

type ActionResult = { success: boolean; error: string | null };

type PendingDelete = { id: string; title: string };

// ── Loader ────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const data = await adminFetch<ProductsData>(admin, PRODUCTS_LIST, {
    first: 50,
  });
  return { products: data.products.edges.map((e) => e.node) };
};

// ── Action ────────────────────────────────────────────────

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "delete") {
    const productId = form.get("productId") as string;
    try {
      const result = await adminFetch<DeleteData>(admin, PRODUCT_DELETE, {
        input: { id: productId },
      });
      const errors = result.productDelete.userErrors;
      if (errors.length) return { success: false, error: errors[0].message };
      return { success: true, error: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Delete failed",
      };
    }
  }

  return { success: false, error: "Unknown action" };
};

// ── Helpers ───────────────────────────────────────────────

function formatPrice(product: Product): string {
  const { amount, currencyCode } = product.priceRangeV2.minVariantPrice;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));
}

function statusTone(
  status: Product["status"],
): "success" | "warning" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "DRAFT") return "warning";
  return "critical";
}

function toTitleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ── Component ─────────────────────────────────────────────

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();
  const deleteFetcher = useFetcher<typeof action>();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );

  const isDeleting = deleteFetcher.state !== "idle";

  // Toast feedback after delete
  useEffect(() => {
    if (!deleteFetcher.data) return;
    if (deleteFetcher.data.success) {
      shopify.toast.show("Product deleted");
      setPendingDelete(null);
    } else if (deleteFetcher.data.error) {
      shopify.toast.show(deleteFetcher.data.error, { isError: true });
    }
  }, [deleteFetcher.data, shopify]);

  function openDeleteModal(product: Product) {
    setPendingDelete({ id: product.id, title: product.title });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteFetcher.submit(
      { intent: "delete", productId: pendingDelete.id },
      { method: "post" },
    );
  }

  return (
    <s-page heading="Products">
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={() => navigate("/app/products/new")}
      >
        New product
      </s-button>

      <s-section>
        {products.length === 0 ? (
          <s-paragraph>
            No products found. Click{" "}
            <s-text type="strong">New product</s-text> to add your first one.
          </s-paragraph>
        ) : (
          <s-table variant="auto">
            <s-table-header-row>
              <s-table-header listSlot="primary">Title</s-table-header>
              <s-table-header listSlot="labeled">Price</s-table-header>
              <s-table-header listSlot="labeled">Status</s-table-header>
              <s-table-header listSlot="labeled">Actions</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {products.map((product) => (
                <s-table-row key={product.id}>
                  <s-table-cell>{product.title}</s-table-cell>
                  <s-table-cell>{formatPrice(product)}</s-table-cell>
                  <s-table-cell>
                    <s-badge tone={statusTone(product.status)}>
                      {toTitleCase(product.status)}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>
                    <s-stack direction="inline" gap="base">
                      <s-button
                        variant="tertiary"
                        onClick={() =>
                          navigate(
                            `/app/products/${product.id.split("/").pop()}`,
                          )
                        }
                      >
                        Edit
                      </s-button>
                      <s-button
                        variant="tertiary"
                        tone="critical"
                        onClick={() => openDeleteModal(product)}
                      >
                        Delete
                      </s-button>
                    </s-stack>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>

      {pendingDelete && (
        <s-modal heading="Delete product" size="base">
          <s-paragraph>
            Delete{" "}
            <s-text type="strong">{pendingDelete.title}</s-text>? This action
            cannot be undone.
          </s-paragraph>
          <s-button
            slot="secondary-action"
            onClick={() => setPendingDelete(null)}
          >
            Cancel
          </s-button>
          <s-button
            slot="primary-action"
            tone="critical"
            variant="primary"
            {...(isDeleting ? { loading: true } : {})}
            onClick={confirmDelete}
          >
            Delete
          </s-button>
        </s-modal>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
