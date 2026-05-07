import type { FunctionRunResult, RunInput } from "../generated/api";

export function cartDeliveryOptionsTransformRun(input: RunInput): FunctionRunResult {
  const hasFragile = input.cart.deliveryGroups
    .flatMap((group) => group.cartLines)
    .some(
      (line) =>
        line.merchandise.__typename === "ProductVariant" &&
        line.merchandise.product.hasAnyTag
    );

  if (!hasFragile) {
    return { operations: [] };
  }

  const operations = input.cart.deliveryGroups.flatMap((group) =>
    group.deliveryOptions
      .filter((option) => option.title === "Standard Shipping")
      .map((option) => ({
        hide: { deliveryOptionHandle: option.handle },
      }))
  );

  return { operations };
}