import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Contact Jiddu",
  description:
    "Contact Jiddu Support with questions, feedback or partnership ideas.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <ContactForm />
      </main>
      <SiteFooter />
    </>
  );
}
