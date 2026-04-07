"use client";

import { useEffect, useRef, useState } from "react";
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
  MoreVertical,
  Download,
  MessagesSquare,
  X,
  Pencil,
  Save,
  Heading,
  Bold,
  Italic,
  Underline,
  Link2,
  Palette,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_BASE_URL } from "@/lib/env";
import { getMfaMsRemaining, verifySessionWithMfa } from "@/lib/utils";

const NOTE_PREVIEW_CLAMP_STYLE = {
  display: "-webkit-box",
  WebkitLineClamp: 5,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const sanitizeNoteHtml = (value = "") => {
  let html = String(value);
  html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  html = html.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  html = html.replace(/javascript:/gi, "");
  return html;
};

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative p-5 border border-white/10 bg-[rgba(20,19,19,0.637)] backdrop-blur-xl group overflow-hidden rounded-tr-[5px] rounded-bl-[5px] cursor-cell"
    >
      {/* primary corner bracket */}
      <div className="absolute top-0 left-0 w-10 h-px bg-primary" />
      <div className="absolute top-0 left-0 w-px h-10 bg-primary" />

      <div className="flex items-center justify-between mb-3">
        <Icon size={16} className="text-primary" />
        <span className="text-[12px] uppercase tracking-[0.35em] font-inconsolata text-white/80">
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
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(href)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2 }}
      className="relative p-6 border border-white/10 hover:border-primary/50 bg-[rgba(20,19,19,0.637)] hover:bg-primary/5 text-left group overflow-hidden w-full transition-colors duration-300 rounded-[10px] cursor-pointer"
    >
      {/* animated bottom border */}
      <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full bg-primary transition-all duration-500" />

      <Icon size={22} className="mb-3 text-gray-400 group-hover:text-primary transition-colors duration-300" />
      <h3 className="font-bitcount text-sm uppercase tracking-[0.2em] text-white mb-1">
        {label}
      </h3>
      <p className="text-[12px] font-inconsolata text-white/60 tracking-wider">{sub}</p>

      <ChevronRight
        size={14}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300"
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
  const router = useRouter();
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
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [savingNoteId, setSavingNoteId] = useState(null);
  const [noteColors, setNoteColors] = useState(["#ffffff", "#22c55e", "#3b82f6", "#ef4444"]);
  const [activeNoteColorSlot, setActiveNoteColorSlot] = useState(0);
  const [pendingColorTarget, setPendingColorTarget] = useState(null);
  const [mfaRemainingMs, setMfaRemainingMs] = useState(0);
  const addNoteEditorRef = useRef(null);
  const editNoteEditorRef = useRef(null);
  const addNoteSelectionRef = useRef(null);
  const editNoteSelectionRef = useRef(null);
  const colorPickerRefs = useRef([]);

  useEffect(() => {
    const parsed = verifySessionWithMfa();
    if (!parsed) return;
    
    setSession(parsed);
    setMfaRemainingMs(getMfaMsRemaining(parsed));
    initializeDashboard(parsed.user.id);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    const timer = window.setInterval(() => {
      const raw = localStorage.getItem("cipher_session");
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setMfaRemainingMs(getMfaMsRemaining(parsed));
      } catch {
        setMfaRemainingMs(0);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.user?.id]);

  const mfaRemainingLabel = (() => {
    const totalSec = Math.max(0, Math.floor(mfaRemainingMs / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  })();

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
    if (!session?.user?.id || !newBookmark.title.trim() || !newBookmark.url.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, ...newBookmark }),
      });
      if (res.ok) { setNewBookmark({ title: "", url: "" }); fetchDashboardData(session.user.id); }
    } catch (err) { console.error(err); }
  };

  const handleDeleteBookmark = async (id) => {
    if (!session?.user?.id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/bookmarks/${id}`, { method: "DELETE" });
      if (res.ok) fetchDashboardData(session?.user?.id);
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!session?.user?.id || !stripHtml(newNote)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, content: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        if (addNoteEditorRef.current) addNoteEditorRef.current.innerHTML = "";
        fetchDashboardData(session?.user?.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteNote = async (id) => {
    if (!session?.user?.id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/notes/${id}`, { method: "DELETE" });
      if (res.ok) fetchDashboardData(session?.user?.id);
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  const rememberSelection = (editorRef, selectionRef) => {
    if (!editorRef?.current || !selectionRef) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = (editorRef, selectionRef) => {
    if (!editorRef?.current || !selectionRef?.current) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(selectionRef.current);
  };

  const handleToolbarMouseDown = (e) => {
    // Prevent toolbar click from stealing editor focus and losing current text selection.
    e.preventDefault();
  };

  const applyEditorCommand = (editorRef, selectionRef, command, value = null) => {
    if (!editorRef?.current) return;
    editorRef.current.focus();
    restoreSelection(editorRef, selectionRef);
    if (command === "foreColor") {
      document.execCommand("styleWithCSS", false, true);
    }
    document.execCommand(command, false, value);
    rememberSelection(editorRef, selectionRef);
    editorRef.current.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const applyLink = (editorRef, selectionRef) => {
    rememberSelection(editorRef, selectionRef);
    const url = window.prompt("Enter URL", "https://");
    if (!url) return;
    applyEditorCommand(editorRef, selectionRef, "createLink", url);
  };

  const getEditorRefs = (targetEditor) => {
    if (targetEditor === "edit") {
      return { editorRef: editNoteEditorRef, selectionRef: editNoteSelectionRef };
    }
    return { editorRef: addNoteEditorRef, selectionRef: addNoteSelectionRef };
  };

  const openSlotColorPicker = (targetEditor, slotIndex) => {
    setPendingColorTarget({ targetEditor, slotIndex });
    colorPickerRefs.current[slotIndex]?.click();
  };

  const handleColorSlotClick = (targetEditor, slotIndex) => {
    setActiveNoteColorSlot(slotIndex);
    if (activeNoteColorSlot === slotIndex) {
      openSlotColorPicker(targetEditor, slotIndex);
      return;
    }
    const { editorRef, selectionRef } = getEditorRefs(targetEditor);
    applyEditorCommand(editorRef, selectionRef, "foreColor", noteColors[slotIndex]);
  };

  const handleColorPicked = (slotIndex, colorValue) => {
    if (!colorValue) return;
    const next = [...noteColors];
    next[slotIndex] = colorValue;
    setNoteColors(next);
    setActiveNoteColorSlot(slotIndex);

    const targetEditor = pendingColorTarget?.targetEditor || "add";
    const { editorRef, selectionRef } = getEditorRefs(targetEditor);
    applyEditorCommand(editorRef, selectionRef, "foreColor", colorValue);
    setPendingColorTarget(null);
  };

  const openNoteDialog = (note) => {
    setSelectedNote(note);
    setIsEditingNote(false);
    setEditNoteContent(note.note_content || "");
  };

  const closeNoteDialog = () => {
    setSelectedNote(null);
    setIsEditingNote(false);
    setEditNoteContent("");
  };

  const handleSaveNote = async () => {
    if (!selectedNote || !session?.user?.id || !stripHtml(editNoteContent)) return;
    setSavingNoteId(selectedNote.id);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/notes/${selectedNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: session?.user?.id, content: editNoteContent }),
      });
      if (res.ok) {
        setSelectedNote({ ...selectedNote, note_content: editNoteContent });
        setIsEditingNote(false);
        fetchDashboardData(session?.user?.id);
      }
    } catch (err) {
      console.error(err);
    }
    setSavingNoteId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("cipher_session");
    router.push("/auth/login");
  };

  const handleDownloadRecoveryKey = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recovery-key?user_id=${session?.user?.id}`);
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-primary/20 bg-primary/5 rounded-[5px] cursor-pointer ">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-primary/60 font-inconsolata hover:text-white">
                Vault Active
              </span>
            </div>

            <div className="hidden md:flex flex-col px-3 py-1.5 border border-white/15 bg-white/5 rounded-[5px] min-w-52">
              <span className="text-xs uppercase tracking-[0.25em] text-white/40">User</span>
              <span className="text-xs text-white/80 truncate" title={session?.user?.email || "Unknown user"}>
                {session?.user?.email || "Unknown user"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.2em] border border-white/20 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 rounded-[5px] cursor-pointer"
            >
              <LogOut size={14} /> Logout
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="md:hidden inline-flex items-center justify-center size-10 rounded-[5px] border border-white/20 bg-white/5 text-white hover:border-white/35 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                >
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-60 font-inconsolata">
                <div className="px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Signed in as</p>
                  <p className="mt-1 truncate text-sm tracking-[0.08em] text-white/90" title={session?.user?.email || "Unknown user"}>
                    {session?.user?.email || "Unknown user"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLogout();
                  }}
                  className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
                >
                  <LogOut size={14} />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-3">
          <div className="w-full border border-amber-500/30 bg-amber-500/10 rounded-[8px] px-3 py-2 flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300/90">
              MFA re-auth countdown
            </p>
            <p className="text-xs font-mono text-amber-200">
              {mfaRemainingLabel}
            </p>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-14">

        {/* ── Quote rotator ── */}
        {quotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative p-5 border border-primary/20 bg-primary/5 overflow-hidden rounded-[10px]"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NavCard icon={MessagesSquare} label="Anonymous Chat" sub="Ephemeral shared rooms" href="/dashboard/chat" delay={0.12} />
          <NavCard icon={Key} label="One-Time Secrets" sub="Burn-after-read secure notes" href="/dashboard/secrets" delay={0.16} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={handleDownloadRecoveryKey}
            className="p-4 border border-primary/30 bg-primary/5 text-left hover:bg-primary/10 transition-all rounded-[10px] cursor-pointer"
          >
            <div className="flex items-center gap-2 text-primary mb-2">
              <Download size={15} />
              <span className="text-xs uppercase tracking-[0.2em]">Recovery Key</span>
            </div>
            <p className="text-xs text-gray-400">Download your account recovery key and keep it offline.</p>
          </button>

          <button
            onClick={() => router.push("/research-papers")}
            className="p-4 border border-white/10 bg-[rgba(20,19,19,0.637)] text-left hover:border-primary/40 hover:bg-primary/5 transition-all rounded-[10px] cursor-pointer"
          >
            <div className="flex items-center gap-2 text-primary mb-2">
              <FileText size={15} />
              <span className="text-xs uppercase tracking-[0.2em]">Research Papers</span>
            </div>
            <p className="text-xs text-gray-400">Deep technical paper on CipherGate architecture, math, and implementation.</p>
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard/security")}
            className="p-4 border border-white/10 bg-[rgba(20,19,19,0.637)] text-left hover:border-primary/40 hover:bg-primary/5 transition-all rounded-[10px] cursor-pointer"
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

          <div className="mb-5 rounded-[10px] border border-white/10 bg-[rgba(20,19,19,0.5)] p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-primary/70">Saved links</p>
                <p className="mt-1 text-sm text-white/45">Store quick-access links for your daily tools and resources.</p>
              </div>
              <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
                {vaultData.bookmarks.length} total
              </span>
            </div>

            <form onSubmit={handleAddBookmark}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.1fr_auto] items-stretch">
              <Input
                placeholder="Bookmark title"
                value={newBookmark.title}
                onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                className="bg-black/40 border-white/20 focus:border-primary/50 text-white placeholder:text-white/30 rounded-[8px] transition-colors"
              />
              <Input
                placeholder="https://example.com"
                type="url"
                value={newBookmark.url}
                onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                className="bg-black/40 border-white/20 focus:border-primary/50 text-white placeholder:text-white/30 rounded-[8px] transition-colors"
              />
              <Button
                type="submit"
                className="h-8 bg-primary text-black hover:bg-white rounded-[8px] uppercase tracking-[0.2em] font-bold shrink-0 transition-colors cursor-pointer px-5 self-stretch"
              >
                <Plus size={15} className="mr-2" /> Save
              </Button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {vaultData.bookmarks.map((bm, i) => (
                <motion.div
                  key={bm.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[rgba(20,19,19,0.637)] p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 group"
                >
                  {/* top sweep on hover */}
                  <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full bg-primary transition-all duration-500" />

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Bookmark</p>
                      <h3 className="font-bold text-sm truncate text-white">{bm.title}</h3>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-white/45">
                      #{String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-4 flex items-center gap-1 truncate text-xs text-primary transition-colors hover:text-white"
                  >
                    <ExternalLink size={10} className="shrink-0" />
                    <span className="truncate">{bm.url}</span>
                  </a>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/25">Quick access</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteBookmark(bm.id)}
                      disabled={deletingId === bm.id}
                      className="flex items-center gap-1 text-xs text-red-400/60 transition-all opacity-0 group-hover:opacity-100 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                      {deletingId === bm.id ? "Removing…" : "Remove"}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {vaultData.bookmarks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 flex flex-col items-center gap-3 border border-dashed border-white/30 rounded-[10px]"
              >
                <Globe size={22} className="text-primary/20" />
                <p className="text-xs uppercase tracking-[0.3em] text-white/30">
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
            <div className="flex flex-wrap gap-2">
              <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(addNoteEditorRef, addNoteSelectionRef, "formatBlock", "<p>")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] cursor-pointer">
                Normal
              </button>
              <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(addNoteEditorRef, addNoteSelectionRef, "formatBlock", "<h2>")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                <Heading size={12} /> Title
              </button>
              <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(addNoteEditorRef, addNoteSelectionRef, "bold")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                <Bold size={12} /> Bold
              </button>
              <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(addNoteEditorRef, addNoteSelectionRef, "italic")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                <Italic size={12} /> Italic
              </button>
              <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(addNoteEditorRef, addNoteSelectionRef, "underline")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                <Underline size={12} /> Underline
              </button>
              <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyLink(addNoteEditorRef, addNoteSelectionRef)} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                <Link2 size={12} /> Link
              </button>
              <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(addNoteEditorRef, addNoteSelectionRef, "insertUnorderedList")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                <List size={12} /> List
              </button>

              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/10">
                <Palette size={12} className="text-white/60" />
                {noteColors.map((color, i) => (
                  <button
                    key={`add-color-${i}`}
                    type="button"
                    onMouseDown={handleToolbarMouseDown}
                    onClick={() => handleColorSlotClick("add", i)}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${activeNoteColorSlot === i ? "border-white scale-110" : "border-white/30"}`}
                    style={{ backgroundColor: color }}
                    title={activeNoteColorSlot === i ? "Active color (click again to customize)" : "Set active text color"}
                  />
                ))}
              </div>
            </div>

            <div
              ref={addNoteEditorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Add a formatted note..."
              onMouseUp={() => rememberSelection(addNoteEditorRef, addNoteSelectionRef)}
              onKeyUp={() => rememberSelection(addNoteEditorRef, addNoteSelectionRef)}
              onInput={(e) => setNewNote(e.currentTarget.innerHTML)}
              className="w-full p-3 min-h-36 bg-black/40 border border-white/30 text-white text-sm leading-relaxed focus:border-primary/50 outline-none transition-colors rounded-[10px] overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-white/30 empty:before:pointer-events-none [&_h1]:text-[34px] [&_h1]:leading-tight [&_h1]:font-semibold [&_h2]:text-[34px] [&_h2]:leading-tight [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:my-1"
            />
            <Button
              type="submit"
              className="w-full bg-primary text-black hover:bg-white rounded-[5px] uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer"
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
                  onClick={() => openNoteDialog(note)}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative p-5 border border-white/10 bg-[rgba(20,19,19,0.637)] group hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex flex-col min-h-32.5 overflow-hidden rounded-bl-[5px] rounded-br-[5px] cursor-pointer"
                >
                  {/* top sweep on hover */}
                  <div className="absolute top-0 left-0 h-px w-0 group-hover:w-full bg-primary transition-all duration-500" />

                  <span className="text-xs uppercase tracking-[0.35em] text-primary/40 mb-3 font-inconsolata">
                    #{String(i + 1).padStart(2, "0")}
                  </span>

                  <p className="text-xs text-gray-200 flex-1 leading-relaxed whitespace-pre-wrap" style={NOTE_PREVIEW_CLAMP_STYLE}>
                    {stripHtml(note.note_content || "")}
                  </p>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
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
                <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                  No notes saved
                </p>
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedNote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              <div
                onClick={closeNoteDialog}
                className="md:hidden absolute inset-0 bg-black/80 backdrop-blur-sm"
              />

              <div className="absolute inset-0 z-10 grid md:grid-cols-2">
                <div
                  onClick={closeNoteDialog}
                  className="hidden md:block bg-black/60 backdrop-blur-md"
                />
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 30, opacity: 0 }}
                  className="bg-black/95 border-l border-primary/25 h-full flex flex-col backdrop-blur-[10px]"
                >
                  <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60">Sticky Note</p>
                      <p className="text-xs text-white/50">Full content view</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditingNote ? (
                        <button
                          onClick={() => setIsEditingNote(true)}
                          className="px-3 py-1.5 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNoteId === selectedNote.id || !stripHtml(editNoteContent)}
                          className="px-3 py-1.5 text-xs border border-primary/40 bg-primary/10 hover:bg-primary/20 rounded-[5px] flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          <Save size={12} /> {savingNoteId === selectedNote.id ? "Saving..." : "Save"}
                        </button>
                      )}
                      <button
                        onClick={closeNoteDialog}
                        className="p-2 border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {isEditingNote && (
                    <div className="p-4 border-b border-white/10 flex flex-wrap gap-2">
                      <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(editNoteEditorRef, editNoteSelectionRef, "formatBlock", "<p>")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] cursor-pointer">
                        Normal
                      </button>
                      <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(editNoteEditorRef, editNoteSelectionRef, "formatBlock", "<h2>")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                        <Heading size={12} /> Title
                      </button>
                      <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(editNoteEditorRef, editNoteSelectionRef, "bold")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                        <Bold size={12} /> Bold
                      </button>
                      <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(editNoteEditorRef, editNoteSelectionRef, "italic")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                        <Italic size={12} /> Italic
                      </button>
                      <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(editNoteEditorRef, editNoteSelectionRef, "underline")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                        <Underline size={12} /> Underline
                      </button>
                      <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyLink(editNoteEditorRef, editNoteSelectionRef)} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                        <Link2 size={12} /> Link
                      </button>
                      <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => applyEditorCommand(editNoteEditorRef, editNoteSelectionRef, "insertUnorderedList")} className="px-2.5 py-1 text-xs border border-white/20 hover:border-primary/40 hover:bg-primary/10 rounded-[5px] flex items-center gap-1 cursor-pointer">
                        <List size={12} /> List
                      </button>

                      <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/10">
                        <Palette size={12} className="text-white/60" />
                        {noteColors.map((color, i) => (
                          <button
                            key={`edit-color-${i}`}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            onClick={() => handleColorSlotClick("edit", i)}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${activeNoteColorSlot === i ? "border-white scale-110" : "border-white/30"}`}
                            style={{ backgroundColor: color }}
                            title={activeNoteColorSlot === i ? "Active color (click again to customize)" : "Set active text color"}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-6">
                    {isEditingNote ? (
                      <div
                        ref={editNoteEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onMouseUp={() => rememberSelection(editNoteEditorRef, editNoteSelectionRef)}
                        onKeyUp={() => rememberSelection(editNoteEditorRef, editNoteSelectionRef)}
                        onInput={(e) => setEditNoteContent(e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(editNoteContent) }}
                        className="min-h-full p-4 border border-white/15 rounded-[8px] bg-[rgba(20,19,19,0.637)] text-sm leading-relaxed focus:border-primary/50 outline-none [&_h1]:text-[34px] [&_h1]:leading-tight [&_h1]:font-semibold [&_h2]:text-[34px] [&_h2]:leading-tight [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:my-1"
                      />
                    ) : (
                      <div
                        className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap break-words [&_h1]:text-[34px] [&_h1]:leading-tight [&_h1]:font-semibold [&_h2]:text-[34px] [&_h2]:leading-tight [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_li]:my-1"
                        dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(selectedNote.note_content || "") }}
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {noteColors.map((color, i) => (
          <input
            key={`picker-${i}`}
            ref={(el) => { colorPickerRefs.current[i] = el; }}
            type="color"
            value={color}
            onChange={(e) => handleColorPicked(i, e.target.value)}
            className="hidden"
          />
        ))}

        {/* ── Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/5 pt-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-primary/30" />
            <span className="text-xs uppercase tracking-[0.3em] text-white/30">
              End-to-end encrypted
            </span>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] text-white/30">
            Cipher Gate
          </span>
        </motion.div>

      </div>
    </div>
  );
}