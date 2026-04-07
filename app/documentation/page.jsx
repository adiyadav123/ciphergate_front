"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Terminal, 
  Cpu, 
  Lock, 
  Smartphone, 
  ChevronLeft,
  ShieldAlert,
  Fingerprint,
  FileText,
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { EncryptedText } from '@/components/ui/encrypted-text';
 
/**
 * INTERNAL UI COMPONENTS
 * Inlined to resolve environment path errors and provide a seamless preview.
 */

const Button = ({ children, className = "", variant = "default", ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-primary text-black hover:bg-primary/90",
    outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
    ghost: "hover:bg-white/5 text-gray-400 hover:text-white"
  };
  const router = useRouter();
  
  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};



// --- DOCS COMPONENTS ---

const DocSection = ({ title, icon: Icon, children, delay = 0 }) => (
  <motion.section 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="mb-16 group"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20 group-hover:border-primary/50 transition-all">
        <Icon size={20} />
      </div>
      <h2 className="text-2xl  tracking-tight uppercase text-white font-bitcount">
        {title}
      </h2>
    </div>
    <div className="pl-2 border-l border-white/5 space-y-4">
      {children}
    </div>
  </motion.section>
);

const TechBadge = ({ children }) => (
  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-gray-400 uppercase tracking-widest mr-2 inline-block mb-2">
    {children}
  </span>
);

export default function Documentation() {

  const router = useRouter();
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 font-inconsolata">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/80 backdrop-blur-md px-6 py-2">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/')}>
            <Shield className="text-primary" size={18} />
            <span className=" tracking-tighter text-base italic uppercase">CipherGate</span>
          </div>
          <Button 
            variant="ghost" 
            className="text-[10px] uppercase  tracking-widest text-gray-500 hover:text-primary"
            onClick={() => router.push('/')}
          >
            <ChevronLeft size={14} className="mr-1" /> Return to Base
          </Button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        
        {/* HEADER */}
        <header className="mb-20 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl  mb-4 font-bitcount">
            <EncryptedText text="System Protocol" revealDelayMs={100} />
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl font-mono">
            Technical specifications and architectural overview of the CipherGate security perimeter.
          </p>
        </header>

        {/* 1. OVERVIEW */}
        <DocSection title="Core Mission" icon={FileText} delay={0.1}>
          <p className="text-gray-400 leading-relaxed max-w-3xl font-mono">
            CipherGate is designed to solve the "Trust" problem in digital storage. Unlike traditional vault services that store your keys on their servers, our architecture utilizes a <span className="text-white ">Zero-Knowledge</span> model where the server is blind to your actual data.
          </p>
          <div className="flex flex-wrap mt-4">
            <TechBadge>AES-256-GCM</TechBadge>
            <TechBadge>PBKDF2-SHA256</TechBadge>
            <TechBadge>PYTHON FASTAPI</TechBadge>
            <TechBadge>NEXT.JS 15</TechBadge>
          </div>
        </DocSection>

        {/* 2. ENCRYPTION ENGINE */}
        <DocSection title="Encryption Engine" icon={Lock} delay={0.2}>
          <p className="text-gray-400 leading-relaxed font-mono">
            Every secure object (Passwords, Notes, Bookmarks) undergoes local client-side transformation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-mono">
            <div className="p-5 bg-white/2 border border-white/5 rounded-xl">
              <h4 className="text-primary  mb-2 uppercase text-xs tracking-widest">Key Derivation</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your Master Password is fed into a PBKDF2 function with 100,000 iterations to generate a unique 256-bit symmetric key.
              </p>
            </div>
            <div className="p-5 bg-white/2 border border-white/5 rounded-xl">
              <h4 className="text-primary  mb-2 uppercase text-xs tracking-widest">Payload Isolation</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                We use AES-GCM (Galois/Counter Mode) to ensure both confidentiality and integrity of your encrypted snippets.
              </p>
            </div>
          </div>
        </DocSection>

        {/* 3. TOTP ARCHITECTURE */}
        <DocSection title="Auth Infrastructure" icon={Smartphone} delay={0.3}>
          <p className="text-gray-400 leading-relaxed font-mono">
            The Multi-Factor Authentication (MFA) layer complies with <span className="text-white  text-sm tracking-tighter italic">RFC 6238</span>.
          </p>
          <ul className="mt-4 space-y-3 font-mono">
            <li className="flex items-start gap-2 text-sm text-gray-500">
              <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
              <span>Seeds are generated using a cryptographically secure pseudo-random number generator (CSPRNG).</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-500">
              <div className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
              <span>Real-time HMAC-SHA1 signatures are calculated every 30 seconds for verification.</span>
            </li>
          </ul>
        </DocSection>

        {/* 4. BACKEND STACK */}
        <DocSection title="Microservices" icon={Terminal} delay={0.4}>
          <p className="text-gray-400 leading-relaxed font-mono">
            The infrastructure is powered by a high-performance Python ecosystem designed by Aditi Shukla and Aditya Yadav.
          </p>
          <div className="mt-6 p-6 bg-black border border-white/5 rounded-2xl font-mono text-xs text-gray-400">
            <div className="flex gap-2 mb-2 text-primary ">
              <span>$</span>
              <span className="text-white">analyze --backend-stack</span>
            </div>
            <div className="space-y-1">
              <p>{'>'} Framework: FastAPI (Asynchronous)</p>
              <p>{'>'} DB Logic: Supabase / PostgreSQL</p>
              <p>{'>'} Security: Bcrypt (Password Hashing)</p>
              <p>{'>'} Integrity: k-Anonymity (HIBP API)</p>
            </div>
          </div>
        </DocSection>

        {/* 5. PRIVACY PROTOCOL */}
        <DocSection title="Breach Auditing" icon={ShieldAlert} delay={0.5}>
          <p className="text-gray-400 leading-relaxed font-mono">
            To check if your passwords are leaked, we use a privacy-preserving model. We never send your password to the internet. Instead, we send the first <span className="text-white ">5 characters</span> of your SHA-1 hash to the server.
          </p>
        </DocSection>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 pt-12 border-t border-white/5 flex flex-col items-center"
        >
          <p className="text-gray-500 text-xs uppercase tracking-[0.3em] mb-6 ">End of Documentation</p>
          <Button 
            className="bg-primary text-black  h-12 px-10 rounded-none hover:rounded-[15px] hover:bg-transparent hover:text-primary border border-primary transition-all text-xs tracking-widest uppercase cursor-pointer"
            onClick={() => router.push('/auth/login')}
          >
            Login
          </Button>
        </motion.div>

      </main>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 bg-black">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center opacity-30 grayscale transition-all hover:grayscale-0 hover:opacity-100">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Fingerprint size={20} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">CIPHERGATE</span>
          </div>
          <div className="flex items-center gap-8 text-[10px]  uppercase tracking-widest text-gray-500">
            <span>Aditi Shukla</span>
            <span>Aditya Yadav</span>
          </div>
        </div>
      </footer>

      <style>{`
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
      `}</style>
    </div>
  );
}