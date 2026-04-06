"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  AlertTriangle,
  ArrowLeft,
  Check,
  Shield,
  MoreVertical,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import zxcvbn from "zxcvbn";
import { API_BASE_URL } from "@/lib/env";

const formatCrackTime = (seconds) => {
  if (seconds < 1) return "Instant";
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  const years = Math.round(seconds / 31536000);
  return years > 1000 ? "1000+ yrs" : `${years} yrs`;
};

const estimatePasswordStrength = (password = "") => {
  const value = String(password);

  if (!value) {
    return {
      score: 0,
      label: "Enter a password",
      color: "bg-white/10",
      guesses: "0",
      guessesLog10: 0,
      theoreticalEntropy: 0,
      crackTimes: {
        online: "N/A",
        offline: "N/A",
        gpu: "N/A",
      },
      feedback: [],
      warning: "",
    };
  }

  const analysis = zxcvbn(value);
  const scoreMap = [
    { label: "Very weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-orange-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-lime-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  const current = scoreMap[analysis.score] || scoreMap[0];

  const R = 94;
  const L = value.length;
  const entropyBits = (L * Math.log2(R)).toFixed(1);
  const smartCombinations = analysis.guesses;

  const crackTimes = {
    online: formatCrackTime(smartCombinations / 100), 
    offline: formatCrackTime(smartCombinations / 100000000), 
    gpu: formatCrackTime(smartCombinations / 100000000000), 
  };

  const guessesLog10 = Number((analysis.guesses_log10 || 0).toFixed(2));
  const guessesDisplay =
    guessesLog10 >= 9
      ? `~1e${guessesLog10}`
      : analysis.guesses?.toLocaleString?.() || String(analysis.guesses || 0);

  return {
    score: Math.round(((analysis.score || 0) / 4) * 100),
    label: current.label,
    color: current.color,
    guesses: guessesDisplay,
    guessesLog10,
    theoreticalEntropy: entropyBits,
    crackTimes,
    feedback: [
      ...(analysis.feedback?.warning ? [analysis.feedback.warning] : []),
      ...(analysis.feedback?.suggestions || []),
    ],
    warning: analysis.warning || "",
    rawGuesses: analysis.guesses // Exported for the API payload
  };
};

export default function PasswordManagerPage() {
  const [session, setSession] = useState(null);
  const [passwords, setPasswords] = useState([]);
  const [breachedIds, setBreachedIds] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [visibleIds, setVisibleIds] = useState(new Set());
  const [selectedPassword, setSelectedPassword] = useState(null);

  // New state for AI corrections
  const [aiAnalysis, setAiAnalysis] = useState({
    isLoading: false,
    data: null, // Will hold { online: "", offline: "", gpu: "", aiNote: "" }
  });

  const [formData, setFormData] = useState({
    site_name: "",
    username_or_email: "",
    password: "",
  });

  const entropy = estimatePasswordStrength(formData.password);

  // --- Debounced AI Fetch Effect ---
  useEffect(() => {
    // Reset if password is empty
    if (!formData.password) {
      setAiAnalysis({ isLoading: false, data: null });
      return;
    }

    // Set loading state as soon as user types
    setAiAnalysis((prev) => ({ ...prev, isLoading: true }));

    // Wait 1 second after the user stops typing before calling the API
    const debounceTimer = setTimeout(async () => {
      try {
        
        const res = await fetch(`${API_BASE_URL}/tools/ai-crack-estimate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entropyBits: entropy.theoreticalEntropy,
            expectedGuesses: entropy.rawGuesses,
          }),
        });

        if (res.ok) {
          const aiData = await res.json();
          // Expected response from your backend: 
          // { online: "2 days", offline: "Instant", gpu: "Instant", aiNote: "Common dictionary pattern." }
          setAiAnalysis({ isLoading: false, data: aiData });
        } else {
          setAiAnalysis({ isLoading: false, data: null });
        }
      } catch (err) {
        console.error("Failed to fetch AI estimates:", err);
        setAiAnalysis({ isLoading: false, data: null });
      }
    }, 1000);

    // Cleanup timer if user types again before 1 second is up
    return () => clearTimeout(debounceTimer);
  }, [formData.password, entropy.theoreticalEntropy, entropy.rawGuesses]);


  useEffect(() => {
    const raw = localStorage.getItem("cipher_session");
    if (!raw) {
      window.location.href = "/auth/login";
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
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
    fetchPasswords(parsed.user.id);
  }, []);

  const fetchPasswords = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/all?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPasswords(data.passwords || []);
      }
    } catch (err) {
      console.error("Failed to fetch passwords:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassword = async (e) => {
    e.preventDefault();
    if (!session?.user?.id || !formData.site_name.trim() || !formData.password.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/vault/passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session?.user?.id,
          site_name: formData.site_name,
          username_or_email: formData.username_or_email,
          password: formData.password,
        }),
      });

      if (res.ok) {
        setFormData({
          site_name: "",
          username_or_email: "",
          password: "",
        });
        setAiAnalysis({ isLoading: false, data: null });
        setShowAdd(false);
        if (session?.user?.id) fetchPasswords(session.user.id);
      }
    } catch (err) {
      console.error("Failed to add password:", err);
    }
  };

  const handleDeletePassword = async (id) => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/vault/passwords/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchPasswords(session?.user?.id);
      }
    } catch (err) {
      console.error("Failed to delete password:", err);
    }
  };

  const checkBreachedPasswords = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tools/audit?user_id=${session?.user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setBreachedIds(new Set(data.breached_ids || []));
      }
    } catch (err) {
      console.error("Failed to check breached passwords:", err);
    } finally {
      setChecking(false);
    }
  };

  const togglePasswordVisibility = (id) => {
    setVisibleIds(
      visibleIds.has(id)
        ? new Set([...visibleIds].filter((v) => v !== id))
        : new Set([...visibleIds, id])
    );
  };

  const copyPassword = (pwd) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(pwd);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const closePasswordDialog = () => setSelectedPassword(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-inconsolata flex items-center justify-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
          Loading passwords...
        </p>
      </div>
    );
  }

  // Determine which crack times to show (AI corrected vs Local Fallback)
  const displayCrackTimes = aiAnalysis.data || entropy.crackTimes;

  return (
    <div className="min-h-screen bg-black text-white font-inconsolata">
      {/* Header */}
      <div className="border-b border-white/10 bg-[rgba(20,19,19,0.637)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bitcount text-primary uppercase">
            Password Manager
          </h1>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Action Buttons */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-primary text-black hover:bg-white rounded-[5px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Password
          </Button>

          <Button
            onClick={checkBreachedPasswords}
            disabled={checking}
            className="border border-white/10 bg-transparent hover:border-red-500/50 rounded-[5px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 cursor-pointer"
          >
            <Shield size={16} />{" "}
            {checking ? "Checking..." : "Check Pwned Passwords"}
          </Button>
        </div>

        {/* Add Password Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 border border-white/10 bg-[rgba(20,19,19,0.637)] rounded-lg"
            >
              <form onSubmit={handleAddPassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Site name
                    </Label>
                    <Input
                      placeholder="e.g., Gmail"
                      value={formData.site_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          site_name: e.target.value,
                        })
                      }
                      className="bg-black/40 border-gray-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Email/Username
                    </Label>
                    <Input
                      placeholder="user@example.com"
                      value={formData.username_or_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          username_or_email: e.target.value,
                        })
                      }
                      className="bg-black/40 border-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Password
                  </Label>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    className="bg-black/40 border-gray-600"
                    required
                  />
                </div>

                <div className="rounded-lg border border-white/10 bg-black/30 p-4 relative overflow-hidden">
                  {/* Visual Loading Overlay for AI */}
                  {aiAnalysis.isLoading && formData.password && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px] flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em]">
                        <Loader2 className="animate-spin" size={16} /> 
                        Auditing...
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                        Heuristic Estimate
                      </p>
                      <p className="mt-1 text-lg font-bitcount uppercase text-primary">
                        {entropy.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                        Expected Guesses
                      </p>
                      <p className="mt-1 text-2xl font-bitcount text-white">
                        {entropy.guesses}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full ${entropy.color} transition-all duration-300`}
                      style={{ width: `${entropy.score}%` }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Entropy</p>
                      <p className="mt-1 text-xs font-bold text-primary">
                        {entropy.theoreticalEntropy} bits
                      </p>
                    </div>
                    <div className={`rounded-md border px-3 py-2 transition-colors ${aiAnalysis.data ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-white/5'}`}>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Online</p>
                      <p className={`mt-1 text-xs font-bold ${aiAnalysis.data ? 'text-primary' : 'text-white/80'}`}>
                        {displayCrackTimes.online}
                      </p>
                    </div>
                    <div className={`rounded-md border px-3 py-2 transition-colors ${aiAnalysis.data ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-white/5'}`}>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Offline PC</p>
                      <p className={`mt-1 text-xs font-bold ${aiAnalysis.data ? 'text-primary' : 'text-white/80'}`}>
                        {displayCrackTimes.offline}
                      </p>
                    </div>
                    <div className={`rounded-md border px-3 py-2 transition-colors ${aiAnalysis.data ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-white/5'}`}>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">GPU Array</p>
                      <p className={`mt-1 text-xs font-bold ${aiAnalysis.data ? 'text-primary' : 'text-white/80'}`}>
                        {displayCrackTimes.gpu}
                      </p>
                    </div>
                  </div>

                  {/* Feedback Box */}
                  <div className="mt-4 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {aiAnalysis.data ? "Analysis" : "Pattern Feedback"}
                    </p>
                    <p className="mt-1 text-xs text-white/80">
                      {aiAnalysis.data?.aiNote || entropy.warning || entropy.feedback[0] || "No common patterns detected. Waiting for audit..."}
                    </p>
                  </div>

                  {!aiAnalysis.data && entropy.feedback.length > 1 && (
                    <ul className="mt-3 space-y-1 text-xs text-white/40">
                      {entropy.feedback.slice(1).map((suggestion) => (
                        <li key={suggestion}>• {suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    className="w-full sm:flex-1 bg-primary text-black hover:bg-white rounded-[5px] uppercase tracking-[0.2em] font-bold cursor-pointer"
                  >
                    Save Password
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAdd(false);
                      setAiAnalysis({ isLoading: false, data: null });
                    }}
                    className="w-full sm:w-auto border border-white/20 hover:border-red-500/50 rounded-[5px] uppercase tracking-[0.2em] font-bold cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Passwords List */}
        <motion.div layout className="space-y-4">
          <h2 className="text-lg font-bitcount uppercase text-gray-300 mb-4">
            Saved Passwords ({passwords.length})
          </h2>

          {passwords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No saved passwords yet. Add one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {passwords.map((pwd) => {
                  const isBreach = breachedIds.has(pwd.id);
                  return (
                    <div key={pwd.id} className="mb-4 last:mb-0">
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <motion.div
                            layout
                            onClick={() => setSelectedPassword(pwd)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`p-4 border rounded-lg transition-all cursor-pointer ${
                              isBreach
                                ? "border-red-500/50 bg-red-500/5"
                                : "border-white/10 bg-[rgba(20,19,19,0.637)] hover:border-primary/30 cursor-context-menu"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-sm">
                                    {pwd.site_name}
                                  </h3>
                                  {isBreach && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded text-xs text-red-400">
                                      <AlertTriangle size={12} /> Pwned
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-white/40">
                                  {pwd.username_or_email || "No email"}
                                </p>
                                <p className="text-xs text-white/40 mt-1">
                                  {visibleIds.has(pwd.id)
                                    ? pwd.encrypted_password
                                    : "••••••••"}
                                </p>
                              </div>

                              <div className="hidden sm:flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePasswordVisibility(pwd.id);
                                  }}
                                  className="p-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-none transition-all"
                                  title="Toggle visibility"
                                >
                                  {visibleIds.has(pwd.id) ? (
                                    <EyeOff size={16} />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyPassword(pwd.encrypted_password);
                                  }}
                                  className="p-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-none transition-all"
                                  title="Copy password"
                                >
                                  {copiedId === pwd.encrypted_password ? (
                                    <Check size={16} className="text-green-400" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePassword(pwd.id);
                                  }}
                                  className="p-2 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 rounded-none transition-all"
                                  title="Delete password"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="sm:hidden">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-none transition-all"
                                      title="More actions"
                                    >
                                      <MoreVertical size={16} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="font-inconsolata text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        togglePasswordVisibility(pwd.id);
                                      }}
                                    >
                                      {visibleIds.has(pwd.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                      {visibleIds.has(pwd.id) ? "Hide Password" : "View Password"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        copyPassword(pwd.encrypted_password);
                                      }}
                                    >
                                      {copiedId === pwd.encrypted_password ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                      {copiedId === pwd.encrypted_password ? "Copied" : "Copy Password"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-400 focus:text-red-300"
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        handleDeletePassword(pwd.id);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      Delete Password
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </motion.div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="font-inconsolata text-xs w-48 bg-white/10 border-white/20 backdrop-blur-sm">
                          <ContextMenuItem
                            onClick={() => setSelectedPassword(pwd)}
                            className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10"
                          >
                            <Eye size={12} className="mr-2" />
                            View details
                          </ContextMenuItem>
                          <ContextMenuSeparator className="bg-white/10" />
                          <ContextMenuItem
                            onClick={() => copyPassword(pwd.encrypted_password)}
                            className="cursor-pointer text-white/80 hover:text-white hover:bg-white/10"
                          >
                            <Copy size={12} className="mr-2" />
                            Copy password
                          </ContextMenuItem>
                          <ContextMenuSeparator className="bg-white/10" />
                          <ContextMenuItem
                            onClick={() => handleDeletePassword(pwd.id)}
                            className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 size={12} className="mr-2" />
                            Delete
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            onClick={closePasswordDialog}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg border border-white/15 bg-[rgba(10,10,10,0.9)] backdrop-blur-xl rounded-[10px] p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bitcount uppercase text-primary">Credential Details</h3>
                  <button
                    onClick={closePasswordDialog}
                    className="text-xs uppercase tracking-[0.2em] text-white/70 hover:text-primary transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Site Name</p>
                    <p className="text-sm text-white wrap-break-word">{selectedPassword.site_name || "Not available"}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Email / Username</p>
                    <p className="text-sm text-white break-all">{selectedPassword.username_or_email || "Not available"}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Password</p>
                    <p className="text-sm text-white break-all">{selectedPassword.encrypted_password || "Not available"}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}