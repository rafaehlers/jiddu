import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function PageTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h1">) {
  return (
    <h1
      className={cn(
        "text-balance font-serif text-4xl leading-tight sm:text-5xl",
        className,
      )}
      {...props}
    />
  );
}
