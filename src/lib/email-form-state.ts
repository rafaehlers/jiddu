export type EmailFormErrorCode =
  | "auth_required"
  | "email_unverified"
  | "rate_limit"
  | "send_failed"
  | "validation";

export type EmailFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; code: EmailFormErrorCode };

export const INITIAL_EMAIL_FORM_STATE: EmailFormState = { status: "idle" };
