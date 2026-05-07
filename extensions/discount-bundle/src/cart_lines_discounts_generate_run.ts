import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
  CartInput,
  CartLinesDiscountsGenerateRunResult,
} from "../generated/api";

const BUNDLE_THRESHOLD = 3;
const DISCOUNT_PERCENTAGE = 10;

export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  if (!input.discount.discountClasses.includes(DiscountClass.Product)) {
    return { operations: [] };
  }

  const vendorLines = new Map<string, string[]>();

  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") continue;
    const vendorId = line.merchandise.product.metafield?.value;
    if (!vendorId) continue;

    const ids = vendorLines.get(vendorId) ?? [];
    ids.push(line.id);
    vendorLines.set(vendorId, ids);
  }

  const qualifyingLineIds: string[] = [];
  for (const ids of vendorLines.values()) {
    if (ids.length >= BUNDLE_THRESHOLD) {
      qualifyingLineIds.push(...ids);
    }
  }

  if (qualifyingLineIds.length === 0) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: [
            {
              message: `Bundle deal: ${DISCOUNT_PERCENTAGE}% off when buying ${BUNDLE_THRESHOLD}+ items from the same vendor`,
              targets: qualifyingLineIds.map((id) => ({ cartLine: { id } })),
              value: { percentage: { value: DISCOUNT_PERCENTAGE } },
            },
          ],
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      },
    ],
  };
}
