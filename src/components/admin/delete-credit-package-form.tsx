"use client";

export function DeleteCreditPackageForm({
  id,
  name,
  action,
}: {
  id: string;
  name: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete the “${name}” credit package?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-[var(--severity-high)] hover:underline"
      >
        Delete package
      </button>
    </form>
  );
}
