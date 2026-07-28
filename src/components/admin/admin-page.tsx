import Link from "next/link";

export type AdminBreadcrumb = {
  label: string;
  href?: string;
};

export function AdminPage({
  title,
  description,
  breadcrumbs = [],
  actions,
  children,
  className = "",
}: {
  title: string;
  description?: React.ReactNode;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const trail: AdminBreadcrumb[] = [
    { label: "Admin", href: "/admin" },
    ...breadcrumbs,
    { label: title },
  ];

  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      <header className="flex flex-col gap-4">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-muted"
        >
          {trail.map((item, index) => {
            const current = index === trail.length - 1;
            return (
              <span key={`${item.label}-${index}`} className="contents">
                {index > 0 && <span aria-hidden="true">&gt;</span>}
                {item.href && !current ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span
                    className={current ? "text-foreground" : undefined}
                    aria-current={current ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-6">
          <div className="min-w-0 max-w-3xl">
            <h1 className="font-serif text-3xl">{title}</h1>
            {description && (
              <div className="mt-1 text-sm text-muted">{description}</div>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {actions}
            </div>
          )}
        </div>
      </header>

      {children}
    </div>
  );
}

export function AdminSection({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">{title}</h2>
          {description && (
            <div className="mt-1 text-sm text-muted">{description}</div>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {actions}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

export function AdminPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-rule bg-paper p-5 ${className}`}>
      {children}
    </div>
  );
}

export function AdminTableShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-x-auto rounded-lg border border-rule ${className}`}
    >
      {children}
    </div>
  );
}
