"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Code2,
  FileText,
  FolderGit2,
  KeyRound,
  Lock,
  MessageSquareText,
  Shield,
  Sparkles,
  Table2,
  Terminal,
  TimerReset,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";

const keyStats = [
  { label: "Frontend", value: "Next.js App Router" },
  { label: "Backend", value: "FastAPI + Supabase" },
  { label: "Crypto", value: "Fernet, bcrypt, pyotp" },
  { label: "Core Modes", value: "Vault, chat, secrets, docs" },
];

const researchSections = [
  {
    id: "abstract",
    eyebrow: "Abstract",
    title: "CipherGate as a security-first personal control surface",
    icon: BookOpen,
    paragraphs: [
      "CipherGate is a security-oriented web application that combines a vault, an MFA-protected account shell, ephemeral collaboration tools, and a growing body of product documentation into a single workspace. The application is intentionally opinionated: it favors authenticated workflows, burn-after-read data flows, and encrypted persistence over convenience-first shortcuts.",
      "The project is implemented as a Next.js frontend paired with a FastAPI backend backed by Supabase/PostgreSQL. The codebase uses client-side session checks, MFA re-authentication windows, encrypted payload storage, and a lightweight security hardening guard to reduce casual misuse. The result is not merely a chat app with extras; it is a compact secure operating environment for personal credentials, notes, temporary data exchange, and instructional material.",
      "This paper documents the implemented system as it exists in the repository. It covers architecture, feature inventory, algorithms, mathematical models, threat assumptions, file-level responsibilities, and the design methods used to assemble the system. Where relevant, the discussion maps directly to concrete files and endpoints so the paper can function as a technical record rather than a product summary.",
    ],
    callout: "The application is intentionally split between persistent, encrypted user data and transient, session-bound state.",
    highlights: [
      "Encrypted persistence is reserved for long-lived user data.",
      "Transient state is used where content should disappear by design.",
    ],
  },
  {
    id: "overview",
    eyebrow: "System Overview",
    title: "Product structure and user-facing modules",
    icon: FolderGit2,
    paragraphs: [
      "The frontend uses the Next.js App Router under `frontend/app`, with separate routes for the landing page, authentication flows, dashboard home, passwords, authenticators, generator, security guide, documentation, secrets, and chat. This route design mirrors the product's internal separation: each capability is a focused tool rather than a generic all-in-one shell.",
      "The dashboard acts as the operational hub. It summarizes stored bookmarks, notes, passwords, and authenticator seeds, then exposes navigation cards to the generator, password manager, authenticator vault, chat system, research papers, security guide, and one-time secret notes. The page also exposes account controls such as recovery key download and logout. In practice, the dashboard is the product's command center.",
      "The backend exposes a collection of REST endpoints in `main.py` and coordinates with helper modules such as `auth_logic.py` and `dashboard_manager.py`. Data is persisted through Supabase when it is meant to survive session boundaries, while certain features such as ephemeral one-time secrets and chat-room presence rely on transient in-memory state because their lifecycle is intentionally short.",
    ],
  },
  {
    id: "methodology",
    eyebrow: "Methodology",
    title: "How the report was assembled",
    icon: FileText,
    paragraphs: [
      "This report was produced through direct repository inspection rather than reconstruction from memory. Primary evidence came from the backend entry point in `main.py`, the shared auth helpers in `auth_logic.py`, the password-generation logic in `dashboard_manager.py`, and the Next.js route files that implement the dashboard and public-facing pages.",
      "The analysis combined static reading with route-level validation. That means the report cross-checked code paths, screen flows, endpoint names, and state transitions against the actual source tree instead of describing the system abstractly. Where the report mentions a feature, it is intended to correspond to a concrete implementation path in the repository.",
      "This approach favors traceability over abstraction. It makes the report useful as an implementation record because each claim can be tied back to a file, route, or endpoint family in the codebase.",
    ],
    bullets: [
      "Static source review across backend, frontend, and shared utility files.",
      "Route mapping to verify that UI claims match the actual app structure.",
      "Endpoint inventorying for auth, vault, chat, secrets, and tooling APIs.",
      "Cross-checking of visible UI states against their persistence and session rules.",
    ],
    highlights: [
      "The report is evidence-driven, not speculative.",
      "Every major claim is anchored to source files or endpoints.",
    ],
  },
  {
    id: "threat-model",
    eyebrow: "Threat Model",
    title: "Security assumptions and adversary boundaries",
    icon: Shield,
    paragraphs: [
      "CipherGate is built under a pragmatic threat model. The application assumes that the browser can be inspected, that user sessions can be interrupted, and that users will occasionally try to access a protected tool after MFA has expired. The frontend therefore checks sessions aggressively and re-routes the user to login or MFA flows whenever the time window elapses.",
      "The system also assumes that user-generated content may be hostile. Bookmarks, notes, chat content, and secret notes are all treated as untrusted input. The frontend sanitizes HTML before rendering rich text; the backend encrypts or validates where appropriate; and the dashboard includes a client-side hardening layer that blocks context menus and common devtools shortcuts on dashboard routes.",
      "The strongest boundary in the codebase is not perfect secrecy at the browser level. It is the combination of encrypted storage, short-lived session authorization, ephemeral room state, one-time note destruction, and deliberate friction for sensitive actions. That is a realistic security posture for a browser-delivered personal productivity tool.",
    ],
    bullets: [
      "Assumes the browser is observable, but still raises the cost of casual inspection.",
      "Treats rich user input as unsafe until sanitized or structured.",
      "Uses MFA expiration to reduce the lifetime of a compromised session.",
      "Prefers explicit user re-authentication for high-impact actions.",
    ],
    highlights: [
      "Security is layered instead of pretending the browser is a trusted vault.",
      "MFA expiration is part of the threat model, not an afterthought.",
    ],
  },
  {
    id: "frontend",
    eyebrow: "Frontend Architecture",
    title: "React, Next.js, and motion-driven interface composition",
    icon: Code2,
    paragraphs: [
      "The frontend is built with React client components inside Next.js. Pages such as the dashboard and chat room are client components because they depend on local session state, browser storage, animation hooks, clipboard access, and live interaction. The project uses Framer Motion for staged entrance transitions, list animations, and subtle motion cues that give the interface a deliberate, instrument-panel feel.",
      "A small set of shared UI primitives in `frontend/components/ui` provides consistency across the application. These include a button system, input system, select component, dropdown and context menus, an alert dialog, and a toaster wrapper. The style is cohesive: dark surfaces, high-contrast primary accents, sharp typography, and rounded controls that feel deliberate rather than generic.",
      "The landing page, dashboard, and specialized tools all use the same visual language. The design favors focus and legibility over ornamental clutter. That matters in a security product because the interface must communicate state clearly: whether MFA is active, whether a room is connected, whether a note is expired, and whether a record is safe to edit or delete.",
    ],
    bullets: [
      "Next.js App Router for route-separated product surfaces.",
      "Framer Motion for soft entry, hover, and reveal animation.",
      "Shared design tokens through Tailwind and shadcn-style primitives.",
      "Browser-only state for clipboard, local storage, and history behavior.",
    ],
    highlights: [
      "Motion is used to guide attention, not to decorate empty space.",
      "Shared UI primitives keep the dashboard and tools visually aligned.",
    ],
  },
  {
    id: "auth",
    eyebrow: "Authentication and Recovery",
    title: "Password verification, TOTP MFA, and account recovery",
    icon: KeyRound,
    paragraphs: [
      "The authentication flow is centered on password-based sign-in followed by TOTP verification. The helper module `auth_logic.py` hashes passwords with bcrypt, generates TOTP secrets with pyotp, and verifies 6-digit codes with a valid time window. The MFA flow is not decorative; the dashboard, vault, chat, and other protected pages all check session validity and re-route if MFA is missing or expired.",
      "The MFA re-auth window is enforced through session metadata and a countdown displayed on the dashboard. Once the session ages past the configured re-auth threshold, the application prompts the user to return to MFA before sensitive operations continue. This is used consistently across the secure pages, so the user experience matches the security policy instead of hiding it.",
      "Account recovery is handled through a derived recovery key. The backend can derive a user-specific recovery token from user identity and a server-side secret, allowing the user to download an offline recovery kit. The dashboard offers the download action directly, emphasizing that recovery belongs outside the browser and should be stored offline.",
    ],
    formula: "TOTP(t) = Truncate(HMAC-SHA1(secret, floor(t / 30))) mod 10^6",
    highlights: [
      "The MFA window is enforced across protected pages, not just sign-in.",
      "Recovery lives outside the browser so it can be stored offline.",
    ],
  },
  {
    id: "vault",
    eyebrow: "Vault Subsystem",
    title: "Passwords, bookmarks, notes, and authenticator seeds",
    icon: Lock,
    paragraphs: [
      "The vault subsystem is the persistent storage core of CipherGate. It stores passwords, bookmarks, rich notes, and authenticator seeds. Passwords are encrypted on the backend; notes are stored with HTML sanitization at the interface layer; bookmarks are treated as a lightweight reference store; and authenticator seeds are kept as protected credentials for external services.",
      "The dashboard presents these items as separate concerns rather than collapsing them into one generic data table. That separation mirrors the user's mental model. Passwords are a secret material class; notes are editable knowledge; bookmarks are simple links; and authenticator seeds are security-critical tokens that should be handled differently from ordinary content.",
      "The bookmark section now includes a refined add form and card grid. Notes support rich text editing with inline formatting controls. The passwords page provides searchable encrypted credentials. The authenticator page stores and manages TOTP seeds. The product therefore behaves like a small security workspace rather than a single-purpose app.",
    ],
    bullets: [
      "Passwords: encrypted credential CRUD.",
      "Bookmarks: saved links with quick deletion.",
      "Notes: rich text, color emphasis, and full-content editing.",
      "Authenticators: stored TOTP secrets and QR decoding support.",
    ],
    highlights: [
      "Passwords, notes, bookmarks, and seeds are separated on purpose.",
      "The dashboard mirrors the user's mental model of each data class.",
    ],
  },
  {
    id: "generator",
    eyebrow: "Password Generation",
    title: "Entropy-aware password synthesis and variant generation",
    icon: Calculator,
    paragraphs: [
      "Password generation is handled by `dashboard_manager.py`, which mutates a base string, optionally applies leetspeak substitutions, mixes uppercase and digits, fills the remainder with characters from a configurable pool, and shuffles the result. The generator is intentionally deterministic in structure but stochastic in output, which is appropriate for unique password variants.",
      "The generator page exposes controls for length, uppercase inclusion, numeric inclusion, special characters, ambiguous character exclusion, and count. This makes the tool useful for real-world password policy adaptation instead of forcing a single rigid format. The frontend also includes strength estimation logic and crack-time feedback so the user can see how a choice changes the effective search space.",
      "The mathematical basis is straightforward: a password with alphabet size $|\Sigma|$ and length $L$ has an idealized entropy of $H = L \log_2 |\Sigma|$ bits. In practice, the generator increases robustness by mixing symbol classes, avoiding ambiguous glyphs, and preventing trivial base-string reuse. The goal is not to claim perfect unpredictability, but to improve resistance against both human guessing and automated brute force.",
    ],
    formula: "H = L × log2(|Σ|)",
    highlights: [
      "The generator is policy-aware instead of locked to one format.",
      "Ambiguous glyph exclusion is a usability feature, not just cosmetic cleanup.",
    ],
  },
  {
    id: "chat",
    eyebrow: "Ephemeral Chat",
    title: "Room lifecycle, passcodes, approvals, polls, GIFs, and replies",
    icon: MessageSquareText,
    paragraphs: [
      "The chat subsystem is far more than a simple message feed. It supports room creation, invite policies, passcode-protected rooms, approval-only access, participant presence, typing indicators, read receipts, message export, room deletion with reason capture, reply previews, polls, GIFs, and reaction chips. The current implementation in `frontend/app/dashboard/chat/page.jsx` reflects a product that has evolved into a full ephemeral collaboration space.",
      "The room lifecycle is explicit. A creator can choose link-based access or approval-based access. A passcode can be layered on top. If a user is blocked by policy, the interface opens a dialog to collect the required secret or routes the request through approval flow. This is a better security posture than a hidden failure because the user sees why access is denied and what the room expects.",
      "Message handling is optimized for perceived immediacy. The client renders optimistic messages, then reconciles them with the server state so the conversation does not jump around after send. That pattern matters in live chat because the absence of motion is itself a trust signal: the interface should feel stable while still acknowledging the network is asynchronous.",
    ],
    bullets: [
      "Typing state and participant snapshots provide real-time presence.",
      "Polls support single-choice and multiple-choice voting.",
      "Replies carry lightweight previews instead of bloating message payloads.",
      "GIF picker can search remotely and fall back to safe local results.",
      "Room deletion supports tombstone reasons and history cleanup.",
    ],
    highlights: [
      "Access control is explicit: link, passcode, or approval flow.",
      "Optimistic sends keep the room feeling live without lying about the network.",
    ],
  },
  {
    id: "secrets",
    eyebrow: "One-Time Secret Notes",
    title: "Burn-after-read content with explicit expiry and reader mode",
    icon: TimerReset,
    paragraphs: [
      "The one-time secret note feature is a purpose-built burn-after-read system. Users create a note, choose an expiry duration, and receive a link that opens only once. The reader mode is intentionally sparse: it shows the secret content and the expiry time, and after the note is consumed or expired, the page reports that the note is unavailable. This prevents a secret note from being treated like another ordinary stored memo.",
      "The feature is implemented through a dedicated route and backend endpoints that store transient note state with expiration and consumed status. The frontend also supports custom expiry minutes, which means the note lifetime is not restricted to a narrow preset set. That choice aligns with observed user behavior: some secrets are immediate, some are short-lived, and some require a longer time window.",
      "The design principle is narrow visibility. The feature does not attempt to make secrets permanent or broadly shareable. It is an ephemeral handoff mechanism, which is why it belongs alongside the other security-oriented tools.",
    ],
    highlights: [
      "A note is only useful if it can disappear on purpose.",
      "The reader view intentionally removes every extra affordance.",
    ],
  },
  {
    id: "security",
    eyebrow: "Security Guide and Hardening",
    title: "Documentation, best practices, and browser friction",
    icon: Wrench,
    paragraphs: [
      "The security guide is not a data store; it is an article-based educational surface. It contains security advice about offline recovery keys, unique passwords, MFA, breach response, phishing detection, browser hardening, and related practices. The article set is statically authored to avoid hydration mismatch and to keep the UX deterministic.",
      "On top of the guide, the project adds a security hardening guard that prevents context-menu access and blocks common devtools shortcuts on dashboard routes. This is not a substitute for real platform security, but it increases friction for casual observation. Combined with the MFA window and hidden-state decisions, it creates a layered defense of inconvenience.",
      "The codebase repeatedly chooses best-effort browser guardrails rather than pretending the browser can be fully locked down. That is a strong engineering decision because it avoids overclaiming. The application does not claim to defeat a determined operator on the local machine; it claims to make unsafe access less convenient and less accidental.",
    ],
    bullets: [
      "Context menu suppression on dashboard routes.",
      "F12 and devtools shortcut interception.",
      "Deterministic article authorship to avoid hydration issues.",
      "Security advice separated from one-time secret content.",
    ],
    highlights: [
      "The guide teaches security; it does not store secrets.",
      "Browser hardening is best-effort friction, not a false promise.",
    ],
  },
  {
    id: "math",
    eyebrow: "Mathematical Foundations",
    title: "Entropy, brute-force space, TOTP, and privacy-preserving verification",
    icon: BrainCircuit,
    paragraphs: [
      "CipherGate uses a few simple but important mathematical models. Password entropy is approximated from the size of the allowed character set and the output length. TOTP uses a time counter and HMAC-based truncation to map a shared secret and time window into a 6-digit code. Breach checking uses the k-anonymity property so the system can query a prefix without sending the full hash.",
      "The password generator can be understood as a composition of constrained random processes. Let $\Sigma$ be the allowed alphabet after exclusions, let $L$ be the desired length, and let $S$ be the mutated seed. The output string is assembled by mutating $S$, filling the remaining slots uniformly from $\Sigma$, and then applying a Fisher-Yates shuffle. The result is not a cryptographic proof of unpredictability, but it is a meaningful improvement over a naive base-string transform.",
      "Recovery keys are derived from a structured hash pipeline. The backend combines a user identifier, email, and server-side secret material, hashes the seed with SHA-256, base32-encodes the digest, removes padding, and chunks the output into readable blocks. That produces a reproducible offline recovery artifact without exposing the raw derivation inputs to the client.",
    ],
    formulas: [
      "Entropy: H = L × log2(|Σ|)",
      "TOTP counter: C = floor(t / 30)",
      "Breach lookup: send only the SHA-1 prefix, not the full password hash",
      "Recovery derivation: key = Base32(SHA-256(user_id : email : secret))",
    ],
    highlights: [
      "The math is practical: enough to explain, not enough to overclaim.",
      "Prefix-based breach checks avoid exposing the full password hash.",
    ],
  },
  {
    id: "backend",
    eyebrow: "Backend and Persistence",
    title: "FastAPI endpoints, Supabase persistence, and encrypted fields",
    icon: Terminal,
    paragraphs: [
      "The backend in `main.py` is a FastAPI application that defines request models for auth, recovery, notes, bookmarks, passwords, authenticator seeds, one-time secrets, chat creation and updates, typing state, and password generation. The backend loads environment variables, configures Supabase, establishes CORS, and initializes encryption helpers before exposing endpoints.",
      "Sensitive payloads use Fernet-based encryption behind helper functions that add a prefix marker so encrypted values can be detected and avoided during double encryption. This is a practical pattern for mixed data stores where some fields may already be encrypted and others are plaintext during migrations.",
      "The persistence model is split. Persistent user records go to Supabase. Short-lived session-driven signals such as chat typing or one-time secret consumption live in memory or in transient tables where appropriate. That split keeps the code honest about what must survive and what must vanish.",
    ],
    bullets: [
      "Pydantic request models define the API contract.",
      "Supabase acts as the data persistence layer.",
      "Fernet protects fields that need confidentiality at rest.",
      "CORS is explicitly configured from environment variables.",
    ],
    highlights: [
      "Encrypted fields can coexist with legacy plaintext during migration.",
      "Short-lived state stays short-lived instead of being forced into persistence.",
    ],
  },
  {
    id: "ux",
    eyebrow: "Design Methods",
    title: "Interface choices, motion language, and usability methods",
    icon: Sparkles,
    paragraphs: [
      "The interface uses a high-contrast dark aesthetic, sharp typography, and measured motion. The visual language is intentionally cybernetic without becoming chaotic. Cards, stats, and headers use consistent framing, and the motion system brings in sections with staggered timing so the dashboard feels responsive without becoming noisy.",
      "The app uses targeted UI affordances to explain state. The MFA countdown is visible on the dashboard. The chat room shows connection state and typing indicators. The secret note page reveals whether a note is currently opening, expired, or consumed. These are not just decorative labels; they are part of the product's trust model.",
      "The project also demonstrates a design discipline around hidden complexity. When a user creates a secret note or joins a protected room, the interface does not force them to understand the entire backend. It offers a compact action, a clear result, and a visible failure state when policy blocks access.",
    ],
    highlights: [
      "The interface is meant to explain state, not just look polished.",
      "Each sensitive action shows its consequence before the user commits.",
    ],
  },
  {
    id: "references",
    eyebrow: "References",
    title: "Primary source material used in the analysis",
    icon: BookOpen,
    paragraphs: [
      "The report intentionally relies on primary code artifacts rather than external literature. The most important references are the backend application in `main.py`, the auth helpers in `auth_logic.py`, the password-generation logic in `dashboard_manager.py`, and the dashboard and public route files under `frontend/app`.",
      "The concrete UI evidence comes from `frontend/app/dashboard/page.jsx`, `frontend/app/auth/login/page.jsx`, `frontend/app/auth/mfa/page.jsx`, `frontend/app/auth/recover/page.jsx`, `frontend/app/dashboard/chat/page.jsx`, and the public research paper page itself in `frontend/app/research-papers/page.jsx`.",
      "The operational tables are defined by `setup_chat_tables.sql`, while shared visual and runtime behavior comes from `frontend/components/ui/*`, `frontend/components/security-hardening-guard.jsx`, `frontend/components/mfa-reauth-watcher.jsx`, and `frontend/lib/utils.js`.",
    ],
    bullets: [
      "Backend: `main.py`, `auth_logic.py`, `dashboard_manager.py`.",
      "Frontend routes: `frontend/app/*`.",
      "Shared components and runtime guards: `frontend/components/*`.",
      "Persistence schema: `setup_chat_tables.sql`.",
    ],
  },
  {
    id: "evaluation",
    eyebrow: "Evaluation and Limitations",
    title: "What the system does well and where it remains bounded",
    icon: CheckCircle2,
    paragraphs: [
      "CipherGate is effective at reducing accidental exposure and keeping the secure workflows visible. It does not claim to be an enterprise zero-trust platform. Instead, it enforces enough friction to protect ordinary users from common mistakes, such as reusing passwords, leaving recovery keys in unsafe places, or sharing a secret as if it were a permanent note.",
      "The browser hardening guard is best effort only. Any local machine can still take screenshots or inspect the page if the operator is determined. That limitation is acknowledged directly in the UI. Similarly, client-side persistence still depends on the browser environment, so the application is careful to pair protection with user education instead of overselling guarantees.",
      "The strongest value of the project is coherence. Every subsystem reinforces the others: MFA protects the dashboard, the dashboard fronts the tools, the tools guide the user toward secure practices, and the shared design system keeps the experience legible. That consistency is what turns a set of features into a product.",
    ],
    highlights: [
      "The app is opinionated about safety, but it stays honest about limits.",
      "Coherence is the product advantage: each subsystem reinforces the others.",
    ],
  },
  {
    id: "appendix",
    eyebrow: "Appendix",
    title: "File-level implementation map",
    icon: Table2,
    paragraphs: [
      "The table below maps the main files in the repository to the responsibilities they implement. It is not exhaustive of every imported helper or generated chunk, but it covers the user-authored files that define the product's behavior and presentation.",
    ],
  },
];

