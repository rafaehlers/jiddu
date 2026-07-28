"use client";

import { useAccessToken } from "@workos-inc/authkit-nextjs/components";
import {
  UserProfile,
  UserSecurity,
  WorkOsWidgets,
} from "@workos-inc/widgets";
import { useCallback, useEffect, useState } from "react";

function currentAppearance(): "light" | "dark" {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function AccountIdentity() {
  const { getAccessToken } = useAccessToken();
  const [appearance, setAppearance] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const syncAppearance = () => setAppearance(currentAppearance());
    syncAppearance();

    const observer = new MutationObserver(syncAppearance);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const authToken = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) throw new Error("Your session expired. Please sign in again.");
    return token;
  }, [getAccessToken]);

  return (
    <WorkOsWidgets
      className="jiddu-workos-widgets"
      style={{ minHeight: 0 }}
      theme={{
        appearance,
        accentColor: "indigo",
        grayColor: "sand",
        hasBackground: false,
        radius: "medium",
        scaling: "100%",
        fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
      }}
    >
      <div className="flex flex-col gap-8">
        <section>
          <h2 className="font-serif text-2xl mb-2">Profile</h2>
          <p className="text-sm text-muted mb-4">
            Update your name or email. A new email address must be verified
            before it replaces the current one.
          </p>
          <UserProfile authToken={authToken} />
        </section>

        <section>
          <h2 className="font-serif text-2xl mb-2">Security</h2>
          <p className="text-sm text-muted mb-4">
            Set or change your password and manage additional authentication
            factors.
          </p>
          <UserSecurity authToken={authToken} />
        </section>
      </div>
    </WorkOsWidgets>
  );
}
