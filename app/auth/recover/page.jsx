"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/env";

export default function RecoverPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    recoveryKey: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleRecover = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/recovery/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          recovery_key: formData.recoveryKey,
          new_password: formData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Recovery failed");
      }

      setStatus({ type: "success", msg: "Password reset complete. Redirecting to login..." });
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1200);
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Recovery failed." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen w-full flex items-center justify-center text-white font-inconsolata px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-[20px] bg-[rgba(20,19,19,0.637)] border border-white/10 p-8"
      >
        <h1 className="text-3xl text-primary font-bitcount uppercase flex items-center gap-2">
          <KeyRound size={20} /> Account Recovery
        </h1>
        <p className="mt-3 text-sm text-gray-400">
          Enter your account email, recovery key, and a new password.
        </p>

        <form onSubmit={handleRecover} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-400">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="operator@ciphergate.net"
              className="h-12 bg-black/40 border-gray-600"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recovery-key" className="text-gray-400">Recovery Key</Label>
            <Input
              id="recovery-key"
              placeholder="ABCD-EFGH-IJKL-MNOP-QRST-UVWX"
              className="h-12 bg-black/40 border-gray-600 font-mono"
              value={formData.recoveryKey}
              onChange={(e) => setFormData({ ...formData, recoveryKey: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-gray-400">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="New password"
              className="h-12 bg-black/40 border-gray-600"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-gray-400">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repeat new password"
              className="h-12 bg-black/40 border-gray-600"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold"
          >
            {isLoading ? "Recovering..." : "Reset Password"}
          </Button>
        </form>

        {status && (
          <div
            className={`mt-5 p-3 border flex items-center gap-2 text-sm ${
              status.type === "success"
                ? "bg-green-500/5 border-green-500/25 text-green-400"
                : "bg-red-500/5 border-red-500/25 text-red-400"
            }`}
          >
            {status.type === "success" ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
            <span>{status.msg}</span>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-primary flex items-center justify-center gap-2 w-full"
          >
            <ArrowLeft size={14} /> Back to login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
