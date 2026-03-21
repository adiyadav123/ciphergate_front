"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Trash2,
  Plus,
  ArrowLeft,
  Check,
  Shield,
  QrCode,
  X,
  Camera,
  AlertCircle,
  Scan,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/env";

export default function AuthenticatorPage() {
  const [session, setSession] = useState(null);
  const [authenticators, setAuthenticators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanTimerRef = useRef(null);
  const streamRef = useRef(null);

  const [formData, setFormData] = useState({
    issuer: "",
    account_name: "",
    secret_key: "",
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
    fetchAuthenticators(parsed.user.id);
  }, []);

  const fetchAuthenticators = async (userId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/vault/all?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAuthenticators(data.auths || []);
      }
    } catch (err) {
      console.error("Failed to fetch authenticators:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAuthenticator = async (e) => {
    e.preventDefault();
    if (!formData.issuer.trim() || !formData.secret_key.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/vault/authenticator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          issuer: formData.issuer,
          account_name: formData.account_name,
          secret_key: formData.secret_key,
        }),
      });

      if (res.ok) {
        setFormData({
          issuer: "",
          account_name: "",
          secret_key: "",
        });
        setShowAdd(false);
        fetchAuthenticators(session.user.id);
      }
    } catch (err) {
      console.error("Failed to add authenticator:", err);
    }
  };

  const handleDeleteAuthenticator = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/authenticator/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAuthenticators(session.user.id);
      }
    } catch (err) {
      console.error("Failed to delete authenticator:", err);
    }
  };

  const copySecret = (secret) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(secret);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQr = async (authId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vault/authenticator/${authId}/qr?user_id=${session.user.id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Unable to generate QR preview");
      }
      setQrPreview(data);
    } catch (err) {
      console.error("Failed to fetch QR:", err);
    }
  };

  const stopScanner = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setScannerOpen(false);
  };

  const scanCurrentFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = canvas.toDataURL("image/png");

    try {
      const res = await fetch(`${API_BASE_URL}/tools/authenticator/scan-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data: imageData }),
      });
      const data = await res.json();
      if (!res.ok) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        issuer: data.issuer || prev.issuer,
        account_name: data.account_name || prev.account_name,
        secret_key: data.secret_key || prev.secret_key,
      }));
      setScanStatus({ type: "success", msg: "QR detected from live camera. Fields auto-filled." });
      stopScanner();
    } catch {
      // keep scanning silently until a valid frame is found
    }
  };

  const startScanner = async () => {
    setScanStatus(null);
    setScannerOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      scanTimerRef.current = setInterval(scanCurrentFrame, 1000);
    } catch (err) {
      setScanStatus({ type: "error", msg: "Camera access failed. Please allow camera permissions." });
      setScannerOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white font-inconsolata flex items-center justify-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
          Loading authenticators...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-inconsolata">
      {/* Header */}
      <div className="border-b border-white/10 bg-[rgba(20,19,19,0.637)] backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bitcount text-primary uppercase">
            Authenticators
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
        {/* Action Button */}
        <div className="mb-8 flex gap-3">
          <Button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold flex items-center gap-2"
          >
            <Plus size={16} /> Add Authenticator
          </Button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-6 border border-white/10 bg-[rgba(20,19,19,0.637)] rounded-lg"
            >
              <form onSubmit={handleAddAuthenticator} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Live QR Scanner (Camera)
                  </Label>
                  <Button
                    type="button"
                    onClick={startScanner}
                    className="w-full border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary rounded-none uppercase tracking-[0.2em]"
                  >
                    <Camera size={14} className="mr-2" /> Start Scanner
                  </Button>
                  <p className="text-xs text-gray-500">Use your camera to scan authenticator QR and auto-fill setup fields instantly.</p>
                </div>

                {scanStatus && (
                  <div
                    className={`p-3 border text-xs uppercase tracking-[0.15em] flex items-center gap-2 ${
                      scanStatus.type === "success"
                        ? "border-green-500/30 bg-green-500/5 text-green-400"
                        : "border-red-500/30 bg-red-500/5 text-red-400"
                    }`}
                  >
                    {scanStatus.type === "error" && <AlertCircle size={14} />}
                    <span>{scanStatus.msg}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Service/Issuer
                  </Label>
                  <Input
                    placeholder="e.g., Google, GitHub, AWS"
                    value={formData.issuer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        issuer: e.target.value,
                      })
                    }
                    className="bg-black/40 border-gray-600"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Account Name (Email/User)
                  </Label>
                  <Input
                    placeholder="user@example.com"
                    value={formData.account_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_name: e.target.value,
                      })
                    }
                    className="bg-black/40 border-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">
                    Secret Key (Base32)
                  </Label>
                  <Input
                    placeholder="Paste your secret key here"
                    value={formData.secret_key}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        secret_key: e.target.value,
                      })
                    }
                    className="bg-black/40 border-gray-600 font-mono"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This is the Base32 secret provided during authenticator setup.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    className="w-full sm:flex-1 bg-primary text-black hover:bg-white rounded-none uppercase tracking-[0.2em] font-bold"
                  >
                    Save Authenticator
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

        {/* Authenticators List */}
        <motion.div layout className="space-y-4">
          <h2 className="text-lg font-bitcount uppercase text-gray-300 mb-4">
            Backup Seeds ({authenticators.length})
          </h2>

          {authenticators.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No authenticator seeds saved yet. Start by adding one.
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {authenticators.map((auth) => (
                  <motion.div
                    key={auth.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 border border-white/10 bg-[rgba(20,19,19,0.637)] rounded-lg hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={16} className="text-primary" />
                          <h3 className="font-bold text-sm">
                            {auth.issuer}
                          </h3>
                        </div>
                        {auth.account_name && (
                          <p className="text-xs text-gray-400">
                            {auth.account_name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                          {auth.secret_key}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShowQr(auth.id)}
                          className="p-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-none transition-all"
                          title="Show setup QR"
                        >
                          <QrCode size={16} />
                        </button>

                        <button
                          onClick={() => copySecret(auth.secret_key)}
                          className="p-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-none transition-all"
                          title="Copy secret key"
                        >
                          {copiedId === auth.secret_key ? (
                            <Check size={16} className="text-green-400" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteAuthenticator(auth.id)}
                          className="p-2 border border-white/10 hover:border-red-500/50 hover:bg-red-500/5 rounded-none transition-all"
                          title="Delete authenticator"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {scannerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl border border-white/10 bg-[rgba(20,19,19,0.96)] p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bitcount uppercase text-primary flex items-center gap-2">
                    <Scan size={16} /> Live QR Scanner
                  </h3>
                  <button
                    onClick={stopScanner}
                    className="p-2 border border-white/10 hover:border-red-500/50"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="border border-primary/30 bg-black p-2">
                  <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <p className="mt-3 text-xs text-gray-400 text-center">
                  {isScanning ? "Scanning... hold QR steady." : "Scanner paused."}
                </p>
                <div className="mt-4 flex justify-center">
                  <Button
                    type="button"
                    onClick={stopScanner}
                    className="border border-white/20 hover:border-red-500/50 rounded-none uppercase tracking-[0.2em]"
                  >
                    <Square size={12} className="mr-2" /> Stop Scanner
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {qrPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md border border-white/10 bg-[rgba(20,19,19,0.96)] p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bitcount uppercase text-primary">Scan QR</h3>
                  <button
                    onClick={() => setQrPreview(null)}
                    className="p-2 border border-white/10 hover:border-red-500/50"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <img
                  src={qrPreview.qr_code_url}
                  alt="Authenticator QR"
                  className="mx-auto h-56 w-56 rounded-md border border-white/10 bg-white p-2"
                />
                <p className="mt-4 text-xs text-gray-400 text-center">
                  {qrPreview.issuer} - {qrPreview.account_name}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
