"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/env";

export default function PasswordManagerPage() {
  const [session, setSession] = useState(null);
  const [passwords, setPasswords] = useState([]);
  const [breachedIds, setBreachedIds] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [visibleIds, setVisibleIds] = useState(new Set());

  const [formData, setFormData] = useState({
    site_name: "",
    username_or_email: "",
    password: "",
  });

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
    if (!formData.site_name.trim() || !formData.password.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/vault/passwords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
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
        setShowAdd(false);
        fetchPasswords(session.user.id);
      }
    } catch (err) {
      console.error("Failed to add password:", err);
    }
  };

  const handleDeletePassword = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/passwords/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchPasswords(session.user.id);
      }
    } catch (err) {
      console.error("Failed to delete password:", err);
    }
  };

  const checkBreachedPasswords = async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tools/audit?user_id=${session.user.id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-inconsolata flex items-center justify-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
          Loading passwords...
        </p>
      </div>
    );
  }

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
            className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.2em] hover:text-primary transition-colors"
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
            className="bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Add Password
          </Button>

          <Button
            onClick={checkBreachedPasswords}
            disabled={checking}
            className="border border-white/10 bg-transparent hover:border-red-500/50 rounded-none uppercase tracking-[0.2em] font-bold flex items-center gap-2"
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

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    className="w-full sm:flex-1 bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold"
                  >
                    Save Password
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="w-full sm:w-auto border border-white/20 hover:border-red-500/50 rounded-none uppercase tracking-[0.2em] font-bold"
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
            <div className="space-y-3">
              <AnimatePresence>
                {passwords.map((pwd) => {
                  const isBreach = breachedIds.has(pwd.id);
                  return (
                    <motion.div
                      key={pwd.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-4 border rounded-lg transition-all ${
                        isBreach
                          ? "border-red-500/50 bg-red-500/5"
                          : "border-white/10 bg-[rgba(20,19,19,0.637)] hover:border-primary/30"
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
                          <p className="text-xs text-gray-400">
                            {pwd.username_or_email || "No email"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {visibleIds.has(pwd.id)
                              ? pwd.encrypted_password
                              : "••••••••"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePasswordVisibility(pwd.id)}
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
                            onClick={() => copyPassword(pwd.encrypted_password)}
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
                            onClick={() => handleDeletePassword(pwd.id)}
                            className="p-2 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 rounded-none transition-all"
                            title="Delete password"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
