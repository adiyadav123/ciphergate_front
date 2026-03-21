"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Trash2,
  Plus,
  Key,
  Lock,
  Shuffle,
  LogOut,
  ExternalLink,
  Globe,
  FileText,
  ChevronRight,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/env";

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative p-5 border border-white/10 bg-[rgba(20,19,19,0.637)] backdrop-blur-xl group overflow-hidden"
    >
      {/* primary corner bracket */}
      <div className="absolute top-0 left-0 w-10 h-px bg-primary" />
      <div className="absolute top-0 left-0 w-px h-10 bg-primary" />

      <div className="flex items-center justify-between mb-3">
        <Icon size={16} className="text-primary" />
        <span className="text-[9px] uppercase tracking-[0.35em] font-inconsolata text-white/30">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bitcount text-white">{value}</p>

      {/* hover shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/4" />
    </motion.div>
  );
}

// ── Nav Card ──────────────────────────────────────────────────────────────
function NavCard({ icon: Icon, label, sub, href, delay = 0 }) {
  return (
    <motion.button
      onClick={() => (window.location.href = href)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2 }}
      className="relative p-6 border border-white/10 hover:border-primary/50 bg-[rgba(20,19,19,0.637)] hover:bg-primary/5 text-left group overflow-hidden w-full transition-colors duration-300"
    >
      {/* animated bottom border */}
      <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-primary transition-all duration-500" />

      <Icon size={22} className="mb-3 text-gray-400 group-hover:text-primary transition-colors duration-300" />
      <h3 className="font-bitcount text-sm uppercase tracking-[0.2em] text-white mb-1">
        {label}
      </h3>
      <p className="text-[10px] font-inconsolata text-white/30 tracking-wider">{sub}</p>

      <ChevronRight
        size={14}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/15 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300"
      />
    </motion.button>
  );
}

