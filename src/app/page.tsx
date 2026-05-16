import Link from "next/link";
import { UploadForm } from "@/components/upload-form";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="w-full border-b border-rule">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-baseline justify-between">
          <Link href="/" className="font-serif text-3xl tracking-tight">
            Jiddu
          </Link>
          <span className="font-serif italic text-muted text-sm md:text-base">
            truth is a pathless land
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl w-full px-6 py-16 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-serif text-4xl md:text-5xl leading-tight text-balance">
            Read any text with a critical mind in the margin.
          </h1>
          <p className="text-muted text-lg max-w-2xl">
            Upload a PDF, paste text, or drop a URL. Jiddu highlights the
            passages that contain logical fallacies and explains each one in a
            comment — just like a reviewer in Word — and gives the whole piece
            a fallacy score from 0 to 100.
          </p>
        </div>

        <UploadForm />

        <div className="text-sm text-muted">
          <span className="font-medium text-foreground">Privacy:</span> your
          text is sent to the selected model (Anthropic or OpenAI) for analysis
          and stored locally under a shareable id.
        </div>
      </section>

      <footer className="mt-auto border-t border-rule">
        <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted flex flex-wrap items-center justify-between gap-2">
          <span className="font-serif italic">
            “The moment you follow someone, you cease to follow truth.” — J. Krishnamurti
          </span>
          <span>© Jiddu</span>
        </div>
      </footer>
    </main>
  );
}