const fileInventory = [
  ["main.py", "FastAPI backend with auth, MFA, recovery, vault, chat, one-time secrets, and generation endpoints.", 1786],
  ["auth_logic.py", "bcrypt password hashing and TOTP secret / code helpers.", 35],
  ["dashboard_manager.py", "Password variant generation and strength-oriented transformation logic.", 148],
  ["setup_chat_tables.sql", "Chat room, participant, message, and audit table schema.", 52],
  ["frontend/app/page.js", "Landing page that routes logged-in users into MFA and guests into documentation.", 183],
  ["frontend/app/layout.js", "Root layout that mounts MFA watchers, hardening guard, and toast support.", 42],
  ["frontend/app/dashboard/page.jsx", "Dashboard home, stats, navigation cards, bookmarks, notes, recovery download, and session controls.", 991],
  ["frontend/app/dashboard/chat/page.jsx", "Ephemeral chat rooms with replies, polls, GIFs, reactions, passcodes, approvals, and optimistic messaging.", 2499],
  ["frontend/app/dashboard/passwords/page.jsx", "Encrypted password vault interface and credential management.", 743],
  ["frontend/app/dashboard/authenticator/page.jsx", "Authenticator seed vault and QR/TOTP tooling.", 649],
  ["frontend/app/dashboard/generator/page.jsx", "Password generator with entropy-oriented options and MFA gating.", 332],
  ["frontend/app/dashboard/security/page.jsx", "Article-based security guide and safety guidance.", 300],
  ["frontend/app/dashboard/secrets/page.jsx", "One-time secret notes with burn-after-read behavior and custom expiry.", 283],
  ["frontend/app/research-papers/page.jsx", "This paper: a long-form product and implementation report.", 741],
  ["frontend/app/documentation/page.jsx", "Legacy technical documentation page and product introduction.", 234],
  ["frontend/app/auth/login/page.jsx", "Login flow, next-path handling, and MFA handoff.", 261],
  ["frontend/app/auth/mfa/page.jsx", "TOTP challenge, setup QR display, reauth handling, and redirect continuation.", 192],
  ["frontend/app/auth/recover/page.jsx", "Recovery-key verification and password reset.", 159],
  ["frontend/components/security-hardening-guard.jsx", "Client-side dashboard hardening for context menu and devtools shortcuts.", 52],
  ["frontend/components/mfa-reauth-watcher.jsx", "Session-expiry watcher that re-routes users to MFA when needed.", 56],
  ["frontend/components/ui/select.jsx", "Styled Radix select used for secret expiry and other dropdowns.", 184],
  ["frontend/components/ui/button.jsx", "Shared button primitive with project-specific variants and sizes.", 56],
  ["frontend/components/ui/alert-dialog.jsx", "Alert dialog primitive used for destructive and sensitive chat actions.", 176],
  ["frontend/components/ui/sonner.jsx", "Toast integration for status and error feedback.", 50],
  ["frontend/components/ui/encrypted-text.jsx", "Animated text reveal component used on the landing and documentation pages.", 138],
  ["frontend/lib/utils.js", "Session validation, MFA timing, pending-action storage, and utility helpers.", 106],
  ["frontend/lib/env.js", "Base API URL and Giphy key configuration.", 6],
  ["frontend/app/globals.css", "Global theme tokens, typography mapping, and base Tailwind styles.", 145],
];

