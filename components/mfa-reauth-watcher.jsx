"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MFA_REAUTH_WINDOW_MS } from "@/lib/utils";

const isAuthRoute = (pathname = "") => pathname.startsWith("/auth/login") || pathname.startsWith("/auth/mfa");

export function MfaReauthWatcher() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || isAuthRoute(pathname)) return;

    const evaluateSession = () => {
      const raw = localStorage.getItem("cipher_session");
      if (!raw) return;

      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        localStorage.removeItem("cipher_session");
        router.replace("/auth/login");
        return;
      }

      if (!parsed?.user?.id) {
        localStorage.removeItem("cipher_session");
        router.replace("/auth/login");
        return;
      }

      const verifiedAt = Number(parsed?.mfaVerifiedAt || 0);
      const expired = !parsed?.mfaVerified || !verifiedAt || Date.now() - verifiedAt >= MFA_REAUTH_WINDOW_MS;
      if (!expired) return;

      localStorage.setItem(
        "cipher_session",
        JSON.stringify({
          ...parsed,
          mfaVerified: false,
        }),
      );
      const next = `${window.location.pathname}${window.location.search || ""}`;
      router.replace(`/auth/mfa?reauth=1&next=${encodeURIComponent(next)}`);
    };

    evaluateSession();
    const timer = window.setInterval(evaluateSession, 15000);
    return () => window.clearInterval(timer);
  }, [pathname, router]);

  return null;
}