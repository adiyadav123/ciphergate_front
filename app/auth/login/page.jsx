"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle
} from "lucide-react";


import { EncryptedText } from "@/components/ui/encrypted-text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/env";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', msg: "Passwords mismatch." });
      setIsLoading(false);
      return;
    }

    const endpoint = isLogin ? "/auth/login" : "/auth/register";

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          
          const session = {
            user: { id: data.user_id, email: formData.email, masterPass: formData.password },
            time: Date.now(),
            mfaVerified: false,
          };
          localStorage.setItem('cipher_session', JSON.stringify(session));
          
          setStatus({ type: 'success', msg: "Authentication verified. Redirecting..." });
          setTimeout(() => {
            window.location.href = "/auth/mfa";
          }, 1500);
        } else {
          setStatus({ type: 'success', msg: "Node initialized. You may now login." });
          setIsLogin(true);
        }
      } else {
        setStatus({ type: 'error', msg: data.detail || "Access denied." });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: "Connection failed." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-screen w-full flex items-center justify-center flex-col text-white font-inconsolata px-6 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-primary/10 blur-[120px] rounded-full -z-10" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-primary text-4xl font-bitcount transition-all duration-200 uppercase">
          {isLogin ? "Login to " : "Join "} 
          <EncryptedText text="Cipher Gate" revealedClassName="text-white" revealDelayMs={100} />
        </h1>
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        layout
        className="w-full max-w-137.5 rounded-[20px] bg-[rgba(20,19,19,0.637)] border border-white/5 p-10 backdrop-blur-xl shadow-2xl"
      >
        <form onSubmit={handleAuth} className="space-y-6">
          
          <div className="space-y-3">
            <Label htmlFor="email" className="text-gray-400 text-lg ml-1 block">
              Email
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                id="email"
                placeholder="operator@ciphergate.net" 
                className="h-14 bg-black/40 border-gray-600 text-xl pl-12 focus:border-primary transition-all rounded-[5px]"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-gray-400 text-lg ml-1 block">
                Your Password
              </Label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => (window.location.href = "/auth/recover")}
                  className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                id="password"
                placeholder="Password" 
                className="h-14 bg-black/40 border-gray-600 text-xl pl-12 pr-12 focus:border-primary transition-all rounded-[5px]"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <Label className="text-gray-400 text-lg ml-1 block">
                  Verify Password
                </Label>
                <Input 
                  placeholder="Repeat Password" 
                  className="h-14 bg-black/40 border-gray-600 text-xl focus:border-primary transition-all rounded-[5px]"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            disabled={isLoading}
            className="w-full h-14 bg-primary text-black font-black uppercase tracking-[0.2em] rounded-[5px] hover:bg-white transition-all text-lg mt-4 cursor-pointer flex items-center justify-center"
          >
            {isLoading ? "Processing..." : isLogin ? (
              <span className="flex items-center gap-2">Login <LogIn size={20} /></span>
            ) : (
              <span className="flex items-center gap-2">Register <UserPlus size={20} /></span>
            )}
          </Button>
        </form>

        {/* Status Messaging */}
        <AnimatePresence>
          {status && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 p-4 border flex items-center gap-3 ${
                status.type === 'success' 
                  ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                  : 'bg-red-500/5 border-red-500/20 text-red-400'
              }`}
            >
              {status.type === 'success' ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
              <span className="text-xs font-bold uppercase tracking-wider">{status.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Toggle */}
        <div className="mt-10 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setStatus(null); }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-all"
          >
            {isLogin ? (
              <>No account? <span className="text-primary underline">Register Now</span></>
            ) : (
              <>Already enrolled? <span className="text-primary underline">Authenticate</span></>
            )}
          </button>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="mt-12">
        <button 
          onClick={() => window.location.href = '/'}
          className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2 uppercase text-[10px] font-black tracking-[0.4em] cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to home page
        </button>
      </div>
    </div>
  );
}