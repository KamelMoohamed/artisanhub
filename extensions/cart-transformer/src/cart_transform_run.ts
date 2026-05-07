import type {
  CartTransformRunInput,
  CartTransformRunResult,
} from "../generated/api";

/**
 * Cart Transform: prefix each cart line title with its vendor label
 * so items are visually grouped by vendor in checkout.
 *
 * Example: "Blue Vase" from vendor-egypt-ceramics → "[Egypt Ceramics] Blue Vase"
 *
 * NOTE: quantity-capping (remove/update-quantity) is not available in the
 * Cart Transform API. Use Cart and Checkout Validation for that.
 */
export function cartTransformRun(
  input: CartTransformRunInput,
): CartTransformRunResult {
  const operations: CartTransformRunResult["operations"] = [];

  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;

    const vendorId = line.merchandise.product.metafield?.value;
    if (!vendorId) continue;

    const vendorLabel = vendorId
      .replace(/^vendor-/, "")
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const productTitle = line.merchandise.product.title;
    const variantTitle = line.merchandise.title;

    const fullTitle =
      variantTitle && variantTitle !== "Default Title"
        ? `[${vendorLabel}] ${productTitle} – ${variantTitle}`
        : `[${vendorLabel}] ${productTitle}`;

    operations.push({
      lineUpdate: {
        cartLineId: line.id,
        title: fullTitle,
      },
    });
  }

  return { operations };
}