const endpointGroups = [
  {
    title: "Authentication and recovery",
    items: [
      "POST /auth/mfa/challenge",
      "POST /auth/mfa/verify",
      "POST /auth/recovery-verify",
      "POST /auth/recovery-reset",
      "GET /auth/recovery-key",
      "QR decode and TOTP-related helper routes",
    ],
  },
  {
    title: "Vault operations",
    items: [
      "GET/POST/PUT/DELETE for passwords",
      "GET/POST/PUT/DELETE for notes",
      "GET/POST/DELETE for bookmarks",
      "Authenticator seed CRUD and QR decode helpers",
      "Encryption migration endpoints",
    ],
  },
  {
    title: "Chat system",
    items: [
      "POST /chat/rooms",
      "POST /chat/rooms/:id/join",
      "GET /chat/rooms/:id/state",
      "GET /chat/rooms/:id/messages",
      "POST /chat/rooms/:id/messages",
      "PATCH /chat/rooms/:id/settings",
      "POST /chat/rooms/:id/typing",
      "POST /chat/rooms/:id/approvals",
    ],
  },
  {
    title: "Secrets and generator",
    items: [
      "POST /secrets/one-time",
      "GET /secrets/one-time/:token",
      "POST /generator/passwords",
      "Password strength and entropy estimation helpers",
    ],
  },
];

