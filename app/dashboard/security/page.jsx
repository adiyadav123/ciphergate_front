"use client";

import { Shield, KeyRound, Smartphone, AlertTriangle, ArrowLeft, Download } from "lucide-react";
import { motion } from "framer-motion";

const practices = [
  {
    title: "Save Recovery Key Offline",
    body: "Download your recovery key and store it in an offline location (paper/USB safe). Do not keep it in plain notes or chats.",
    icon: Download,
  },
  {
    title: "Use Unique Master Password",
    body: "Use a long passphrase (14+ chars) that is never reused on other services. Prefer 4-5 random words plus symbols.",
    icon: KeyRound,
  },
  {
    title: "Keep MFA Enabled",
    body: "Always keep an authenticator app enrolled. If possible, store a backup seed securely to avoid lockout.",
    icon: Smartphone,
  },
  {
    title: "Watch for Breaches",
    body: "Run pwned-password checks periodically and rotate credentials that are flagged or reused across sites.",
    icon: AlertTriangle,
  },
];

export default function SecurityGuidePage() {
  return (
    <div className="min-h-screen bg-black text-white font-inconsolata">
      <div className="border-b border-white/10 bg-[rgba(20,19,19,0.637)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bitcount text-primary uppercase flex items-center gap-2">
            <Shield size={18} /> Account Security Guide
          </h1>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:text-primary transition-colors"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practices.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="p-5 border border-white/10 bg-[rgba(20,19,19,0.637)] hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Icon size={16} />
                  <h2 className="text-sm uppercase tracking-[0.2em] font-bitcount">{item.title}</h2>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
