import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export const MFA_REAUTH_WINDOW_MS = 60 * 60 * 1000;
const PENDING_ACTION_KEY = "cipher_pending_action";

function getCurrentPathWithSearch() {
  if (typeof window === "undefined") return "/dashboard";
  return `${window.location.pathname}${window.location.search || ""}`;
}

export function safeParseSession() {
  const raw = localStorage.getItem("cipher_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("cipher_session");
    return null;
  }
}

export function getMfaMsRemaining(parsed) {
  const mfaVerifiedAt = Number(parsed?.mfaVerifiedAt || 0);
  if (!parsed?.mfaVerified || !mfaVerifiedAt) return 0;
  const elapsed = Date.now() - mfaVerifiedAt;
  return Math.max(0, MFA_REAUTH_WINDOW_MS - elapsed);
}

export function setPendingAction(action) {
  if (typeof window === "undefined" || !action) return;
  try {
    sessionStorage.setItem(
      PENDING_ACTION_KEY,
      JSON.stringify({ ...action, createdAt: Date.now() }),
    );
  } catch {
    // ignore storage failures
  }
}

export function consumePendingAction() {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_ACTION_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function redirectToLogin(nextPath = getCurrentPathWithSearch()) {
  const target = `/auth/login?next=${encodeURIComponent(nextPath || "/dashboard")}`;
  window.location.href = target;
}

export function redirectToMfa(nextPath = getCurrentPathWithSearch(), isReauth = false) {
  const qs = new URLSearchParams();
  qs.set("next", nextPath || "/dashboard");
  if (isReauth) qs.set("reauth", "1");
  window.location.href = `/auth/mfa?${qs.toString()}`;
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Check if MFA needs re-authentication (older than 1 hour)
 * Returns true if expired and user should re-auth, false if still valid
 */
export function isMfaExpired(parsed) {
  if (!parsed?.mfaVerified) return true;
  return getMfaMsRemaining(parsed) <= 0;
}

/**
 * Verify session and check MFA expiration
 * Redirects to appropriate page if invalid
 * Returns parsed session if valid, null if redirected
 */
export function verifySessionWithMfa(options = {}) {
  const parsed = safeParseSession();
  const nextPath = options.nextPath || getCurrentPathWithSearch();

  if (!parsed?.user?.id) {
    redirectToLogin(nextPath);
    return null;
  }

  if (!parsed?.mfaVerified) {
    if (options.pendingAction) setPendingAction(options.pendingAction);
    redirectToMfa(nextPath, false);
    return null;
  }

  if (isMfaExpired(parsed)) {
    if (options.pendingAction) setPendingAction(options.pendingAction);
    redirectToMfa(nextPath, true);
    return null;
  }

  return parsed;
}
