"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Analyses" },
  { href: "/admin/metrics", label: "Metrics" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/cache", label: "Cache" },
  { href: "/admin/api-keys", label: "API keys" },
  { href: "/admin/platform-access", label: "Platform access" },
  { href: "/admin/credits", label: "Credits" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <div className="border-b border-rule">
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Admin console
        </p>
      </div>
      <nav
        aria-label="Admin sections"
        className="-mb-px flex gap-5 overflow-x-auto"
      >
        {ITEMS.map((item) => {
          const active = item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 pb-3 text-sm transition-colors ${
                active
                  ? "border-accent font-medium text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
