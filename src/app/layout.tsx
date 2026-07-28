import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { cookies, headers } from "next/headers";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { effectiveAnalysisAccessMode } from "@/lib/analysis-access";
import { isAdminIdentity } from "@/lib/admin-auth";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { AuthControlsProvider } from "@/components/auth-controls";
import { I18nProvider } from "@/lib/i18n/provider";
import { isWorkOSConfigured } from "@/lib/auth-config";
import type { Lang } from "@/lib/fallacies";
import "@radix-ui/themes/styles.css";
import "@workos-inc/widgets/styles.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Newsreader (Production Type, Google Fonts) is a digital-first serif:
// less stroke contrast than the previous Cormorant Garamond, so
// medium-sized headings (text-lg / text-xl) hold up on the warm-black
// background instead of feeling anemic. Still serif/editorial — keeps
// the "newspaper / book" tone the site is going for.
const serif = Newsreader({
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Jiddu detects logical fallacies in any text. Upload a PDF, paste text, or share a URL and read it like Microsoft Word with critical-thinking comments in the margin.";

export const metadata: Metadata = {
  metadataBase: new URL("https://jiddu.app"),
  title: "Jiddu — truth is a pathless land",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "https://jiddu.app",
  },
  openGraph: {
    title: "Jiddu — truth is a pathless land",
    description: SITE_DESCRIPTION,
    url: "https://jiddu.app",
    siteName: "Jiddu",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Jiddu — truth is a pathless land — Read anything with a critical mind — https://jiddu.app",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jiddu — truth is a pathless land",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        alt: "Jiddu — truth is a pathless land — Read anything with a critical mind — https://jiddu.app",
      },
    ],
  },
};

const themeInitScript = `
  try {
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch {}
`;

// Resolve the user's preferred language for this request, with the
// preference order:
//   1. Explicit cookie (set when they change the selector or auto-set
//      on first arrival by the client).
//   2. Accept-Language header — best signal we have for a fresh visitor
//      who hasn't been here before. Walks the header in order and picks
//      the first tag whose primary subtag matches a locale we support.
//   3. Fallback to English.
// Reading this server-side and threading it into the provider is what
// closes the i18n hydration mismatch — server and client both render
// the same lang from the first byte.
async function resolveInitialLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("jiddu_lang")?.value;
  if (fromCookie === "en" || fromCookie === "pt" || fromCookie === "es") {
    return fromCookie;
  }
  const hdrs = await headers();
  const accept = (hdrs.get("accept-language") ?? "").toLowerCase();
  for (const tag of accept.split(",")) {
    const primary = tag.trim().split("-")[0].split(";")[0];
    if (primary === "pt") return "pt";
    if (primary === "es") return "es";
    if (primary === "en") return "en";
  }
  return "en";
}

const gtagInitScript = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-X4Y2D32654');`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLang = await resolveInitialLang();
  const authConfigured = isWorkOSConfigured();
  const auth = authConfigured ? await withAuth() : { user: null as null };
  const hasPlatformAccess =
    (await effectiveAnalysisAccessMode(auth.user)) === "platform";
  const { accessToken: _accessToken, ...initialAuth } =
    "accessToken" in auth ? auth : { ...auth, accessToken: undefined };
  void _accessToken;
  return (
    <html
      lang={initialLang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* gtag is intentionally loaded directly; no third-party wrapper dependency. */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-X4Y2D32654"
        />
        <script dangerouslySetInnerHTML={{ __html: gtagInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthKitProvider initialAuth={initialAuth}>
          <AuthControlsProvider
            enabled={authConfigured}
            isAdmin={isAdminIdentity(auth.user)}
            hasPlatformAccess={hasPlatformAccess}
          >
            <I18nProvider initialLang={initialLang}>{children}</I18nProvider>
          </AuthControlsProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
