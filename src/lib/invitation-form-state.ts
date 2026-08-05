export type InvitationFormErrorCode =
  | "already_invited"
  | "auth_required"
  | "email_unverified"
  | "existing_account"
  | "global_limit"
  | "per_user_limit"
  | "program_disabled"
  | "rate_limit"
  | "self_invite"
  | "send_failed"
  | "validation"
  | "workos_lookup_failed";

export type InvitationFormState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; code: InvitationFormErrorCode };

export const INITIAL_INVITATION_FORM_STATE: InvitationFormState = {
  status: "idle",
};
