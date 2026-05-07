export async function adminFetch<T>(
    admin: {
      graphql: (
        query: string,
        options?: { variables: Record<string, unknown> }
      ) => Promise<Response>;
    },
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const response = await admin.graphql(query, { variables: variables ?? {} });
    const json = (await response.json()) as {
      data: T;
      errors?: { message: string }[];
    };
    if (json.errors?.length) throw new Error(json.errors[0].message);
    return json.data;
  }