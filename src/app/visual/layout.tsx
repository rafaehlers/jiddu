import { requireVisualPage } from "@/lib/visual-auth";

export default async function VisualLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireVisualPage();
  return children;
}