const EMPHASIS_TERMS = [
  "MFA",
  "encrypted",
  "encryption",
  "one-time",
  "burn-after-read",
  "TOTP",
  "entropy",
  "Fernet",
  "Supabase",
  "FastAPI",
  "Next.js",
  "security",
  "recovery key",
  "k-anonymity",
  "HMAC",
  "SHA-256",
  "SHA-1",
  "passcode",
  "approval",
  "ephemeral",
];

function renderEmphasizedText(text) {
  if (!text) return text;

  const escaped = EMPHASIS_TERMS
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    const isEmphasis = EMPHASIS_TERMS.some((term) => term.toLowerCase() === part.toLowerCase());
    if (!isEmphasis) return <span key={`${part}-${idx}`}>{part}</span>;
    return (
      <span key={`${part}-${idx}`} className="text-primary font-medium">
        {part}
      </span>
    );
  });
}

function SectionCard({ section }) {
  const Icon = section.icon;

  return (
    <motion.section
      id={section.id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45 }}
      className="rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.82)] p-6 sm:p-7 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary/65">{section.eyebrow}</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bitcount uppercase text-white">
            {section.title}
          </h2>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-7 text-white/72">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{renderEmphasizedText(paragraph)}</p>
        ))}
      </div>

      {section.bullets?.length ? (
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {section.bullets.map((bullet) => (
            <div key={bullet} className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/75">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-1 shrink-0 text-primary" />
                <span>{bullet}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {section.formula ? (
        <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-white/80">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary/60 mb-1">Core formula</p>
          <code className="font-mono text-primary">{section.formula}</code>
        </div>
      ) : null}

      {section.formulas?.length ? (
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {section.formulas.map((formula) => (
            <div key={formula} className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/75 font-mono">
              {formula}
            </div>
          ))}
        </div>
      ) : null}

      {section.callout ? (
        <div className="mt-5 rounded-xl border border-primary/20 bg-black/35 px-4 py-3 text-sm text-white/70">
          <span className="text-primary">Key observation:</span> {section.callout}
        </div>
      ) : null}
    </motion.section>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className="mt-1 text-sm text-white/85">{value}</p>
    </div>
  );
}

export default function ResearchPapersPage() {
  const router = useRouter();
  const paperRef = useRef(null);

  const toc = useMemo(
    () => researchSections.map((section) => ({ id: section.id, title: section.eyebrow })),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const loadMathJax = () => {
      if (typeof window === "undefined") return;

      window.MathJax = {
        ...(window.MathJax || {}),
        tex: {
          inlineMath: [["$", "$"], ["\\(", "\\)"]],
          displayMath: [["$$", "$$"], ["\\[", "\\]"]],
          processEscapes: true,
        },
        options: {
          skipHtmlTags: ["script", "noscript", "style", "textarea", "pre", "code"],
        },
        chtml: {
          scale: 0.97,
        },
      };

      const runTypeset = async () => {
        if (cancelled || !paperRef.current || !window.MathJax?.typesetPromise) return;
        await window.MathJax.typesetPromise([paperRef.current]);
      };

      const existingScript = document.getElementById("mathjax-script");
      if (existingScript) {
        runTypeset().catch(() => {});
        return;
      }

      const script = document.createElement("script");
      script.id = "mathjax-script";
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      script.onload = () => {
        runTypeset().catch(() => {});
      };
      document.head.appendChild(script);
    };

    loadMathJax();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={paperRef} className="min-h-screen bg-black text-white font-inconsolata selection:bg-primary/30 scroll-smooth">
      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>

          <div className="flex items-center gap-2 text-primary">
            <FileText size={16} />
            <span className="text-xs uppercase tracking-[0.28em] text-primary/80">Research Papers</span>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/secrets")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <KeyRound size={14} /> Secrets
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,19,21,0.95),rgba(11,11,12,0.95))] px-6 py-10 sm:px-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-primary/70">CipherGate Technical Report</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-bitcount uppercase leading-none text-white sm:text-6xl">
                A long-form technical paper on the product, methods, math, and implementation
              </h1>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-primary/75">
                Built on collaborative implementation work by Aditi Shukla and Aditya.
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">
                This page is written as a formal research-style report. It explains the live CipherGate codebase in detail, from the landing page and dashboard through the vault, MFA, recovery, chat, one-time secrets, security guide, and backend API design.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {keyStats.map((stat) => (
                <MetricPill key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
          </div>
        </section>

        <section className="no-print mt-8 grid gap-4 rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.75)] p-5 lg:grid-cols-4">
          {toc.map((entry) => (
            <a
              key={entry.id}
              href={`#${entry.id}`}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-primary/35 hover:text-primary"
            >
              <span>{entry.title}</span>
              <ChevronRight size={13} />
            </a>
          ))}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {endpointGroups.map((group) => (
            <div key={group.title} className="rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.78)] p-5">
              <p className="text-[10px] uppercase tracking-[0.26em] text-primary/65">Endpoint family</p>
              <h3 className="mt-2 text-xl font-bitcount uppercase text-white">{group.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {group.items.map((item) => (
                  <li key={item} className="rounded-lg border border-white/8 bg-black/25 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="mt-8 space-y-6">
          {researchSections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        <section className="mt-8 rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.82)] p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <Table2 size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-primary/65">Appendix A</p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bitcount uppercase text-white">File inventory and role summary</h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.2fr_2fr_0.5fr] bg-white/5 px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/45">
              <div>File</div>
              <div>Role</div>
              <div className="text-right">Lines</div>
            </div>
            <div className="divide-y divide-white/8">
              {fileInventory.map(([file, role, lines]) => (
                <div key={file} className="grid grid-cols-[1.2fr_2fr_0.5fr] gap-4 px-4 py-3 text-sm leading-6">
                  <div className="font-mono text-primary/90">{file}</div>
                  <div className="text-white/70">{role}</div>
                  <div className="text-right font-mono text-white/80">{lines}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.82)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
                <Terminal size={18} />
              </div>
              <h2 className="text-2xl font-bitcount uppercase text-white">Methods used in the project</h2>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-white/70">
              <li className="rounded-xl border border-white/8 bg-black/25 px-4 py-3">Layered authentication with password verification, TOTP MFA, and time-bound reauth prompts.</li>
              <li className="rounded-xl border border-white/8 bg-black/25 px-4 py-3">Client-server separation with Next.js pages acting as UX shells over a FastAPI API.</li>
              <li className="rounded-xl border border-white/8 bg-black/25 px-4 py-3">Event-driven UI updates in chat through optimistic sends, presence polling, and typing indicators.</li>
              <li className="rounded-xl border border-white/8 bg-black/25 px-4 py-3">HTML sanitization before rendering rich note and message content.</li>
              <li className="rounded-xl border border-white/8 bg-black/25 px-4 py-3">Best-effort browser hardening to reduce casual inspection of sensitive dashboard routes.</li>
              <li className="rounded-xl border border-white/8 bg-black/25 px-4 py-3">Ephemeral storage patterns for one-time notes and room state that should not survive indefinitely.</li>
            </ul>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.82)] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
                <Calculator size={18} />
              </div>
              <h2 className="text-2xl font-bitcount uppercase text-white">Mathematics used in the project</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-white/70">
              <p className="rounded-xl border border-white/8 bg-black/25 px-4 py-3"><span className="text-primary">Entropy:</span> password strength is approximated as $H = L \log_2 |\Sigma|$, where $L$ is length and $|\Sigma|$ is the allowed alphabet.</p>
              <p className="rounded-xl border border-white/8 bg-black/25 px-4 py-3"><span className="text-primary">Expected guesses:</span> a naive brute-force search has expected work near $|\Sigma|^L / 2$ when the target is uniformly distributed.</p>
              <p className="rounded-xl border border-white/8 bg-black/25 px-4 py-3"><span className="text-primary">TOTP:</span> codes derive from a time counter $C = \lfloor t / 30 \rfloor$ and an HMAC-based truncation step that yields a 6-digit token.</p>
              <p className="rounded-xl border border-white/8 bg-black/25 px-4 py-3"><span className="text-primary">Privacy-preserving breach checks:</span> only a prefix of the SHA-1 digest is used for lookup, which follows the k-anonymity style used by prefix-based password breach services.</p>
              <p className="rounded-xl border border-white/8 bg-black/25 px-4 py-3"><span className="text-primary">Recovery key derivation:</span> a SHA-256 digest of user and secret material is Base32-encoded and chunked into a readable offline artifact.</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.82)] p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <Wrench size={18} />
            </div>
            <h2 className="text-2xl font-bitcount uppercase text-white">Conclusion</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-white/72">
            <p>CipherGate is a coherent security workspace with a strong center of gravity around MFA, encrypted storage, and ephemeral sharing. Its value is not in any single feature; it is in the way those features reinforce one another. Passwords live in a vault, notes are editable yet sanitized, secrets can expire after one read, chat can be controlled and audited, and the dashboard keeps the whole system visible.</p>
            <p>The codebase is also intentionally educational. The documentation and research-paper surfaces explain not just what the system does, but why each choice exists. That includes cryptographic tradeoffs, state management, frontend composition, and the practical limitations of browser-based security. The result is a product that doubles as its own technical narrative.</p>
            <p>As implemented, CipherGate is a realistic, maintainable security tool with a clear roadmap for future expansion. The repository already contains enough structure to support further hardening, better audit trails, richer device management, and stronger reporting without needing to re-architect the whole product.</p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.82)] p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">End of Paper</p>
            <p className="mt-2 text-sm text-white/65">This page is deliberately long-form so it can serve as an internal technical report for the codebase.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/20"
          >
            <Shield size={14} /> Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}