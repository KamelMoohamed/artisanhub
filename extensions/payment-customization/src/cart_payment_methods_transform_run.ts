import type {
  CartPaymentMethodsTransformRunInput,
  CartPaymentMethodsTransformRunResult,
} from "../generated/api";

const ALLOWED_COUNTRY = "AU";
const COD_METHOD_NAME = "Cash on Delivery (COD)";

export function cartPaymentMethodsTransformRun(
  input: CartPaymentMethodsTransformRunInput,
): CartPaymentMethodsTransformRunResult {
  const country =
    input.cart.deliveryGroups[0]?.deliveryAddress?.countryCode;

  // Show all methods if country is AU or unknown
  if (!country || country === ALLOWED_COUNTRY) {
    return { operations: [] };
  }

  const operations = input.paymentMethods
    .filter((method) => method.name === COD_METHOD_NAME)
    .map((method) => ({
      paymentMethodHide: { paymentMethodId: method.id },
    }));

  return { operations };
}
