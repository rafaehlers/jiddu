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
const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function CreditPackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [packages, query] = await Promise.all([
    prisma.jidduCreditPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
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
            ? "Check the package name, whole-credit amount and at least one currency price."
            : null;

  return (
    <AdminPage
      title="Credit packages"
      description="Manage the USD and BRL offers sold on the pricing page. Portuguese uses BRL; English and Spanish use USD."
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
            Add a USD price, a BRL price, or both. Packages without a USD price
            appear only when Portuguese and BRL are selected.
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
                      descriptionEn: item.descriptionEn ?? "",
                      descriptionPt: item.descriptionPt ?? "",
                      descriptionEs: item.descriptionEs ?? "",
                      credits: item.credits,
                      priceUsd:
                        item.priceUsdCents === null
                          ? ""
                          : (item.priceUsdCents / 100).toFixed(2),
                      priceBrl:
                        item.priceBrlCents === null
                          ? ""
                          : (item.priceBrlCents / 100).toFixed(2),
                      active: item.active,
                      sortOrder: item.sortOrder,
                    }}
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
                    <span>{packagePriceSummary(item)}</span>
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
  descriptionEn: string;
  descriptionPt: string;
  descriptionEs: string;
  credits: number;
  priceUsd: string;
  priceBrl: string;
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
        min={0.01}
        step={0.01}
        defaultValue={item?.priceUsd}
        placeholder="10.00"
      />
      <PackageInput
        label="Price (BRL)"
        name="priceBrl"
        type="number"
        min={0.01}
        step={0.01}
        defaultValue={item?.priceBrl}
        placeholder="50.00"
      />
      <PackageInput
        label="Display order"
        name="sortOrder"
        type="number"
        step={1}
        defaultValue={item?.sortOrder ?? 0}
      />
      <PackageTextarea
        label="Description (English)"
        name="descriptionEn"
        defaultValue={item?.descriptionEn}
      />
      <PackageTextarea
        label="Description (Portuguese)"
        name="descriptionPt"
        defaultValue={item?.descriptionPt}
      />
      <PackageTextarea
        label="Description (Spanish)"
        name="descriptionEs"
        defaultValue={item?.descriptionEs}
      />
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

function PackageTextarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
      <span className="font-medium">{label}</span>
      <textarea
        name={name}
        maxLength={500}
        defaultValue={defaultValue}
        placeholder="Optional customer-facing description"
        className="min-h-20 rounded-md border border-rule bg-background px-3 py-2"
      />
    </label>
  );
}

function packagePriceSummary(item: {
  credits: number;
  priceUsdCents: number | null;
  priceBrlCents: number | null;
}) {
  const prices = [
    item.priceUsdCents === null
      ? null
      : `${USD.format(item.priceUsdCents / 100)} · ${USD.format(
          item.priceUsdCents / 100 / item.credits,
        )} per credit`,
    item.priceBrlCents === null
      ? null
      : `${BRL.format(item.priceBrlCents / 100)} · ${BRL.format(
          item.priceBrlCents / 100 / item.credits,
        )} per credit`,
  ].filter((value): value is string => value !== null);

  return prices.join(" · ");
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
