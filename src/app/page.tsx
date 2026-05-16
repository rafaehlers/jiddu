import { JidduComposer } from "@/components/jiddu-composer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader />
      <JidduComposer />
      <SiteFooter />
    </main>
  );
}
