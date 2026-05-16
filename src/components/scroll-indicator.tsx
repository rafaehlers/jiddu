"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type Position = "hidden" | "top" | "middle" | "bottom";

export function ScrollIndicator() {
  const { t } = useI18n();
  const [position, setPosition] = useState<Position>("hidden");

  useEffect(() => {
    const compute = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max < 200) {
        setPosition("hidden");
        return;
      }
      if (y < 100) setPosition("top");
      else if (y > max - 100) setPosition("bottom");
      else setPosition("middle");
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  if (position === "hidden") return null;

  const isDown = position !== "bottom";
  const label = isDown ? t.scroll_to_bottom : t.scroll_to_top;

  function onClick() {
    window.scrollTo({
      top: isDown ? document.documentElement.scrollHeight : 0,
      behavior: "smooth",
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "fixed bottom-6 right-6 z-30 h-11 w-11 rounded-full",
        "bg-paper border border-rule shadow-lg",
        "flex items-center justify-center",
        "text-muted hover:text-foreground hover:border-foreground transition-colors",
      )}
    >
      {isDown ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
    </button>
  );
}
