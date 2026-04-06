"use client";

import { useEffect, useState, useRef } from "react";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { Button } from "@/components/ui/button";
import { 
  ArrowBigRight, 
  Shield, 
  Lock, 
  Smartphone, 
  ShieldAlert, 
  Terminal, 
  Cpu, 
  Activity,
  Command
} from "lucide-react";
import { useRouter } from "next/navigation";
 
export default function Home() {
  const [visibleButton, setVisibleButton] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("cipher_session");
    if (isLoggedIn) {
      router.push("/auth/mfa");
      return;
    }
    const timer = setTimeout(() => {
      setVisibleButton(true);
    }, 4000);
    return () => clearTimeout(timer); 
  }, []);

  const handleDockClick = () => {
    router.push("/documentation");
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-primary/30 overflow-x-hidden font-inconsolata max-w-screen">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Shield className="text-primary group-hover:rotate-12 transition-transform" size={20} />
            <span className=" tracking-tighter text-[20px] italic">CipherGate</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-[15px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors cursor-pointer" onClick={handleDockClick}>
              Documentation
            </button>
            
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center min-h-screen pt-20 text-center px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-100 bg-[#9333ea]/10 blur-[120px] rounded-full -z-10" />
        
        <h1 className="text-5xl md:text-7xl font-bitcount text-white">
          <EncryptedText text="Cipher Gate" revealDelayMs={340} />
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl">
          <EncryptedText text="Your secure gateway to the digital world." revealDelayMs={100} />
        </p>
        <div
          className={`mt-8 transform transition-all duration-700 ease-out ${
            visibleButton ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-primary cursor-pointer min-w-32 h-10 text-[18px] py-6 px-8 rounded-none border border-primary hover:rounded-[15px] hover:bg-transparent hover:text-primary transition-all" onClick={() => router.push("/auth/login")}>
              Login <ArrowBigRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="border-gray-800 text-black min-w-32 h-10 text-[18px] py-6 px-8 rounded-none hover:rounded-[15px] hover:bg-gray-900 hover:text-white transition-all cursor-pointer" onClick={handleDockClick}>
              Documentation <ArrowBigRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4 group">
            <div className="w-12 h-12 bg-[#9333ea]/10 flex items-center justify-center text-primary rounded-xl border border-[#9333ea]/20 group-hover:scale-110 transition-transform">
              <Smartphone size={24} />
            </div>
            <h3 className="text-xl  font-bitcount uppercase tracking-tight">Auth Engine</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-mono">Hardware-grade TOTP generation using the RFC 6238 standard for bit-perfect synchronization.</p>
          </div>
          <div className="space-y-4 group">
            <div className="w-12 h-12 bg-blue-500/10 flex items-center justify-center text-blue-500 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Lock size={24} />
            </div>
            <h3 className="text-xl  font-bitcount uppercase tracking-tight">Zero-Knowledge</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-mono">AES-256-GCM local encryption. Plaintext never leaves your machine, ensuring metadata privacy.</p>
          </div>
          <div className="space-y-4 group">
            <div className="w-12 h-12 bg-red-500/10 flex items-center justify-center text-red-500 rounded-xl border border-red-500/20 group-hover:scale-110 transition-transform">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-xl  font-bitcount uppercase tracking-tight">Neural Audit</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-mono">k-Anonymity breach detection monitoring credentials via industry-standard leak databases.</p>
          </div>
        </div>
      </section>

      {/* THE ARCHITECTS (CREDITS) */}
      <section className="py-32 px-6 bg-white/1 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-2">Internal Infrastructure</h2>
            <h3 className="text-4xl md:text-6xl  font-bitcount uppercase tracking-tighter italic">The Architects</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {/* Aditya Card */}
            <div className="p-10 bg-black border border-white/10 rounded-[2.5rem] group hover:border-[#9333ea]/50 transition-all relative overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Terminal size={300} />
              </div>
              <div className="w-16 h-16 bg-[#9333ea] rounded-2xl flex items-center justify-center  text-black mb-8 text-xl shadow-[0_0_20px_rgba(147,51,234,0.4)]">AY</div>
              <h4 className="text-3xl  tracking-tight">Aditya Yadav</h4>
              <p className="text-[11px] uppercase font-black text-primary tracking-[0.2em] mb-6 italic">Lead Cryptographic Architect</p>
              <p className="text-gray-400 leading-relaxed mb-8 font-mono">Engineered the Zero-Knowledge backend clusters, Python microservices, and hash synchronization logic.</p>
              <div className="flex gap-6">
                
              </div>
            </div>

            {/* Aditi Card */}
            <div className="p-10 bg-black border border-white/10 rounded-[2.5rem] group hover:border-blue-500/50 transition-all relative overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Cpu size={300} />
              </div>
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center  text-white mb-8 text-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">AS</div>
              <h4 className="text-3xl  tracking-tight">Aditi Shukla</h4>
              <p className="text-[11px] uppercase font-black text-blue-400 tracking-[0.2em] mb-6 italic">Security UX Systems Lead</p>
              <p className="text-gray-400 leading-relaxed mb-8 font-mono">Designed the motion-fluid interface and client-side encryption workflows using Web Crypto API.</p>
             
            </div>
          </div>
        </div>
      </section>

      

      {/* FOOTER */}
      <footer className="py-20 px-6 text-center border-t border-white/5 mt-auto bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6 opacity-30">
            <Shield size={20} />
            <div className="w-px h-4 bg-white/20" />
            <span className="text-[10px] font-black uppercase tracking-[0.8em]">CipherGate Network</span>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 mb-8 text-[11px]  text-white uppercase tracking-widest">
            <div className="flex items-center gap-2 justify-center"><Activity size={14} className="text-primary"/> <span>Neural Status: Active</span></div>
            <div className="flex items-center gap-2 justify-center"><Command size={14} className="text-primary"/> <span>Zero-Knowledge Env</span></div>
          </div>
          <p className="text-[15px] text-white font-medium">Built by Aditi Shukla × Aditya Yadav</p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
      `}</style>
    </div>
  );
}