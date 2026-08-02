"use client";

import { revokeAccountApiKeyAction } from "@/app/account/api-keys/actions";

export function RevokeAccountApiKeyForm({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <form
      action={revokeAccountApiKeyAction}
      onSubmit={(event) => {
        if (!window.confirm(`Revoke the API key “${label}”?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm text-[var(--severity-high)] hover:underline"
      >
        Revoke
      </button>
    </form>
  );
}
