"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/provider";

export function PrintBrand() {
  const { t } = useI18n();

  return (
    <div className="print-brand">
      <Image
        src="/brand/jiddu_logo_email.png"
        alt=""
        width={44}
        height={44}
        className="print-brand-logo"
        priority
      />
      <span className="print-brand-copy">
        <span className="print-brand-name">JIDDU</span>
        <span className="print-brand-tag">{t.tagline}</span>
      </span>
    </div>
  );
}

export const PRINT_BRAND_CSS = `
  .print-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: #211f1b;
  }
  .print-brand-logo {
    display: block;
    width: 44px;
    height: 44px;
    border: 1px solid #ded8ce;
    border-radius: 10px;
    object-fit: cover;
  }
  .print-brand-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    padding-top: 4px;
    line-height: 1;
  }
  .print-brand-name {
    color: #d5533b;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.22em;
    line-height: 1.25;
  }
  .print-brand-tag {
    color: #211f1b;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 20px;
    font-style: normal;
    font-weight: 600;
    line-height: 1.15;
  }
`;
