import Link from "next/link";
import {
  AdminPage,
  AdminPanel,
  AdminSection,
} from "@/components/admin/admin-page";
import { DeleteCreditPackageForm } from "@/components/admin/delete-credit-package-form";
import { prisma } from "@/lib/db";
import {
  createCreditPackageAction,
  deleteCreditPackageAction,
  updateCreditPackageAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Credit packages · Jiddu",
  robots: { index: false, follow: false },
};

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function CreditPackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [packages, query] = await Promise.all([
    prisma.jidduCreditPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
    }),
    searchParams,
  ]);
  const message = query.created
    ? "Package created."
    : query.updated
      ? "Package updated."
      : query.deleted
        ? "Package deleted."
        : query.error === "not_found"
          ? "That package no longer exists."
          : query.error
            ? "Check the package name, whole-credit amount and USD price."
            : null;

  return (
    <AdminPage
      title="Credit packages"
      description="Define the offers that Jiddu can sell later. These records are internal drafts until Stripe checkout is connected."
      breadcrumbs={[{ label: "Credits", href: "/admin/credits" }]}
      actions={
        <Link
          href="/admin/credits/guide"
          className="rounded-md border border-rule px-3 py-1.5"
        >
          Billing guide
        </Link>
      }
    >

        {message && (
          <p className="rounded-md border border-rule bg-paper px-4 py-3 text-sm">
            {message}
          </p>
        )}

        <AdminPanel>
          <h2 className="font-serif text-2xl">Create a package</h2>
          <p className="mt-1 text-sm text-muted">
            Example offers: 1,000 credits for $10; 5,500 for $50; or 12,000 for
            $100. Bonus value is expressed directly in the total credit amount.
          </p>
          <PackageForm action={createCreditPackageAction} className="mt-5" />
        </AdminPanel>

        <AdminSection title="Configured packages">
          {packages.length === 0 ? (
            <p className="rounded-lg border border-rule p-5 text-sm text-muted">
              No packages have been created.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {packages.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-rule bg-paper p-5"
                >
                  <PackageForm
                    action={updateCreditPackageAction}
                    item={{
                      id: item.id,
                      name: item.name,
                      description: item.description ?? "",
                      credits: item.credits,
                      priceUsd: (item.priceCents / 100).toFixed(2),
                      active: item.active,
                      sortOrder: item.sortOrder,
                    }}
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
                    <span>
                      {USD.format(item.priceCents / 100)} ·{" "}
                      {(item.priceCents / 100 / item.credits).toLocaleString(
                        "en-US",
                        {
                          style: "currency",
                          currency: "USD",
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 6,
                        },
                      )}{" "}
                      per credit
                    </span>
                    <DeleteCreditPackageForm
                      id={item.id}
                      name={item.name}
                      action={deleteCreditPackageAction}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </AdminSection>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/admin/settings">Edit credit economics →</Link>
          <Link href="/admin/credits/guide">Read the billing guide →</Link>
        </div>
    </AdminPage>
  );
}

type PackageFormValue = {
  id: string;
  name: string;
  description: string;
  credits: number;
  priceUsd: string;
  active: boolean;
  sortOrder: number;
};

function PackageForm({
  action,
  item,
  className = "",
}: {
  action: (formData: FormData) => Promise<void>;
  item?: PackageFormValue;
  className?: string;
}) {
  return (
    <form action={action} className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <PackageInput
        label="Package name"
        name="name"
        type="text"
        required
        defaultValue={item?.name}
        placeholder="Starter"
      />
      <PackageInput
        label="Credits"
        name="credits"
        type="number"
        required
        min={1}
        step={1}
        defaultValue={item?.credits}
        placeholder="1000"
      />
      <PackageInput
        label="Price (USD)"
        name="priceUsd"
        type="number"
        required
        min={0.01}
        step={0.01}
        defaultValue={item?.priceUsd}
        placeholder="10.00"
      />
      <PackageInput
        label="Display order"
        name="sortOrder"
        type="number"
        step={1}
        defaultValue={item?.sortOrder ?? 0}
      />
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium">Description</span>
        <textarea
          name="description"
          maxLength={500}
          defaultValue={item?.description}
          placeholder="Optional internal or customer-facing description"
          className="min-h-20 rounded-md border border-rule bg-background px-3 py-2"
        />
      </label>
      <div className="flex items-center justify-between gap-4 sm:col-span-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={item?.active ?? true}
          />
          Active offer
        </label>
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {item ? "Save package" : "Create package"}
        </button>
      </div>
    </form>
  );
}

function PackageInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        className="rounded-md border border-rule bg-background px-3 py-2"
      />
    </label>
  );
}
