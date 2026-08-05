import "server-only";

import type { Lang } from "@/lib/fallacies";
import {
  escapeEmailHtml,
  resendClient,
  resendFromEmail,
} from "@/lib/support-email";

type InvitationEmailInput = {
  acceptUrl: string;
  expiresAt: Date;
  invitationId: string;
  inviteeEmail: string;
  inviterName: string;
  locale: Lang;
  message?: string;
  rewardCredits: number;
};

const COPY: Record<
  Lang,
  {
    button: string;
    closing: string;
    expires: (date: string) => string;
    intro: (name: string) => string;
    reward: (credits: number) => string;
    subject: (name: string) => string;
    title: string;
  }
> = {
  en: {
    subject: (name) => `${name} invited you to Jiddu`,
    title: "You have been invited to Jiddu",
    intro: (name) => `${name} invited you to create a Jiddu account.`,
    reward: (credits) =>
      `Accept the invitation with this email address and receive ${credits} Jiddu Credits.`,
    expires: (date) => `This invitation expires on ${date}.`,
    button: "Accept invitation",
    closing: "If you were not expecting this invitation, you can ignore this email.",
  },
  pt: {
    subject: (name) => `${name} convidou você para o Jiddu`,
    title: "Você recebeu um convite para o Jiddu",
    intro: (name) => `${name} convidou você para criar uma conta no Jiddu.`,
    reward: (credits) =>
      `Aceite o convite com este endereço de e-mail e receba ${credits} Jiddu Credits.`,
    expires: (date) => `Este convite expira em ${date}.`,
    button: "Aceitar convite",
    closing: "Se você não esperava este convite, pode ignorar este e-mail.",
  },
  es: {
    subject: (name) => `${name} te invitó a Jiddu`,
    title: "Has recibido una invitación a Jiddu",
    intro: (name) => `${name} te invitó a crear una cuenta en Jiddu.`,
    reward: (credits) =>
      `Acepta la invitación con esta dirección de correo y recibe ${credits} Jiddu Credits.`,
    expires: (date) => `Esta invitación caduca el ${date}.`,
    button: "Aceptar invitación",
    closing: "Si no esperabas esta invitación, puedes ignorar este correo.",
  },
};

const DATE_LOCALES: Record<Lang, string> = {
  en: "en-US",
  pt: "pt-BR",
  es: "es-ES",
};

export async function sendInvitationEmail(
  input: InvitationEmailInput,
): Promise<string> {
  const copy = COPY[input.locale];
  const inviterName = singleLine(input.inviterName);
  const date = new Intl.DateTimeFormat(DATE_LOCALES[input.locale], {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(input.expiresAt);
  const personalMessage = input.message?.trim()
    ? `<blockquote style="margin:20px 0;padding:14px 18px;border-left:3px solid #d45b35;background:#f7f4ee;white-space:pre-wrap;">${escapeEmailHtml(input.message.trim())}</blockquote>`
    : "";
  const text = [
    copy.title,
    "",
    copy.intro(inviterName),
    input.message?.trim() ? `“${input.message.trim()}”` : "",
    "",
    copy.reward(input.rewardCredits),
    copy.expires(date),
    "",
    input.acceptUrl,
    "",
    copy.closing,
  ]
    .filter((line, index, lines) => line || lines[index - 1] !== "")
    .join("\n");

  const { data, error } = await resendClient().emails.send({
    from: resendFromEmail(),
    to: input.inviteeEmail,
    subject: copy.subject(inviterName),
    text,
    html: `<!doctype html>
<html lang="${input.locale}">
  <body style="margin:0;background:#f7f4ee;color:#211f1b;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:#fff;border:1px solid #ded8ce;border-radius:10px;padding:28px;line-height:1.6;">
        <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:28px;">Jiddu</p>
        <h1 style="margin:0 0 20px;font-size:20px;">${escapeEmailHtml(copy.title)}</h1>
        <p>${escapeEmailHtml(copy.intro(inviterName))}</p>
        ${personalMessage}
        <p>${escapeEmailHtml(copy.reward(input.rewardCredits))}</p>
        <p>${escapeEmailHtml(copy.expires(date))}</p>
        <p style="margin:26px 0;">
          <a href="${escapeEmailHtml(input.acceptUrl)}" style="display:inline-block;border-radius:6px;background:#c9512e;color:#fff;padding:11px 18px;text-decoration:none;font-weight:600;">${escapeEmailHtml(copy.button)}</a>
        </p>
        <p style="font-size:13px;color:#6b665e;">${escapeEmailHtml(copy.closing)}</p>
      </div>
    </div>
  </body>
</html>`,
    tags: [
      { name: "source", value: "invitation" },
      { name: "invitation_id", value: input.invitationId },
    ],
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
  if (!data?.id) throw new Error("Resend did not return an email id.");
  return data.id;
}

function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 160);
}
