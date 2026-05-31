import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/provider";
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
  openGraph: {
    title: "Jiddu — truth is a pathless land",
    description: SITE_DESCRIPTION,
    url: "https://jiddu.app",
    type: "website",
    images: [{ url: "/og.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jiddu — truth is a pathless land",
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
};

const themeInitScript = `
  try {
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch {}
`;

const gtagInitScript = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-X4Y2D32654');`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-X4Y2D32654"
        />
        <script dangerouslySetInnerHTML={{ __html: gtagInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
