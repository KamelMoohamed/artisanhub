const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;
const endpoint = `https://${domain}/api/2025-01/graphql.json`;

export async function storeFetch<T>({
  query,
  variables,
  cache = 60,
}: {
  query: string;
  variables?: Record<string, unknown>;
  cache?: number;
}): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: cache },
  });

  const { data, errors } = await response.json();
  if (errors?.length) throw new Error(errors[0].message);
  return data;
}