export const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://jiddu.app/#organization",
      name: "Jiddu",
      url: "https://jiddu.app/",
      logo: "https://jiddu.app/icon.png",
      email: "support@emails.jiddu.app",
      description:
        "Independent critical-reading software for analyzing reasoning, factual claims, framing, dense prose, writing patterns, and academic papers.",
      founder: {
        "@type": "Person",
        name: "Rafael de Menezes Ehlers",
        url: "https://rafaelmehlers.com.br/",
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "BR",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@emails.jiddu.app",
          url: "https://jiddu.app/contact",
          availableLanguage: ["English", "Portuguese", "Spanish"],
        },
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://jiddu.app/#software",
      name: "Jiddu",
      url: "https://jiddu.app/",
      description:
        "Read text and academic papers critically: detect fallacies, verify claims, assess neutrality, explain dense prose, flag templated writing patterns, and run adversarial paper reviews.",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Critical reading and research analysis",
      operatingSystem: "Web",
      inLanguage: ["en", "pt", "es"],
      featureList: [
        "Logical fallacy detection",
        "Claim extraction and live fact-checking",
        "Neutrality and framing assessment",
        "Paragraph-level paper explanation",
        "Templated writing-pattern detection",
        "Venue-calibrated adversarial paper review",
        "REST API and Streamable HTTP MCP access",
      ],
      publisher: { "@id": "https://jiddu.app/#organization" },
    },
    {
      "@type": "WebSite",
      "@id": "https://jiddu.app/#website",
      name: "Jiddu",
      alternateName: "Jiddu Critical Reading",
      url: "https://jiddu.app/",
      inLanguage: ["en", "pt", "es"],
      publisher: { "@id": "https://jiddu.app/#organization" },
    },
  ],
} as const;
