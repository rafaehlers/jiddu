import type { Metadata } from "next";

export const SITE_URL = "https://jiddu.app";
export const SITE_DESCRIPTION =
  "Jiddu detects logical fallacies in any text. Upload a PDF, paste text, or share a URL and read it like Microsoft Word with critical-thinking comments in the margin.";
const SOCIAL_IMAGE_URL = `${SITE_URL}/og.png`;
const SOCIAL_IMAGE_ALT =
  "Jiddu — truth is a pathless land — Read anything with a critical mind — https://jiddu.app";

type SocialMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

function socialMetadata({
  title,
  description,
  path,
  type,
}: SocialMetadataOptions & {
  type: "article" | "website";
}): Metadata {
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
      type,
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

export function publicPageMetadata(
  options: SocialMetadataOptions,
): Metadata {
  return socialMetadata({ ...options, type: "website" });
}

export function analysisSocialMetadata({
  title,
  description,
  path,
}: SocialMetadataOptions): Metadata {
  return socialMetadata({ title, description, path, type: "article" });
}
