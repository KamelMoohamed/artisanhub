import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
} from "react-router";
import { adminFetch } from "../lib/admin-client";
import {
  PRODUCT_CREATE,
  PRODUCT_CREATE_MEDIA,
  PRODUCT_GET,
  PRODUCT_METAFIELD_SET,
  PRODUCT_UPDATE,
  PRODUCT_VARIANT_BULK_UPDATE,
} from "../lib/queries";
import { authenticate } from "../shopify.server";

// ── Types ─────────────────────────────────────────────────

type Variant = { id: string; price: string; compareAtPrice: string | null };

type ProductData = {
  id: string;
  title: string;
  descriptionHtml: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  tags: string[];
  variants: { edges: { node: Variant }[] };
  featuredImage: { url: string; altText: string | null } | null;
};

type GetProductData = { product: ProductData | null };

type CreateData = {
  productCreate: {
    product: {
      id: string;
      handle: string;
      variants: { edges: { node: { id: string } }[] };
    } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

type UpdateData = {
  productUpdate: {
    product: { id: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

type VariantBulkUpdateData = {
  productVariantsBulkUpdate: {
    productVariants: { id: string; price: string }[];
    userErrors: { field: string[]; message: string }[];
  };
};

type MetafieldsSetData = {
  metafieldsSet: {
    metafields: { key: string }[] | null;
    userErrors: { field: string[]; message: string }[];
  };
};

type ActionResult = {
  success: boolean;
  error: string | null;
  newProductId?: string;
};

// ── Helpers ───────────────────────────────────────────────

function gidToNumericId(gid: string): string {
  return gid.split("/").pop() ?? gid;
}

function numericIdToGid(id: string): string {
  return `gid://shopify/Product/${id}`;
}

function shopToHandle(shop: string): string {
  return shop
    .replace(".myshopify.com", "")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
}

// ── Loader ────────────────────────────────────────────────

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const { id } = params;

  if (!id || id === "new") {
    return { product: null };
  }

  const data = await adminFetch<GetProductData>(admin, PRODUCT_GET, {
    id: numericIdToGid(id),
  });

  if (!data.product) {
    throw new Response("Product not found", { status: 404 });
  }

  return { product: data.product };
};

// ── Action ────────────────────────────────────────────────

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const vendorHandle = shopToHandle(session.shop);

  const productId = form.get("productId") as string | null;
  const variantId = form.get("variantId") as string | null;
  const title = (form.get("title") as string) ?? "";
  const descriptionHtml = (form.get("descriptionHtml") as string) ?? "";
  const status = (form.get("status") as string) ?? "DRAFT";
  const tagsRaw = (form.get("tags") as string) ?? "";
  const price = (form.get("price") as string) ?? "0.00";
  const compareAtPrice = (form.get("compareAtPrice") as string) || null;
  const imageUrl = (form.get("imageUrl") as string) || null;

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    let resolvedProductId: string;
    let resolvedVariantId: string;

    if (productId) {
      // ── Update ──────────────────────────────────────────
      const updateResult = await adminFetch<UpdateData>(admin, PRODUCT_UPDATE, {
        id: productId,
        product: { title, descriptionHtml, status, tags },
      });
      const errors = updateResult.productUpdate.userErrors;
      if (errors.length) return { success: false, error: errors[0].message };

      resolvedProductId = productId;
      resolvedVariantId = variantId!;
    } else {
      // ── Create ──────────────────────────────────────────
      const media =
        imageUrl
          ? [{ mediaContentType: "IMAGE", originalSource: imageUrl }]
          : [];

      const createResult = await adminFetch<CreateData>(admin, PRODUCT_CREATE, {
        product: { title, descriptionHtml, status, tags },
        media,
      });
      const errors = createResult.productCreate?.userErrors ?? [];
      if (errors.length) return { success: false, error: errors[0].message };
      if (!createResult.productCreate?.product)
        return { success: false, error: "Product creation failed" };

      resolvedProductId = createResult.productCreate.product.id;
      resolvedVariantId =
        createResult.productCreate.product.variants.edges[0]?.node.id ?? "";
    }

    // ── Variant price ────────────────────────────────────
    if (resolvedVariantId) {
      const variantInput: Record<string, unknown> = {
        id: resolvedVariantId,
        price,
      };
      if (compareAtPrice) variantInput.compareAtPrice = compareAtPrice;

      const variantResult = await adminFetch<VariantBulkUpdateData>(
        admin,
        PRODUCT_VARIANT_BULK_UPDATE,
        {
          productId: resolvedProductId,
          variants: [variantInput],
        },
      );
      const variantErrors =
        variantResult.productVariantsBulkUpdate.userErrors;
      if (variantErrors.length)
        return { success: false, error: variantErrors[0].message };
    }

    // ── Vendor metafield ─────────────────────────────────
    const metaResult = await adminFetch<MetafieldsSetData>(
      admin,
      PRODUCT_METAFIELD_SET,
      {
        metafields: [
          {
            ownerId: resolvedProductId,
            namespace: "artisanhub",
            key: "vendor_id",
            value: vendorHandle,
            type: "single_line_text_field",
          },
        ],
      },
    );
    const metaErrors = metaResult.metafieldsSet.userErrors;
    if (metaErrors.length)
      return { success: false, error: metaErrors[0].message };

    // ── New image on update ──────────────────────────────
    if (productId && imageUrl) {
      await adminFetch(admin, PRODUCT_CREATE_MEDIA, {
        productId: resolvedProductId,
        media: [{ mediaContentType: "IMAGE", originalSource: imageUrl }],
      });
    }

    return {
      success: true,
      error: null,
      ...(productId ? {} : { newProductId: gidToNumericId(resolvedProductId) }),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
};

// ── Component ─────────────────────────────────────────────

export default function ProductFormPage() {
  const { product } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";

  const isSubmitting = navigation.state === "submitting";
  const variant = product?.variants.edges[0]?.node;

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      shopify.toast.show(isNew ? "Product created" : "Product saved");
      if (isNew && actionData.newProductId) {
        navigate(`/app/products/${actionData.newProductId}`, { replace: true });
      }
    } else if (actionData.error) {
      shopify.toast.show(actionData.error, { isError: true });
    }
  }, [actionData, shopify, isNew, navigate]);

  return (
    <s-page heading={isNew ? "New product" : "Edit product"}>
      <s-button
        slot="secondary-action"
        variant="tertiary"
        onClick={() => navigate("/app/products")}
      >
        ← Back to products
      </s-button>

      <Form method="post">
        {product?.id && (
          <input type="hidden" name="productId" value={product.id} />
        )}
        {variant?.id && (
          <input type="hidden" name="variantId" value={variant.id} />
        )}

        {/* ── Product details ── */}
        <s-section heading="Product details">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Title"
              name="title"
              value={product?.title ?? ""}
              placeholder="Short sleeve t-shirt"
              required
            />
            <s-text-area
              label="Description"
              name="descriptionHtml"
              value={product?.descriptionHtml ?? ""}
              rows={6}
              placeholder="Describe your product..."
            />
            <s-select
              label="Status"
              name="status"
              value={product?.status ?? "DRAFT"}
            >
              <s-option value="ACTIVE">Active</s-option>
              <s-option value="DRAFT">Draft</s-option>
              <s-option value="ARCHIVED">Archived</s-option>
            </s-select>
            <s-text-field
              label="Tags"
              name="tags"
              value={product?.tags.join(", ") ?? ""}
              placeholder="handmade, artisan, gifts"
            />
          </s-stack>
        </s-section>

        {/* ── Pricing ── */}
        <s-section heading="Pricing">
          <s-stack direction="block" gap="base">
            <s-number-field
              label="Price"
              name="price"
              value={variant?.price ?? ""}
              min={0}
              step={0.01}
              inputMode="decimal"
              required
            />
            <s-number-field
              label="Compare-at price"
              name="compareAtPrice"
              value={variant?.compareAtPrice ?? ""}
              min={0}
              step={0.01}
              inputMode="decimal"
            />
          </s-stack>
        </s-section>

        {/* ── Media ── */}
        <s-section heading="Media">
          <s-stack direction="block" gap="base">
            {product?.featuredImage && (
              <s-image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText ?? product.title}
                aspectRatio="1/1"
                objectFit="contain"
              />
            )}
            <s-url-field
              label={
                product?.featuredImage
                  ? "Replace image (URL)"
                  : "Image URL"
              }
              name="imageUrl"
              placeholder="https://example.com/image.jpg"
              autocomplete="off"
            />
          </s-stack>
        </s-section>

        {/* ── Save ── */}
        <s-section>
          <s-button
            type="submit"
            variant="primary"
            {...(isSubmitting ? { loading: true } : {})}
          >
            {isNew ? "Create product" : "Save product"}
          </s-button>
        </s-section>
      </Form>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
