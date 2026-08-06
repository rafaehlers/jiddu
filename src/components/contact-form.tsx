"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendPublicContactAction } from "@/app/contact/actions";
import { PageTitle } from "@/components/page-title";
import {
  INITIAL_EMAIL_FORM_STATE,
  type EmailFormErrorCode,
} from "@/lib/email-form-state";
import type { Lang } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";

type ContactCopy = {
  email: string;
  errors: Record<EmailFormErrorCode, string>;
  intro: string;
  message: string;
  messagePlaceholder: string;
  name: string;
  namePlaceholder: string;
  send: string;
  sending: string;
  subject: string;
  subjectPlaceholder: string;
  success: string;
  title: string;
};

const COPY: Record<Lang, ContactCopy> = {
  en: {
    title: "Contact",
    intro:
      "Questions, feedback or partnership ideas? Send us a message and Jiddu Support will reply by email.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    subject: "Subject",
    subjectPlaceholder: "How can we help?",
    message: "Message",
    messagePlaceholder: "Tell us what you need.",
    send: "Send message",
    sending: "Sending…",
    success:
      "Message sent. We also emailed you a confirmation and will reply as soon as possible.",
    errors: {
      auth_required: "Sign in and try again.",
      email_unverified: "Verify your email and try again.",
      rate_limit: "Too many messages were sent recently. Please try again later.",
      send_failed: "We could not send your message. Please try again shortly.",
      validation: "Check the form fields and try again.",
    },
  },
  pt: {
    title: "Contato",
    intro:
      "Dúvidas, feedback ou ideias de parceria? Envie uma mensagem e o Suporte Jiddu responderá por e-mail.",
    name: "Nome",
    namePlaceholder: "Seu nome",
    email: "E-mail",
    subject: "Assunto",
    subjectPlaceholder: "Como podemos ajudar?",
    message: "Mensagem",
    messagePlaceholder: "Conte o que você precisa.",
    send: "Enviar mensagem",
    sending: "Enviando…",
    success:
      "Mensagem enviada. Também enviamos uma confirmação por e-mail e responderemos assim que possível.",
    errors: {
      auth_required: "Entre na sua conta e tente novamente.",
      email_unverified: "Verifique seu e-mail e tente novamente.",
      rate_limit: "Muitas mensagens foram enviadas recentemente. Tente mais tarde.",
      send_failed: "Não foi possível enviar sua mensagem. Tente novamente em instantes.",
      validation: "Revise os campos do formulário e tente novamente.",
    },
  },
  es: {
    title: "Contacto",
    intro:
      "¿Tienes preguntas, comentarios o ideas de colaboración? Envíanos un mensaje y el soporte de Jiddu responderá por correo electrónico.",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Correo electrónico",
    subject: "Asunto",
    subjectPlaceholder: "¿Cómo podemos ayudarte?",
    message: "Mensaje",
    messagePlaceholder: "Cuéntanos qué necesitas.",
    send: "Enviar mensaje",
    sending: "Enviando…",
    success:
      "Mensaje enviado. También te enviamos una confirmación por correo y responderemos lo antes posible.",
    errors: {
      auth_required: "Inicia sesión e inténtalo de nuevo.",
      email_unverified: "Verifica tu correo e inténtalo de nuevo.",
      rate_limit: "Se enviaron demasiados mensajes recientemente. Inténtalo más tarde.",
      send_failed: "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos instantes.",
      validation: "Revisa los campos del formulario e inténtalo de nuevo.",
    },
  },
};

export function ContactForm() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    sendPublicContactAction,
    INITIAL_EMAIL_FORM_STATE,
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex flex-col gap-2">
        <PageTitle>{copy.title}</PageTitle>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          {copy.intro}
        </p>
      </header>

      <form
        ref={formRef}
        action={formAction}
        className="relative flex flex-col gap-5 rounded-lg border border-rule bg-paper p-5 sm:p-7"
      >
        <input type="hidden" name="lang" value={lang} />
        <div className="absolute left-[-10000px] top-auto" aria-hidden="true">
          <label>
            Company
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label={copy.name}>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              placeholder={copy.namePlaceholder}
              className={inputClassName}
            />
          </FormField>
          <FormField label={copy.email}>
            <input
              type="email"
              name="email"
              required
              maxLength={320}
              autoComplete="email"
              className={inputClassName}
            />
          </FormField>
        </div>

        <FormField label={copy.subject}>
          <input
            type="text"
            name="subject"
            required
            minLength={3}
            maxLength={160}
            placeholder={copy.subjectPlaceholder}
            className={inputClassName}
          />
        </FormField>

        <FormField label={copy.message}>
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={8}
            placeholder={copy.messagePlaceholder}
            className={`${inputClassName} resize-y`}
          />
        </FormField>

        {state.status !== "idle" && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`rounded-md border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                : "border-[var(--severity-high)]/40 text-[var(--severity-high)]"
            }`}
          >
            {state.status === "success" ? copy.success : copy.errors[state.code]}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? copy.sending : copy.send}
          </button>
        </div>
      </form>
    </article>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-md border border-rule bg-background px-3 py-2.5 outline-none transition-colors focus:border-accent";
