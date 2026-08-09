import "server-only";

import { Resend, type CreateBatchOptions } from "resend";
import { emailBrandHeader } from "@/lib/email-brand-header";
import type { Lang } from "@/lib/fallacies";

const DEFAULT_FROM_EMAIL = "Jiddu <notifications@emails.jiddu.app>";
const DEFAULT_SUPPORT_EMAIL = "support@emails.jiddu.app";

type PublicContactEmail = {
  email: string;
  lang: Lang;
  message: string;
  name: string;
  subject: string;
};

type AccountSupportEmail = {
  email: string;
  message: string;
  name: string;
  subject: string;
};

type VenueSuggestionEmail = {
  lang: Lang;
  name: string;
  url?: string;
};

const AUTORESPONDER_COPY: Record<
  Lang,
  {
    closing: string;
    greeting: (name: string) => string;
    intro: string;
    subject: string;
  }
> = {
  en: {
    subject: "We received your message",
    greeting: (name) => `Hi ${name},`,
    intro:
      "Thanks for contacting Jiddu. Your message has reached our support inbox, and we will reply as soon as possible.",
    closing: "Jiddu Support",
  },
  pt: {
    subject: "Recebemos sua mensagem",
    greeting: (name) => `Olá, ${name},`,
    intro:
      "Obrigado por entrar em contato com o Jiddu. Sua mensagem chegou à nossa caixa de suporte e responderemos assim que possível.",
    closing: "Suporte Jiddu",
  },
  es: {
    subject: "Recibimos tu mensaje",
    greeting: (name) => `Hola, ${name}:`,
    intro:
      "Gracias por contactar con Jiddu. Tu mensaje llegó a nuestro buzón de soporte y responderemos lo antes posible.",
    closing: "Soporte de Jiddu",
  },
};

let client: Resend | null = null;

export function resendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  client ??= new Resend(apiKey);
  return client;
}

export function resendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
}

export function supportInboxEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
}

export function supportForwardEmail(): string {
  const email = process.env.SUPPORT_FORWARD_EMAIL?.trim();
  if (!email) throw new Error("SUPPORT_FORWARD_EMAIL is not configured.");
  return email;
}

export async function sendPublicContactEmails(
  input: PublicContactEmail,
): Promise<void> {
  const resend = resendClient();
  const from = resendFromEmail();
  const support = supportInboxEmail();
  const reply = AUTORESPONDER_COPY[input.lang];
  const subject = singleLine(input.subject);
  const name = singleLine(input.name);

  const emails: CreateBatchOptions = [
    {
      from,
      to: support,
      replyTo: input.email,
      subject: `[Contact] ${subject}`,
      text: [
        "New public contact message",
        "",
        `Name: ${name}`,
        `Email: ${input.email}`,
        `Language: ${input.lang}`,
        `Subject: ${subject}`,
        "",
        input.message,
      ].join("\n"),
      html: emailLayout(
        "New public contact message",
        `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
         <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
         <p><strong>Language:</strong> ${escapeHtml(input.lang)}</p>
         <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
         <hr />
         <p>${formatMessage(input.message)}</p>`,
      ),
      tags: [{ name: "source", value: "public-contact" }],
    },
    {
      from,
      to: input.email,
      replyTo: support,
      subject: reply.subject,
      text: [
        reply.greeting(name),
        "",
        reply.intro,
        "",
        `“${subject}”`,
        "",
        reply.closing,
      ].join("\n"),
      html: emailLayout(
        reply.subject,
        `<p>${escapeHtml(reply.greeting(name))}</p>
         <p>${escapeHtml(reply.intro)}</p>
         <blockquote>${escapeHtml(subject)}</blockquote>
         <p>${escapeHtml(reply.closing)}</p>`,
      ),
      tags: [{ name: "source", value: "contact-autoreply" }],
    },
  ];

  const { error } = await resend.batch.send(emails);
  if (error) throw new Error(`Resend batch failed: ${error.message}`);
}

export async function sendAccountSupportEmail(
  input: AccountSupportEmail,
): Promise<void> {
  const subject = singleLine(input.subject);
  const name = singleLine(input.name);
  const { error } = await resendClient().emails.send({
    from: resendFromEmail(),
    to: supportInboxEmail(),
    replyTo: input.email,
    subject: `[Account support] ${subject}`,
    text: [
      "New account support message",
      "",
      `Name: ${name}`,
      `Account email: ${input.email}`,
      `Subject: ${subject}`,
      "",
      input.message,
    ].join("\n"),
    html: emailLayout(
      "New account support message",
      `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
       <p><strong>Account email:</strong> ${escapeHtml(input.email)}</p>
       <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
       <hr />
       <p>${formatMessage(input.message)}</p>`,
    ),
    tags: [{ name: "source", value: "account-support" }],
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}

export async function sendVenueSuggestionEmail(
  input: VenueSuggestionEmail,
): Promise<void> {
  const name = singleLine(input.name);
  const url = input.url?.trim();
  const urlText = url || "Not provided";
  const urlHtml = url
    ? `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`
    : "Not provided";
  const { error } = await resendClient().emails.send({
    from: resendFromEmail(),
    to: supportInboxEmail(),
    subject: `[Venue suggestion] ${name}`,
    text: [
      "New target publication suggestion",
      "",
      `Publication: ${name}`,
      `Official URL: ${urlText}`,
      `Language: ${input.lang}`,
      "Source: /review",
      "",
      "Requested follow-up: evaluate the publication's official guidelines and create a verified venue profile.",
    ].join("\n"),
    html: emailLayout(
      "New target publication suggestion",
      `<p><strong>Publication:</strong> ${escapeHtml(name)}</p>
       <p><strong>Official URL:</strong> ${urlHtml}</p>
       <p><strong>Language:</strong> ${escapeHtml(input.lang)}</p>
       <p><strong>Source:</strong> /review</p>
       <hr />
       <p>Requested follow-up: evaluate the publication&rsquo;s official guidelines and create a verified venue profile.</p>`,
    ),
    tags: [{ name: "source", value: "venue-suggestion" }],
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}

export function escapeEmailHtml(value: string): string {
  return escapeHtml(value);
}

function emailLayout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f4ee;color:#211f1b;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:#fff;border:1px solid #ded8ce;border-radius:10px;padding:28px;line-height:1.6;">
        ${emailBrandHeader()}
        <h1 style="margin:24px 0 20px;font-size:20px;">${escapeHtml(title)}</h1>
        ${body}
      </div>
    </div>
  </body>
</html>`;
}

function formatMessage(value: string): string {
  return escapeHtml(value).replaceAll("\n", "<br />");
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}
