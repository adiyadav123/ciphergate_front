"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Clock3, Copy, KeyRound, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "@/lib/env";
import { verifySessionWithMfa } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OneTimeSecretsPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [readerToken, setReaderToken] = useState("");
  const [secretContent, setSecretContent] = useState("");
  const [expiryPreset, setExpiryPreset] = useState("30");
  const [customExpiryMinutes, setCustomExpiryMinutes] = useState("30");
  const [creatingSecret, setCreatingSecret] = useState(false);
  const [secretLink, setSecretLink] = useState("");
  const [secretExpiresAt, setSecretExpiresAt] = useState("");
  const [copiedSecretLink, setCopiedSecretLink] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState("");
  const [revealedExpiresAt, setRevealedExpiresAt] = useState("");
  const [secretStatus, setSecretStatus] = useState("");
  const [readingSecret, setReadingSecret] = useState(false);

  useEffect(() => {
    const parsed = verifySessionWithMfa();
    if (parsed?.user?.id) {
      setSession(parsed);
    }
  }, []);

  const consumeSecretFromToken = async (token, userId = "") => {
    if (!token) return;
    setReadingSecret(true);
    setSecretStatus("");
    setRevealedSecret("");
    setRevealedExpiresAt("");
    try {
      const params = new URLSearchParams();
      if (userId) params.set("user_id", userId);
      const query = params.toString();
      const url = `${API_BASE_URL}/secrets/one-time/${token}${query ? `?${query}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRevealedSecret(String(data?.content || ""));
        setRevealedExpiresAt(String(data?.expires_at || ""));
        setSecretStatus("");
      } else {
        const detail = String(data?.detail || "").toLowerCase();
        if (detail.includes("expired")) {
          setSecretStatus("Note expired.");
        } else if (detail.includes("opened")) {
          setSecretStatus("Note already opened.");
        } else {
          setSecretStatus("Note unavailable.");
        }
      }
    } catch {
      setSecretStatus("Note unavailable.");
    } finally {
      setReadingSecret(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = new URLSearchParams(window.location.search).get("secret");
    if (!token) return;
    setReaderToken(token);
    consumeSecretFromToken(token, session?.user?.id || "");
  }, [session?.user?.id]);

  const createOneTimeSecret = async () => {
    if (!session?.user?.id) {
      setSecretStatus("Sign in and complete MFA to create one-time notes.");
      return;
    }
    const content = (secretContent || "").trim();
    const rawMinutes = expiryPreset === "custom" ? Number(customExpiryMinutes) : Number(expiryPreset);
    const expiresInMinutes = Number.isFinite(rawMinutes) && rawMinutes > 0 ? Math.floor(rawMinutes) : 30;
    if (!content) {
      setSecretStatus("Enter a secret note first.");
      return;
    }
    setCreatingSecret(true);
    setSecretStatus("");
    try {
      const res = await fetch(`${API_BASE_URL}/secrets/one-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          content,
          expires_in_minutes: expiresInMinutes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSecretStatus(data?.detail || "Could not create one-time note.");
        return;
      }
      const link = `${window.location.origin}${data?.link_path || ""}`;
      setSecretLink(link);
      setSecretExpiresAt(String(data?.expires_at || ""));
      setSecretContent("");
      setSecretStatus("One-time note created. Share the link only with the intended recipient.");
    } catch {
      setSecretStatus("Could not create one-time note.");
    } finally {
      setCreatingSecret(false);
    }
  };

  const copyOneTimeSecretLink = async () => {
    if (!secretLink) return;
    await navigator.clipboard.writeText(secretLink);
    setCopiedSecretLink(true);
    window.setTimeout(() => setCopiedSecretLink(false), 1500);
  };

  if (readerToken) {
    return (
      <div className="min-h-screen bg-black text-white font-inconsolata flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl p-8 border border-white/15 bg-[rgba(20,19,19,0.9)] rounded-2xl space-y-5 shadow-2xl">
          <h1 className="text-xl font-semibold text-primary">One-Time Secret Note</h1>
          {readingSecret && <p className="text-sm text-white/60">Opening note...</p>}
          {!readingSecret && revealedSecret && (
            <>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-white border border-primary/20 bg-primary/5 rounded-xl p-4">{revealedSecret}</pre>
              {revealedExpiresAt && (
                <p className="text-xs text-white/55 flex items-center gap-1.5">
                  <Clock3 size={12} /> Expiry: {new Date(revealedExpiresAt).toLocaleString()}
                </p>
              )}
            </>
          )}
          {!readingSecret && !revealedSecret && (
            <p className="text-sm text-red-300">{secretStatus || "Note unavailable."}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-inconsolata">
      <div className="border-b border-white/10 bg-[rgba(20,19,19,0.74)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-primary flex items-center gap-2">
            <KeyRound size={18} /> One-Time Secret Notes
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.15em] text-white/70 hover:text-primary transition-colors cursor-pointer rounded-xl"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border border-primary/20 bg-primary/5 mb-6 rounded-2xl"
        >
          <p className="text-sm leading-relaxed text-gray-200">
            Create a private note link that can be opened only once. After the first read or expiry, the note is permanently destroyed.
          </p>
        </motion.div>

        <div className="p-6 border border-white/15 bg-[rgba(20,19,19,0.7)] rounded-2xl space-y-5">
          <textarea
            value={secretContent}
            onChange={(e) => setSecretContent(e.target.value)}
            className="w-full min-h-28 bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary/50"
            placeholder="Write secret note..."
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="text-xs uppercase tracking-[0.15em] text-white/55">Expiry</label>
            <Select
              value={expiryPreset}
              onValueChange={setExpiryPreset}
            >
              <SelectTrigger className="h-9 w-46 rounded-xl border-white/15 bg-black/35 px-2.5 text-sm font-medium tracking-normal text-white/95 shadow-sm transition-colors hover:bg-white/5 data-placeholder:text-white/45 focus-visible:border-primary/40 focus-visible:ring-primary/20">
                <SelectValue placeholder="Select expiry" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-[#111214] p-1.5 text-white shadow-2xl">
                <SelectGroup className="p-0.5">
                  <SelectLabel className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Quick Expiry
                  </SelectLabel>
                  <SelectItem value="5" className="rounded-xl px-2.5 py-2 text-sm font-medium text-white/90">5 min</SelectItem>
                  <SelectItem value="15" className="rounded-xl px-2.5 py-2 text-sm font-medium text-white/90">15 min</SelectItem>
                  <SelectItem value="30" className="rounded-xl px-2.5 py-2 text-sm font-medium text-white/90">30 min</SelectItem>
                  <SelectItem value="60" className="rounded-xl px-2.5 py-2 text-sm font-medium text-white/90">1 hour</SelectItem>
                  <SelectItem value="360" className="rounded-xl px-2.5 py-2 text-sm font-medium text-white/90">6 hours</SelectItem>
                  <SelectItem value="1440" className="rounded-xl px-2.5 py-2 text-sm font-medium text-white/90">24 hours</SelectItem>
                  <SelectItem value="custom" className="rounded-xl px-2.5 py-2 text-sm font-semibold text-primary">Custom</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {expiryPreset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={customExpiryMinutes}
                  onChange={(e) => setCustomExpiryMinutes(e.target.value)}
                  className="h-9 w-28 rounded-xl border border-white/15 bg-black/40 px-2.5 font-sans text-sm text-white outline-none focus:border-primary/50"
                  placeholder="Minutes"
                />
                <span className="text-xs uppercase tracking-[0.14em] text-white/50">minutes</span>
              </div>
            )}

            <button
              onClick={createOneTimeSecret}
              disabled={creatingSecret}
              className="ml-auto px-4 py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary text-xs uppercase tracking-[0.14em] hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creatingSecret ? "Creating..." : "Create Secret Link"}
            </button>
          </div>

          {secretLink && (
            <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/45 mb-1">Share this link once</p>
              <div className="flex items-center gap-2">
                <input
                  value={secretLink}
                  readOnly
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white/75"
                />
                <button
                  onClick={copyOneTimeSecretLink}
                  className="shrink-0 p-2.5 border border-white/15 rounded-xl hover:border-primary/40"
                  title="Copy link"
                >
                  {copiedSecretLink ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
              {secretExpiresAt && (
                <p className="mt-2 text-xs text-white/55 flex items-center gap-1.5">
                  <Clock3 size={11} /> Expires: {new Date(secretExpiresAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {(secretStatus || readingSecret || revealedSecret) && (
            <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
              {readingSecret && <p className="text-xs text-white/60">Opening one-time note...</p>}
              {secretStatus && <p className="text-xs text-white/70 mb-2">{secretStatus}</p>}
              {revealedSecret && (
                <pre className="whitespace-pre-wrap text-xs text-primary/90 border border-primary/20 bg-primary/5 rounded-xl p-3">
                  {revealedSecret}
                </pre>
              )}
            </div>
          )}

          <p className="text-[11px] text-white/40 flex items-center gap-1.5">
            <ShieldAlert size={12} /> Screenshot and key-blocking in browser is best-effort only and cannot stop OS-level capture tools.
          </p>
        </div>
      </div>
    </div>
  );
}
