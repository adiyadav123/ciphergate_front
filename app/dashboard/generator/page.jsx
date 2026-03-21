"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  RotateCw,
  ArrowLeft,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/env";

export default function PasswordGeneratorPage() {
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
  }, []);

  const [baseString, setBaseString] = useState("");
  const [variants, setVariants] = useState([]);
  const [showVariants, setShowVariants] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shufflingId, setShufflingId] = useState(null);
  const [status, setStatus] = useState(null);

  const [params, setParams] = useState({
    length: 16,
    includeUppercase: true,
    includeNumbers: true,
    includeSpecial: true,
    excludeAmbiguous: true,
  });

  const buildPayload = (count = 5) => ({
    base_string: baseString,
    length: params.length,
    include_uppercase: params.includeUppercase,
    include_numbers: params.includeNumbers,
    include_special: params.includeSpecial,
    exclude_ambiguous: params.excludeAmbiguous,
    count,
  });

  const generateVariants = async () => {
    if (!baseString.trim()) return;
    setIsGenerating(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/tools/password/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(5)),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to generate passwords");
      }

      const normalized = (data.variants || []).map((v, idx) => ({
        id: idx,
        password: v.password,
        strength: v.strength,
      }));
      setVariants(normalized);
      setShowVariants(normalized.length > 0);
      setStatus({ type: "success", msg: "Secure variants generated." });
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Generator service failed." });
    } finally {
      setIsGenerating(false);
    }
  };

  const shuffleVariant = async (id) => {
    if (!baseString.trim()) return;
    setShufflingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/tools/password/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(1)),
      });
      const data = await res.json();
      if (!res.ok || !data?.variants?.length) {
        throw new Error(data.detail || "Unable to shuffle password");
      }
      const replacement = data.variants[0];
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, password: replacement.password, strength: replacement.strength } : v))
      );
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Shuffle failed." });
    } finally {
      setShufflingId(null);
    }
  };

  const copyPassword = (pwd) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(pwd);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-inconsolata">
      {/* Header */}
      <div className="border-b border-white/10 bg-[rgba(20,19,19,0.637)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bitcount text-primary uppercase">
            Password Generator
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 border border-white/10 bg-[rgba(20,19,19,0.637)] p-6 rounded-xl"
        >
         
          <h2 className="text-lg font-bitcount uppercase mb-3 text-gray-300">Base String</h2>
          <p className="text-xs text-gray-500 mb-4">
            Enter a word or phrase, and we'll generate secure password variants
            from it.
          </p>
          <Input
            placeholder="e.g., mysecureword"
            value={baseString}
            onChange={(e) => setBaseString(e.target.value)}
            className="bg-black/40 border-gray-600 mb-4"
          />

          {/* Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 border border-white/10 rounded-lg bg-black/20">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Length: {params.length}
              </Label>
              <input
                type="range"
                min="8"
                max="32"
                value={params.length}
                onChange={(e) =>
                  setParams({ ...params, length: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.includeUppercase}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      includeUppercase: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="uppercase tracking-widest">
                  Include Uppercase
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.includeNumbers}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      includeNumbers: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="uppercase tracking-widest">Include Numbers</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.includeSpecial}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      includeSpecial: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="uppercase tracking-widest">
                  Include Special Chars
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.excludeAmbiguous}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      excludeAmbiguous: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="uppercase tracking-widest">
                  Exclude Ambiguous (i, l, O, 0)
                </span>
              </label>
            </div>
          </div>

          <Button
            onClick={generateVariants}
            disabled={!baseString.trim() || isGenerating}
            className="w-full bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold h-12"
          >
            {isGenerating ? "Generating..." : "Generate Variants"}
          </Button>

          {status && (
            <div
              className={`mt-4 p-3 border text-xs uppercase tracking-[0.15em] flex items-center gap-2 ${
                status.type === "success"
                  ? "border-green-500/30 bg-green-500/5 text-green-400"
                  : "border-red-500/30 bg-red-500/5 text-red-400"
              }`}
            >
              {status.type === "error" && <AlertCircle size={14} />}
              <span>{status.msg}</span>
            </div>
          )}
        </motion.div>

        {/* Variants Display */}
        {showVariants && variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-bitcount uppercase mb-4 text-gray-300">
              Password Variants
            </h2>

            <div className="space-y-3">
              {variants.map((variant) => (
                <motion.div
                  key={variant.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: variant.id * 0.1 }}
                  className="p-4 border border-white/10 bg-[rgba(20,19,19,0.637)] rounded-lg group hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm break-all text-gray-300 mb-1">
                        {variant.password}
                      </p>
                      <p className="text-xs text-gray-500">
                        Strength:{" "}
                        <span
                          className={
                            variant.strength === "Strong"
                              ? "text-green-400"
                              : variant.strength === "Good"
                              ? "text-yellow-400"
                              : "text-orange-400"
                          }
                        >
                          {variant.strength}
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => shuffleVariant(variant.id)}
                        disabled={shufflingId === variant.id}
                        className="p-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-none transition-all"
                        title="Shuffle this password"
                      >
                        <RotateCw size={16} className={shufflingId === variant.id ? "animate-spin" : ""} />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyPassword(variant.password)}
                        className="p-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-none transition-all"
                        title="Copy password"
                      >
                        {copiedId === variant.password ? (
                          <Check size={16} className="text-green-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
