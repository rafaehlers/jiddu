import "server-only";

import { WorkOS } from "@workos-inc/node";

const EMAIL_CACHE_MS = 5 * 60 * 1000;
type CachedWorkOSUser = {
  id: string;
  email: string;
  emailVerified: boolean;
};
const emailCache = new Map<
  string,
  { email: string | null; expiresAt: number }
>();
const userCache = new Map<
  string,
  { user: CachedWorkOSUser | null; expiresAt: number }
>();

export async function getWorkOSUserEmails(
  userIds: Array<string | null>,
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(
    new Set(userIds.filter((id): id is string => Boolean(id))),
  );
  const entries = await Promise.all(
    uniqueIds.map(async (userId) => {
      const email = await getWorkOSUserEmail(userId);
      return email ? ([userId, email] as const) : null;
    }),
  );

  return new Map(entries.filter((entry) => entry !== null));
}

export async function findWorkOSUserByEmail(
  email: string,
): Promise<{ id: string; email: string; emailVerified: boolean } | null> {
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return null;
  const normalized = email.trim().toLowerCase();
  const users = await new WorkOS(apiKey).userManagement
    .listUsers({ email: normalized, limit: 10 })
    .catch(() => null);
  const user = users?.data.find(
    (candidate) => candidate.email.trim().toLowerCase() === normalized,
  );
  return user
    ? {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      }
    : null;
}

export async function getWorkOSUserById(
  userId: string,
): Promise<CachedWorkOSUser | null> {
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return null;
  const user = await new WorkOS(apiKey).userManagement
    .getUser(userId)
    .catch(() => null);
  const normalized = user
    ? {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
      }
    : null;
  userCache.set(userId, {
    user: normalized,
    expiresAt: Date.now() + EMAIL_CACHE_MS,
  });
  return normalized;
}

async function getWorkOSUserEmail(userId: string): Promise<string | null> {
  const cached = emailCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.email;

  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) return null;

  const email = await new WorkOS(apiKey).userManagement
    .getUser(userId)
    .then((user) => user.email)
    .catch(() => null);

  emailCache.set(userId, {
    email,
    expiresAt: Date.now() + EMAIL_CACHE_MS,
  });
  return email;
}
