// Shared constant for the one-time "new key" flash cookie. Kept out of
// actions.ts because a "use server" module may only export async functions.
export const NEW_KEY_COOKIE = "jiddu_new_api_key";
