import { Geist, Geist_Mono, Bitcount_Prop_Double, Inconsolata } from "next/font/google";
import "./globals.css";
import { MfaReauthWatcher } from "@/components/mfa-reauth-watcher";

const bitCount = Bitcount_Prop_Double({
  variable: "--font-bitcount",
  subsets: ["latin"],
});

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cipher Gate",
  description: "Your secure gateway to the digital world.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${bitCount.variable} ${inconsolata.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <MfaReauthWatcher />
        {children}
      </body>
    </html>
  );
}