// ── Section Header ────────────────────────────────────────────────────────
function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <h2 className="text-2xl font-bitcount uppercase text-primary shrink-0">
        {children}
      </h2>
      <div className="flex-1 h-px bg-primary/15" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [vaultData, setVaultData] = useState({
    notes: [],
    bookmarks: [],
    passwords: [],
    auths: [],
  });
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBookmark, setNewBookmark] = useState({ title: "", url: "" });
  const [newNote, setNewNote] = useState("");
  const [activeQuote, setActiveQuote] = useState(0);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("cipher_session");
    if (!raw) { window.location.href = "/auth/login"; return; }
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch {
      localStorage.removeItem("cipher_session");
      window.location.href = "/auth/login";
      return;
    }
    if (!parsed?.user?.id) {
      localStorage.removeItem("cipher_session");
      window.location.href = "/auth/login";
      return;
    }
    if (!parsed?.mfaVerified) {
      window.location.href = "/auth/mfa";
      return;
    }
    setSession(parsed);
    initializeDashboard(parsed.user.id);
  }, []);

  useEffect(() => {
    if (quotes.length < 2) return;
    const t = setInterval(() => setActiveQuote((q) => (q + 1) % quotes.length), 6000);
    return () => clearInterval(t);
  }, [quotes]);

  const fetchDashboardData = async (userId) => {
    setLoading(true);
    try {
      const [vaultRes, quotesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vault/all?user_id=${userId}`),
        fetch(`${API_BASE_URL}/misc/security-quotes`),
      ]);
      if (vaultRes.ok) setVaultData(await vaultRes.json());
      if (quotesRes.ok) setQuotes((await quotesRes.json()).quotes || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeDashboard = async (userId) => {
    try {
      await fetch(`${API_BASE_URL}/vault/migrate-encryption`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
    } catch (err) {
      console.error("Failed to trigger encryption migration:", err);
    }
    fetchDashboardData(userId);
  };

  const handleAddBookmark = async (e) => {
    e.preventDefault();
    if (!newBookmark.title.trim() || !newBookmark.url.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, ...newBookmark }),
      });
      if (res.ok) { setNewBookmark({ title: "", url: "" }); fetchDashboardData(session.user.id); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteBookmark = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/bookmarks/${id}`, { method: "DELETE" });
      if (res.ok) fetchDashboardData(session.user.id);
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session.user.id, content: newNote }),
      });
      if (res.ok) { setNewNote(""); fetchDashboardData(session.user.id); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteNote = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/notes/${id}`, { method: "DELETE" });
      if (res.ok) fetchDashboardData(session.user.id);
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("cipher_session");
    window.location.href = "/auth/login";
  };

  const handleDownloadRecoveryKey = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recovery-key?user_id=${session.user.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to fetch recovery key");
      }

      const content = [
        "CipherGate Recovery Kit",
        `Email: ${data.email}`,
        `Recovery Key: ${data.recovery_key}`,
        "",
        "Keep this key offline and private.",
        "Anyone with this key can recover your account.",
      ].join("\n");

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "ciphergate-recovery-key.txt";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download recovery key:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-inconsolata flex flex-col items-center justify-center gap-4">
        <motion.div
          className="w-10 h-10 border-t-2 border-r border-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
          Loading vault...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-inconsolata">

      {/* ── Header ── */}
        

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-primary" />
            <h1 className="text-3xl font-bitcount text-primary uppercase">
              Cipher Gate
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* live status pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-primary/20 bg-primary/5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-primary/60 font-inconsolata">
                Vault Active
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.2em] border border-white/20 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-14">

        {/* ── Quote rotator ── */}
        {quotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative p-5 border border-primary/20 bg-primary/5 overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary via-primary/40 to-transparent" />

            <AnimatePresence mode="wait">
              <motion.p
                key={activeQuote}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.35 }}
                className="text-sm italic text-gray-300 pl-4"
              >
                "{quotes[activeQuote]}"
              </motion.p>
            </AnimatePresence>

            {quotes.length > 1 && (
              <div className="flex gap-1.5 mt-4 pl-4">
                {quotes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveQuote(i)}
                    className="h-0.5 rounded-full transition-all duration-300 bg-primary"
                    style={{ opacity: i === activeQuote ? 1 : 0.2, width: i === activeQuote ? 20 : 8 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Globe}     label="Bookmarks"   value={vaultData.bookmarks.length}        delay={0.05} />
          <StatCard icon={FileText}  label="Notes"        value={vaultData.notes.length}            delay={0.1}  />
          <StatCard icon={Key}       label="Passwords"    value={vaultData.passwords?.length ?? 0}  delay={0.15} />
          <StatCard icon={Lock}      label="Auth Tokens"  value={vaultData.auths?.length ?? 0}      delay={0.2}  />
        </div>

        {/* ── Navigation ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NavCard icon={Shuffle} label="Password Generator" sub="Entropy-secure generation"   href="/dashboard/generator"     delay={0.1}  />
          <NavCard icon={Key}     label="Password Manager"   sub="Encrypted credential store"  href="/dashboard/passwords"     delay={0.15} />
          <NavCard icon={Lock}    label="Authenticator"      sub="TOTP / 2FA tokens"            href="/dashboard/authenticator" delay={0.2}  />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleDownloadRecoveryKey}
            className="p-4 border border-primary/30 bg-primary/5 text-left hover:bg-primary/10 transition-all"
          >
            <div className="flex items-center gap-2 text-primary mb-2">
              <Download size={15} />
              <span className="text-xs uppercase tracking-[0.2em]">Recovery Key</span>
            </div>
            <p className="text-xs text-gray-400">Download your account recovery key and keep it offline.</p>
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard/security")}
            className="p-4 border border-white/10 bg-[rgba(20,19,19,0.637)] text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-2 text-primary mb-2">
              <Shield size={15} />
              <span className="text-xs uppercase tracking-[0.2em]">Security Guide</span>
            </div>
            <p className="text-xs text-gray-400">Best practices to keep your CipherGate account safe.</p>
          </button>
        </div>

        {/* ── Bookmarks ── */}
        <div>
          <SectionHeader>Bookmarks</SectionHeader>

          <form onSubmit={handleAddBookmark} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Bookmark title"
                value={newBookmark.title}
                onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                className="bg-black/40 border-white/10 focus:border-primary/50 text-white placeholder:text-white/20 rounded-none transition-colors"
              />
              <Input
                placeholder="https://example.com"
                type="url"
                value={newBookmark.url}
                onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                className="bg-black/40 border-white/10 focus:border-primary/50 text-white placeholder:text-white/20 rounded-none transition-colors"
              />
              <Button
                type="submit"
                className="bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold shrink-0 transition-colors"
              >
                <Plus size={15} className="mr-2" /> Add
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {vaultData.bookmarks.map((bm, i) => (
                <motion.div
                  key={bm.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative p-4 border border-white/10 bg-[rgba(20,19,19,0.637)] group hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 overflow-hidden"
                >
                  {/* top sweep on hover */}
                  <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full bg-primary transition-all duration-500" />

                  <h3 className="font-bold text-sm mb-1 truncate text-white">{bm.title}</h3>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:text-white transition-colors flex items-center gap-1 truncate mb-4"
                  >
                    <ExternalLink size={10} className="shrink-0" />
                    <span className="truncate">{bm.url}</span>
                  </a>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteBookmark(bm.id)}
                    disabled={deletingId === bm.id}
                    className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                    {deletingId === bm.id ? "Removing…" : "Remove"}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {vaultData.bookmarks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 flex flex-col items-center gap-3 border border-dashed border-white/8"
              >
                <Globe size={22} className="text-primary/20" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/20">
                  No bookmarks saved
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <SectionHeader>Sticky Notes</SectionHeader>

          <form onSubmit={handleAddNote} className="mb-6 space-y-3">
            <textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
              className="w-full p-3 bg-black/40 border border-white/10 text-white text-sm focus:border-primary/50 outline-none transition-colors resize-none rounded-none"
            />
            <Button
              type="submit"
              className="w-full bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold transition-colors"
            >
              <Plus size={15} className="mr-2" /> Add Note
            </Button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {vaultData.notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative p-5 border border-white/10 bg-[rgba(20,19,19,0.637)] group hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex flex-col min-h-32.5 overflow-hidden"
                >
                  {/* top sweep on hover */}
                  <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full bg-primary transition-all duration-500" />

                  <span className="text-[9px] uppercase tracking-[0.35em] text-primary/40 mb-3 font-inconsolata">
                    #{String(i + 1).padStart(2, "0")}
                  </span>

                  <p className="text-xs text-gray-200 flex-1 leading-relaxed">
                    {note.note_content}
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingId === note.id}
                    className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 mt-3"
                  >
                    <Trash2 size={12} />
                    {deletingId === note.id ? "Removing…" : "Delete"}
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>

            {vaultData.notes.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 flex flex-col items-center gap-3 border border-dashed border-white/8"
              >
                <FileText size={22} className="text-primary/20" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/20">
                  No notes saved
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/5 pt-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-primary/30" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/20">
              End-to-end encrypted
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/15">
            Cipher Gate
          </span>
        </motion.div>

      </div>
    </div>
  );
}