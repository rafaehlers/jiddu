import type { Metadata } from "next";

const SITE_URL = "https://jiddu.app";
const SOCIAL_IMAGE_URL = `${SITE_URL}/og.png`;
const SOCIAL_IMAGE_ALT =
  "Jiddu — truth is a pathless land — Read anything with a critical mind — https://jiddu.app";

type AnalysisSocialMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

export function analysisSocialMetadata({
  title,
  description,
  path,
}: AnalysisSocialMetadataOptions): Metadata {
  const canonicalUrl = new URL(path, SITE_URL).toString();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Jiddu",
      type: "article",
      images: [
        {
          url: SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: SOCIAL_IMAGE_URL,
          alt: SOCIAL_IMAGE_ALT,
        },
      ],
    },
  };
}
