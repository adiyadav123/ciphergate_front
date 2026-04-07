"use client";

import { useMemo, useState } from "react";
import {
  Shield,
  KeyRound,
  Smartphone,
  AlertTriangle,
  ArrowLeft,
  Download,
  Search,
  X,
  BookOpen,
  Wifi,
  MailWarning,
  LockKeyhole,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const ARTICLE_AUTHORS = [
  "Aditi Shukla",
  "Aditi Shukla",
  "Aditi Shukla",
  "Aditya Yadav",
  "Aditi Shukla",
  "Aditi Shukla",
  "Aditya Yadav",
  "Aditi Shukla",
  "Aditi Shukla",
];

const articles = [
  {
    title: "Save Recovery Key Offline",
    summary: "Store your recovery key where malware and cloud breaches cannot reach it.",
    content: `
      <h3>Why Offline Storage Matters</h3>
      <p>Your recovery key can restore account access. Keep it out of chat apps, screenshots, and cloud notes.</p>
      <ul>
        <li>Write it on paper and place it in a secure locker.</li>
        <li>Save an encrypted copy on an offline USB drive.</li>
        <li>Never send it over email or messaging apps.</li>
      </ul>
      <p><strong>Rule:</strong> treat this key like physical cash and legal identity documents.</p>
    `,
    icon: Download,
  },
  {
    title: "Use Unique Master Password",
    summary: "A long unique passphrase prevents credential stuffing attacks.",
    content: `
      <h3>Build a Strong Passphrase</h3>
      <p>Use 14+ characters. Prefer 4-5 random words with separators and mixed casing.</p>
      <ul>
        <li>Avoid names, birthdays, and keyboard patterns.</li>
        <li>Do not reuse this password on any other website.</li>
        <li>Change it immediately if exposed in a breach.</li>
      </ul>
      <p><em>Long and unique beats short and complex.</em></p>
    `,
    icon: KeyRound,
  },
  {
    title: "Keep MFA Enabled",
    summary: "Authenticator-based MFA blocks most password-only account takeovers.",
    content: `
      <h3>MFA Should Be Mandatory</h3>
      <p>Even a leaked password is less useful when one-time codes are required.</p>
      <ul>
        <li>Enroll at least one authenticator app.</li>
        <li>Store backup seed securely and offline.</li>
        <li>Review your MFA setup after device changes.</li>
      </ul>
      <p><strong>Tip:</strong> add MFA before storing high-value credentials.</p>
    `,
    icon: Smartphone,
  },
  {
    title: "Watch for Breaches",
    summary: "Monitor breaches and rotate exposed credentials quickly.",
    content: `
      <h3>Breach Response Checklist</h3>
      <p>When a service is compromised, act fast to reduce account takeover risk.</p>
      <ul>
        <li>Change password immediately for the affected site.</li>
        <li>Change reused passwords on other sites too.</li>
        <li>Review login history and active sessions.</li>
      </ul>
      <p>Delay increases attacker success rates.</p>
    `,
    icon: AlertTriangle,
  },
  {
    title: "Block Phishing and Fake Login Pages",
    summary: "Most account theft starts with deceptive links and fake sign-in forms.",
    content: `
      <h3>How to Spot Phishing</h3>
      <p>Attackers imitate trusted brands to steal passwords and MFA codes.</p>
      <ul>
        <li>Check domain spelling before entering credentials.</li>
        <li>Avoid login links in unsolicited emails or DMs.</li>
        <li>Use bookmarks for critical account logins.</li>
      </ul>
      <p><strong>Never</strong> share OTP codes by chat or phone.</p>
    `,
    icon: MailWarning,
  },
  {
    title: "Protect Yourself on Public Wi-Fi",
    summary: "Open networks can expose browsing activity and session tokens.",
    content: `
      <h3>Public Network Safety</h3>
      <p>Public hotspots are convenient but hostile by default.</p>
      <ul>
        <li>Prefer mobile hotspot over open Wi-Fi when possible.</li>
        <li>Use HTTPS-only sites and avoid sensitive logins on unknown networks.</li>
        <li>Turn off auto-join for public wireless networks.</li>
      </ul>
      <p>Trust level of network should influence what you do online.</p>
    `,
    icon: Wifi,
  },
  {
    title: "Minimize Data You Share Online",
    summary: "Less public personal data means fewer social-engineering targets.",
    content: `
      <h3>Privacy by Reduction</h3>
      <p>Every profile detail can be weaponized for identity verification bypass.</p>
      <ul>
        <li>Hide birthday, phone, and location where possible.</li>
        <li>Review app permissions every month.</li>
        <li>Use separate emails for finance, work, and social accounts.</li>
      </ul>
      <p><em>Data minimization is a practical defense.</em></p>
    `,
    icon: Shield,
  },
  {
    title: "Harden Browser and Device Security",
    summary: "Secure defaults in your browser and OS reduce exploit risk.",
    content: `
      <h3>Device Hardening Basics</h3>
      <p>Good account security fails if your device is compromised.</p>
      <ul>
        <li>Enable auto-updates for OS and browser.</li>
        <li>Use screen lock + biometric or strong PIN.</li>
        <li>Install software only from trusted sources.</li>
      </ul>
      <p>Patch speed often decides incident severity.</p>
    `,
    icon: LockKeyhole,
  },
  {
    title: "Separate Work and Personal Credentials",
    summary: "Compartmentalization limits blast radius when one account is breached.",
    content: `
      <h3>Compartmentalize Accounts</h3>
      <p>Cross-account reuse allows one breach to cascade into many services.</p>
      <ul>
        <li>Use separate identity details for work and personal services.</li>
        <li>Store critical passwords in dedicated vault folders.</li>
        <li>Rotate high-risk accounts more frequently.</li>
      </ul>
      <p><strong>Goal:</strong> keep incidents isolated, not systemic.</p>
    `,
    icon: BookOpen,
  },
];

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default function SecurityGuidePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const authoredArticles = articles.map((item, idx) => ({
      ...item,
      author: ARTICLE_AUTHORS[idx] || "Aditi Shukla",
    }));
    if (!needle) return authoredArticles;

    return authoredArticles.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${stripHtml(item.content)} ${item.author}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-black text-white font-inconsolata">
      <div className="border-b border-white/10 bg-[rgba(20,19,19,0.637)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bitcount text-primary uppercase flex items-center gap-2">
            <Shield size={18} /> Account Security Guide
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="p-5 border border-primary/20 bg-primary/5 mb-8">
          <p className="text-sm text-gray-200">
            If you forget your CipherGate password, your recovery key is your fallback access proof. Keep it safe and private.
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search privacy and security articles..."
              className="w-full bg-[rgba(20,19,19,0.637)] border border-white/15 focus:border-primary/45 rounded-[8px] pl-10 pr-4 py-2.5 text-sm outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-white/45 uppercase tracking-[0.2em]">
            {filteredArticles.length} article{filteredArticles.length === 1 ? "" : "s"} found
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                onClick={() => setSelectedArticle(item)}
                className="p-5 border border-white/10 bg-[rgba(20,19,19,0.637)] hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Icon size={16} />
                  <h2 className="text-sm uppercase tracking-[0.2em] font-bitcount">{item.title}</h2>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{item.summary}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">By {item.author}</p>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {selectedArticle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              <div
                onClick={() => setSelectedArticle(null)}
                className="absolute inset-0 bg-black/75 backdrop-blur-md"
              />

              <div className="absolute inset-0 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-white/15 bg-[rgba(10,10,10,0.95)] rounded-[10px] p-6"
                >
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-xl font-bitcount uppercase text-primary mb-1">{selectedArticle.title}</h3>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">By {selectedArticle.author}</p>
                    </div>
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="p-2 border border-white/15 hover:border-red-500/50 hover:bg-red-500/5 rounded-[6px] cursor-pointer"
                      title="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div
                    className="text-sm text-gray-200 leading-relaxed space-y-3 [&_h3]:text-lg [&_h3]:font-bitcount [&_h3]:uppercase [&_h3]:text-primary [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_li]:mb-1 [&_strong]:text-white [&_em]:text-primary/80"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
