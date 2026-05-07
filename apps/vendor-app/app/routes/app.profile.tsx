import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { adminFetch } from "../lib/admin-client";
import {
  VENDOR_PROFILE_CREATE,
  VENDOR_PROFILE_GET,
  VENDOR_PROFILE_UPDATE,
} from "../lib/queries";
import { authenticate } from "../shopify.server";

// ── Types ─────────────────────────────────────────────────

type ProfileField = { key: string; value: string | null };

type GetProfileData = {
  metaobjectByHandle: {
    id: string;
    handle: string;
    fields: ProfileField[];
  } | null;
};

type CreateData = {
  metaobjectCreate: {
    metaobject: { id: string; handle: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

type UpdateData = {
  metaobjectUpdate: {
    metaobject: { id: string; handle: string } | null;
    userErrors: { field: string[]; message: string }[];
  };
};

type ActionResult = { success: boolean; error: string | null };

// ── Helpers ───────────────────────────────────────────────

function shopToHandle(shop: string): string {
  return shop
    .replace(".myshopify.com", "")
    .replace(/[^a-z0-9]/gi, "-")
    .toLowerCase();
}

function fieldValue(fields: ProfileField[], key: string): string {
  return fields.find((f) => f.key === key)?.value ?? "";
}

// ── Loader ────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const handle = shopToHandle(session.shop);

  const data = await adminFetch<GetProfileData>(admin, VENDOR_PROFILE_GET, {
    handle: { type: "$app:vendor_profile", handle },
  });

  return { profile: data.metaobjectByHandle, handle };
};

// ── Action ────────────────────────────────────────────────

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<ActionResult> => {
  const { admin, session } = await authenticate.admin(request);
  const handle = shopToHandle(session.shop);
  const form = await request.formData();

  const profileId = form.get("profileId") as string | null;
  const fields = [
    { key: "name", value: (form.get("name") as string) ?? "" },
    { key: "bio", value: (form.get("bio") as string) ?? "" },
    { key: "country", value: (form.get("country") as string) ?? "" },
    { key: "email", value: (form.get("email") as string) ?? "" },
    { key: "shipping_note", value: (form.get("shipping_note") as string) ?? "" },
    { key: "founded_year", value: (form.get("founded_year") as string) ?? "" },
  ];

  try {
    if (profileId) {
      const result = await adminFetch<UpdateData>(admin, VENDOR_PROFILE_UPDATE, {
        id: profileId,
        metaobject: { fields },
      });
      const errors = result.metaobjectUpdate.userErrors;
      if (errors.length) return { success: false, error: errors[0].message };
    } else {
      const result = await adminFetch<CreateData>(admin, VENDOR_PROFILE_CREATE, {
        metaobject: { type: "$app:vendor_profile", handle, fields },
      });
      const errors = result.metaobjectCreate.userErrors;
      if (errors.length) return { success: false, error: errors[0].message };
    }
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
};

// ── Component ─────────────────────────────────────────────

export default function ProfilePage() {
  const { profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const isSubmitting = navigation.state === "submitting";
  const fields = profile?.fields ?? [];

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      shopify.toast.show("Profile saved");
    } else if (actionData.error) {
      shopify.toast.show(actionData.error, { isError: true });
    }
  }, [actionData, shopify]);

  return (
    <s-page heading="Vendor Profile">
      <Form method="post">
        {profile?.id && (
          <input type="hidden" name="profileId" value={profile.id} />
        )}

        <s-section heading="Public details">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Name"
              name="name"
              value={fieldValue(fields, "name")}
              placeholder="Your shop or brand name"
              required
            />
            <s-text-area
              label="Bio"
              name="bio"
              value={fieldValue(fields, "bio")}
              rows={4}
              placeholder="Tell customers about your story"
            />
            <s-text-field
              label="Country"
              name="country"
              value={fieldValue(fields, "country")}
              placeholder="e.g. Australia"
            />
          </s-stack>
        </s-section>

        <s-section heading="Contact &amp; shipping">
          <s-stack direction="block" gap="base">
            <s-email-field
              label="Email"
              name="email"
              value={fieldValue(fields, "email")}
              placeholder="you@example.com"
              autocomplete="email"
            />
            <s-text-area
              label="Shipping Note"
              name="shipping_note"
              value={fieldValue(fields, "shipping_note")}
              rows={3}
              placeholder="e.g. Ships from Melbourne, 3–5 business days"
            />
            <s-number-field
              label="Founded Year"
              name="founded_year"
              value={fieldValue(fields, "founded_year")}
              min={1800}
              max={2100}
              step={1}
              inputMode="numeric"
            />
          </s-stack>
        </s-section>

        <s-section>
          <s-button
            type="submit"
            variant="primary"
            {...(isSubmitting ? { loading: true } : {})}
          >
            {profile ? "Update profile" : "Create profile"}
          </s-button>
        </s-section>
      </Form>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
