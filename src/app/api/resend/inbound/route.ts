import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Attachment, WebhookEventPayload } from "resend";
import {
  escapeEmailHtml,
  resendClient,
  resendFromEmail,
  supportForwardEmail,
  supportInboxEmail,
} from "@/lib/support-email";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("RESEND_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: WebhookEventPayload;
  try {
    event = resendClient().webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const support = supportInboxEmail().toLowerCase();
  const recipients = [...event.data.to, ...event.data.received_for].map((email) =>
    email.trim().toLowerCase(),
  );
  if (!recipients.includes(support)) {
    return NextResponse.json({ received: true, forwarded: false });
  }

  try {
    const resend = resendClient();
    const [emailResult, attachmentResult] = await Promise.all([
      resend.emails.receiving.get(event.data.email_id, { html_format: "cid" }),
      resend.emails.receiving.attachments.list({
        emailId: event.data.email_id,
      }),
    ]);
    if (emailResult.error) {
      throw new Error(`Could not retrieve inbound email: ${emailResult.error.message}`);
    }
    if (attachmentResult.error) {
      throw new Error(
        `Could not retrieve inbound attachments: ${attachmentResult.error.message}`,
      );
    }

    const attachments = await Promise.all(
      attachmentResult.data.data.map(async (attachment): Promise<Attachment> => {
        const response = await fetch(attachment.download_url);
        if (!response.ok) {
          throw new Error(
            `Could not download inbound attachment (${response.status}).`,
          );
        }
        return {
          filename: attachment.filename,
          content: Buffer.from(await response.arrayBuffer()),
          contentType: attachment.content_type,
          contentId: attachment.content_id,
        };
      }),
    );

    const email = emailResult.data;
    const originalFrom = email.headers?.from || email.from;
    const originalReplyTo = email.reply_to?.[0] || event.data.from;
    const originalSubject = email.subject || "(no subject)";
    const text = [
      `Forwarded message from ${originalFrom}`,
      `To: ${email.to.join(", ")}`,
      `Subject: ${originalSubject}`,
      "",
      email.text || "This message only contains HTML content.",
    ].join("\n");
    const html = `
      <div style="border-bottom:1px solid #ddd;margin-bottom:20px;padding-bottom:16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">
        <strong>Forwarded Jiddu support message</strong><br />
        From: ${escapeEmailHtml(originalFrom)}<br />
        To: ${escapeEmailHtml(email.to.join(", "))}<br />
        Subject: ${escapeEmailHtml(originalSubject)}
      </div>
      ${email.html || `<pre>${escapeEmailHtml(email.text || "")}</pre>`}`;

    const { error } = await resend.emails.send(
      {
        from: resendFromEmail(),
        to: supportForwardEmail(),
        replyTo: originalReplyTo,
        subject: originalSubject.startsWith("Fwd:")
          ? originalSubject
          : `Fwd: ${originalSubject}`,
        text,
        html,
        attachments,
        tags: [{ name: "source", value: "inbound-forward" }],
      },
      { idempotencyKey: `inbound-forward-${event.data.email_id}` },
    );
    if (error) throw new Error(`Could not forward inbound email: ${error.message}`);

    return NextResponse.json({ received: true, forwarded: true });
  } catch (error) {
    console.error("Could not process Resend inbound email:", error);
    return NextResponse.json({ error: "Forwarding failed" }, { status: 500 });
  }
}
