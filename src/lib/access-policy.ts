export type EmailIdentity = {
  email: string;
  emailVerified: boolean;
};

export function normalizeAccessEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseEmailAllowlist(value: string | undefined): string[] {
  return Array.from(
    new Set(
      (value ?? "")
        .split(/[,\n]/)
        .map(normalizeAccessEmail)
        .filter(Boolean),
    ),
  );
}

export function identityMatchesAllowlist(
  user: EmailIdentity | null | undefined,
  emails: readonly string[],
): boolean {
  if (!user?.emailVerified) return false;
  return emails.includes(normalizeAccessEmail(user.email));
}
