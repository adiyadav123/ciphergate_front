"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  ChevronRight,
  FileCode,
  FileText,
  Layers,
  Route,
  Shield,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

const learningChapters = [
  {
    id: "chapter-1",
    title: "System Story",
    icon: Route,
    summary:
      "Understand the end-to-end user journey from login to MFA, dashboard, and tools, so explanations stay coherent under viva pressure.",
    points: [
      "Login establishes identity context.",
      "MFA establishes trust context.",
      "Dashboard is the command center.",
      "Tool pages call focused backend APIs.",
    ],
  },
  {
    id: "chapter-2",
    title: "Security Logic",
    icon: Shield,
    summary:
      "Learn what is protected, where it is protected, and where the practical limits are, so claims remain technically accurate.",
    points: [
      "bcrypt + TOTP for identity protection.",
      "Fernet field encryption for vault data.",
      "Reauth timer for session freshness.",
      "Browser hardening is friction, not absolute defense.",
    ],
  },
  {
    id: "chapter-3",
    title: "File Atlas",
    icon: FileCode,
    summary:
      "Go file by file with purpose, user impact, technical mechanism, and viva question-ready answers.",
    points: [
      "Backend core files.",
      "Frontend route files.",
      "Shared UI components.",
      "Config, utilities, and styling.",
    ],
  },
  {
    id: "chapter-4",
    title: "Teacher Defense",
    icon: BrainCircuit,
    summary:
      "Memorize must-know concepts and common mistakes so explanations sound confident and consistent.",
    points: [
      "10 must-know concepts.",
      "Likely teacher questions.",
      "What not to overclaim.",
      "How to answer without sounding scripted.",
    ],
  },
  {
    id: "chapter-5",
    title: "Core Basics",
    icon: BookOpen,
    summary:
      "Learn small but critical terms in easy language so even non-programmers can explain the project confidently.",
    points: [
      "What API and routes mean.",
      "What bcrypt and hashing mean.",
      "What cryptography actually does.",
      "What the project foundation is.",
    ],
  },
  {
    id: "chapter-6",
    title: "Libraries and Stack",
    icon: FileText,
    summary:
      "Understand what Python and npm libraries are used, what each one does, and why this stack was chosen for CipherGate.",
    points: [
      "Why React and Next.js.",
      "Why FastAPI and Uvicorn.",
      "Python package purposes.",
      "npm package purposes.",
    ],
  },
  {
    id: "chapter-7",
    title: "No-Gap Mastery",
    icon: BrainCircuit,
    summary:
      "A large final question bank for difficult teacher cross-questions, architecture depth, and practical defense answers.",
    points: [
      "Advanced architecture questions.",
      "Security and threat-model questions.",
      "Data and API design questions.",
      "Deployment and testing questions.",
    ],
  },
];

const systemFlow = [
  "User logs in on auth screen; session stores identity with MFA still unverified.",
  "MFA page requests challenge and verifies authenticator code.",
  "Session is marked trusted only after MFA success.",
  "Dashboard loads vault summary and navigation cards.",
  "Each tool page calls dedicated backend endpoints in the Python API.",
  "Global watcher and per-page checks force reauth when trust window expires.",
];

const securityModel = [
  "Identity: password hash verification + MFA code verification.",
  "Session trust: MFA timestamp window with forced re-verification.",
  "Data protection: vault fields encrypted at rest using Fernet.",
  "Recovery: deterministic recovery-key flow tied to account identity.",
  "Ephemeral controls: one-time secrets and temporary room state lifecycles.",
  "Safety UX: confirmations, toasts, and dashboard hardening friction.",
];

const mustKnow = [
  "Session existence is not the same as trusted session state.",
  "MFA freshness window is central to access control.",
  "Vault encryption is field-level and backend-mediated.",
  "Recovery keys are derived and reproducible for account recovery.",
  "Chat is policy-controlled (link, passcode, approval), not open chat.",
  "One-time secrets are transfer objects, not permanent notes.",
  "Password quality combines heuristics, policy constraints, and user controls.",
  "Breach lookup uses hash-prefix privacy style, not raw password upload.",
  "Animated encrypted text is visual branding, not cryptography.",
  "Browser hardening raises effort but cannot guarantee absolute lockout.",
];

const avoidMistakes = [
  "Do not claim perfect zero-knowledge behavior.",
  "Do not claim browser hardening can stop all inspection or screenshots.",
  "Do not call local session storage equivalent to robust token architecture.",
  "Do not skip explaining reauth expiry behavior.",
  "Do not describe one-time secrets as regular saved notes.",
];

const basicsGlossary = [
  {
    term: "What is the base of this project?",
    simple:
      "CipherGate is built on a simple base idea: secure storage and controlled sharing of sensitive data. The frontend guides the user journey, and the Python backend enforces the real rules.",
    meaning:
      "The project foundation is layered trust. Identity is checked with login + MFA, actions go through API routes, and sensitive records are protected before storage.",
  },
  {
    term: "What is an API?",
    simple:
      "API is a bridge between frontend and backend. The page asks for something, and backend sends data or result back.",
    meaning:
      "In CipherGate, API calls are how login, password vault actions, chat actions, and one-time secret actions are executed safely.",
  },
  {
    term: "What is a route?",
    simple:
      "A route is a specific path for a specific job. Example: one route for login, another for saving a password.",
    meaning:
      "Routes keep logic organized. They make each operation clear, testable, and easier to secure with validation.",
  },
  {
    term: "What is an endpoint?",
    simple:
      "Endpoint is the exact API address that performs one operation.",
    meaning:
      "Think of endpoint as a function accessible over network. It receives input, applies rules, and returns output.",
  },
  {
    term: "What is backend?",
    simple:
      "Backend is the hidden engine of the app where important logic runs.",
    meaning:
      "CipherGate backend handles verification, encryption steps, database operations, and policy checks. It is where security decisions should live.",
  },
  {
    term: "What is frontend?",
    simple:
      "Frontend is what users see and click.",
    meaning:
      "In this project, frontend pages manage flow and feedback, but they rely on backend to perform trusted operations.",
  },
  {
    term: "What is authentication?",
    simple:
      "Authentication means proving who you are.",
    meaning:
      "Login password plus MFA code together create stronger identity proof than password alone.",
  },
  {
    term: "What is authorization?",
    simple:
      "Authorization means deciding what you are allowed to do.",
    meaning:
      "CipherGate uses trusted-session checks and route guards so not every logged-in state gets full sensitive access.",
  },
  {
    term: "What is bcrypt?",
    simple:
      "bcrypt is a safe way to store passwords as hashes, not plain text.",
    meaning:
      "If data leaks, hashed passwords are harder to reverse. bcrypt is intentionally slow to make brute-force attacks expensive.",
  },
  {
    term: "What is hashing?",
    simple:
      "Hashing converts data into a fixed signature.",
    meaning:
      "For passwords, system compares hashes instead of saving original password. This reduces direct exposure.",
  },
  {
    term: "What is a salt in password security?",
    simple:
      "Salt is extra random data added before hashing.",
    meaning:
      "Salt prevents two same passwords from looking identical in storage and weakens precomputed attack tables.",
  },
  {
    term: "What is cryptography?",
    simple:
      "Cryptography is the science of protecting information using math.",
    meaning:
      "In CipherGate, cryptography is used to protect sensitive values so stored data is not human-readable without proper process.",
  },
  {
    term: "What is encryption and decryption?",
    simple:
      "Encryption locks data; decryption unlocks data.",
    meaning:
      "Vault fields are encrypted before storage and decrypted only when needed by valid backend flow.",
  },
  {
    term: "What is MFA and OTP?",
    simple:
      "MFA is multi-factor authentication. OTP is one-time password code from authenticator app.",
    meaning:
      "MFA adds second proof beyond password. OTP rotates quickly, so old leaked codes become useless.",
  },
  {
    term: "What is TOTP?",
    simple:
      "TOTP is a time-based OTP that changes every short interval.",
    meaning:
      "CipherGate authenticator flow depends on time-window verification, which improves safety against replay.",
  },
  {
    term: "What is a session?",
    simple:
      "Session stores current user state after login.",
    meaning:
      "This project tracks both identity and MFA freshness in session-like data to enforce reauth when needed.",
  },
  {
    term: "What is database role in this project?",
    simple:
      "Database stores long-term records like users, vault data, and chat history tables.",
    meaning:
      "Persistent data belongs in DB, while short-lived temporary states are kept separately when appropriate.",
  },
  {
    term: "What is an environment variable?",
    simple:
      "Environment variable is external configuration value, like API base URL or keys.",
    meaning:
      "It helps keep secrets and deployment settings outside source code, which is safer and cleaner.",
  },
  {
    term: "What is component-based UI?",
    simple:
      "Component-based UI means building screen from reusable parts.",
    meaning:
      "CipherGate uses reusable buttons, dialogs, selects, and watchers so behavior and style stay consistent.",
  },
  {
    term: "What is a library?",
    simple:
      "A library is a collection of ready-made functions or tools you can call in your code.",
    meaning:
      "You stay in control and use the library where needed. Example in this project: bcrypt for password hashing and zxcvbn for password strength checks.",
  },
  {
    term: "What is a framework?",
    simple:
      "A framework is a bigger structure that decides the flow and gives standard rules to build your app.",
    meaning:
      "Framework controls the main architecture and your code fits into it. Example here: Next.js for frontend app structure and FastAPI for backend API structure.",
  },
  {
    term: "Framework vs library in one line?",
    simple:
      "Library: you call it. Framework: it calls your code at the right places.",
    meaning:
      "This is called inversion of control. Libraries are helpers; frameworks are the skeleton that organizes the whole project.",
  },
  {
    term: "What is practical security vs perfect security?",
    simple:
      "Practical security means reducing real-world risk a lot, even if nothing is 100 percent impossible to break.",
    meaning:
      "Correct explanation is: CipherGate uses layered defenses and good practices, but does not claim magical absolute protection.",
  },
];

const stackQuestions = [
  {
    q: "Why did we use React with Next.js instead of plain HTML pages?",
    a: "React makes UI modular using reusable components, so large screens stay manageable. Next.js adds routing, build optimization, and production-ready app structure out of the box. Together, they reduce manual setup and help scale the frontend cleanly.",
  },
  {
    q: "Why Next.js specifically for this project?",
    a: "This project has many routes and dashboard tools. Next.js App Router makes route organization easy, supports client/server rendering patterns, and gives a solid project structure. It speeds up development while keeping performance and maintainability strong.",
  },
  {
    q: "Why not only React without Next.js?",
    a: "You can build with only React, but then you manually set up routing, optimization strategy, and many production concerns. Next.js gives these features in a standard way, so the team focuses more on CipherGate features than framework plumbing.",
  },
  {
    q: "Why was FastAPI chosen as backend framework?",
    a: "FastAPI is fast, modern, and great for API-first products like CipherGate. It supports clear request/response models, automatic validation, and clean route definitions. This helps us build secure endpoints with less boilerplate and fewer mistakes.",
  },
  {
    q: "Why use Uvicorn with FastAPI?",
    a: "Uvicorn is the ASGI server that runs FastAPI apps. FastAPI defines the app logic, while Uvicorn serves it efficiently over HTTP. In simple terms: FastAPI is the brain, Uvicorn is the engine that keeps the API running.",
  },
  {
    q: "What is ASGI in easy language?",
    a: "ASGI is a modern Python interface for handling web requests asynchronously. It helps apps handle many connections efficiently. FastAPI is ASGI-based, and Uvicorn is a common ASGI server used to run it.",
  },
  {
    q: "Why this full stack is a good fit for CipherGate?",
    a: "CipherGate needs secure APIs, many UI screens, and fast feature iteration. Next.js + React handles rich frontend flows; FastAPI + Uvicorn handles clean backend APIs. This combination is practical, modern, and well suited for security-focused products.",
  },
];

const frameworkVsLibraryRows = [
  {
    topic: "Who controls app flow?",
    framework: "Framework controls main flow and lifecycle.",
    library: "Developer controls flow and calls library when needed.",
  },
  {
    topic: "Project scope",
    framework: "Often organizes a full app layer (routing, patterns, structure).",
    library: "Usually solves a focused problem (hashing, animation, validation).",
  },
  {
    topic: "CipherGate examples",
    framework: "Next.js and FastAPI.",
    library: "bcrypt, pyotp, zxcvbn, sonner, mathjax, lucide-react.",
  },
  {
    topic: "Easy memory trick",
    framework: "Framework = building blueprint + rules.",
    library: "Library = toolbox you pick from.",
  },
];

const pythonLibraries = [
  {
    name: "fastapi",
    what: "Backend framework for defining API routes and request handling.",
    why: "Core API layer for auth, vault, chat, and secret endpoints.",
  },
  {
    name: "uvicorn",
    what: "ASGI server that runs the FastAPI application.",
    why: "Required runtime server to serve backend endpoints efficiently.",
  },
  {
    name: "supabase",
    what: "Python client for Supabase services and database operations.",
    why: "Used for persistent data access and structured storage flows.",
  },
  {
    name: "bcrypt",
    what: "Password hashing library.",
    why: "Stores password hashes securely instead of plain text values.",
  },
  {
    name: "pyotp",
    what: "Library for generating and verifying OTP/TOTP codes.",
    why: "Used in MFA authenticator setup and code verification.",
  },
  {
    name: "pydantic[email]",
    what: "Data validation and typed schema modeling library.",
    why: "Validates incoming request data and improves API correctness.",
  },
  {
    name: "python-multipart",
    what: "Parses multipart/form-data requests.",
    why: "Needed for forms and upload-style payload handling.",
  },
  {
    name: "python-dotenv",
    what: "Loads environment variables from .env files.",
    why: "Keeps config and secrets outside source code.",
  },
  {
    name: "cryptography",
    what: "Cryptographic primitives and utilities (including Fernet usage patterns).",
    why: "Protects sensitive fields through encryption/decryption workflows.",
  },
  {
    name: "numpy",
    what: "Numerical computation library.",
    why: "Supports data/array handling in utility and processing operations.",
  },
  {
    name: "opencv-python-headless",
    what: "Image/video processing library without GUI dependencies.",
    why: "Used for camera/image processing tasks like QR-related flows.",
  },
  {
    name: "httpx",
    what: "HTTP client for making outgoing web/API requests.",
    why: "Used when backend needs to call external services safely.",
  },
  {
    name: "google-generativeai",
    what: "Client library for Gemini API integration.",
    why: "Used in AI-assisted analysis features like crack-time style insights.",
  },
];

const npmLibraries = [
  {
    name: "next",
    what: "React framework for routing and production app architecture.",
    why: "Main frontend framework used by the project.",
  },
  {
    name: "react / react-dom",
    what: "Core UI library and DOM renderer.",
    why: "Builds reusable, interactive components and app state flows.",
  },
  {
    name: "motion",
    what: "Animation library for React interfaces.",
    why: "Adds smooth transitions and section reveal animations.",
  },
  {
    name: "lucide-react",
    what: "Icon library.",
    why: "Provides clean iconography across dashboard and docs pages.",
  },
  {
    name: "sonner",
    what: "Toast notification library.",
    why: "Shows lightweight success/error feedback without page blocking.",
  },
  {
    name: "zxcvbn",
    what: "Password strength estimation library.",
    why: "Used in vault/password pages for real-time strength guidance.",
  },
  {
    name: "mathjax",
    what: "Mathematics rendering engine.",
    why: "Renders formulas on technical documentation/research pages.",
  },
  {
    name: "class-variance-authority",
    what: "Utility for managing component style variants.",
    why: "Keeps button/input/select variants consistent and maintainable.",
  },
  {
    name: "clsx + tailwind-merge",
    what: "ClassName composition and Tailwind class conflict resolution utilities.",
    why: "Builds clean dynamic class strings without style collisions.",
  },
  {
    name: "next-themes",
    what: "Theme state helper for Next.js apps.",
    why: "Supports consistent theme handling in UI.",
  },
  {
    name: "radix-ui",
    what: "Accessible low-level UI primitives.",
    why: "Foundation for reusable dialog, menu, and select interactions.",
  },
  {
    name: "shadcn",
    what: "Component workflow/pattern library built around Radix + Tailwind.",
    why: "Speeds up creation of consistent, customizable UI building blocks.",
  },
  {
    name: "tailwindcss + tw-animate-css",
    what: "Utility-first CSS framework and animation helpers.",
    why: "Rapid styling with consistent design tokens and utility classes.",
  },
];

const vivaQuestions = [
  {
    q: "What problem does CipherGate solve in simple words?",
    a: "CipherGate solves a real daily problem: people keep passwords, OTP secrets, notes, and quick shared data in unsafe places. This project puts those things behind login, MFA, and structured tools. In short, it helps users store and share sensitive information with better control and less risk.",
  },
  {
    q: "Why did we build both login and MFA instead of only login?",
    a: "A password alone can be stolen or guessed. MFA adds a second proof, usually a time-based code from an authenticator app, so the attacker needs both password and code at the same time. This greatly improves account safety in practical use.",
  },
  {
    q: "How is trust different from just being logged in?",
    a: "Logged in means the system knows who you are. Trusted means you recently passed MFA and can access sensitive pages. CipherGate keeps these as separate states, so old sessions do not stay powerful forever.",
  },
  {
    q: "What does the MFA reauth watcher do for users?",
    a: "It checks whether the MFA verification is still fresh. If the trust window expires, it sends the user back for reauthentication before sensitive actions continue. This protects users even if a device is left open.",
  },
  {
    q: "How does CipherGate protect saved passwords in the vault?",
    a: "Vault data is not treated like plain text records. Sensitive fields are encrypted before storage and decrypted only when needed through backend logic. So even if someone sees raw stored data, it is not directly readable.",
  },
  {
    q: "Why do we still use strength checks if users can choose their own password?",
    a: "User freedom is important, but weak passwords are risky. Strength checks provide immediate guidance and help users improve choices without forcing blind rules. This balance improves security and user experience together.",
  },
  {
    q: "How can we check breach risk without sending raw passwords to services?",
    a: "CipherGate follows a privacy-friendly style using hash-prefix lookup. The full password is not uploaded directly; only partial hash information is used for comparison. This gives risk awareness while reducing exposure.",
  },
  {
    q: "What is special about one-time secrets compared to normal notes?",
    a: "Normal notes are meant to stay and be managed over time. One-time secrets are temporary transfer items that can expire or vanish after read. This is useful when sharing sensitive data that should not remain visible later.",
  },
  {
    q: "Why does the chat module have room controls like passcode and approval?",
    a: "Not all chats should be open by default. Room controls let the owner decide who can join and how. This design supports safer collaboration when messages may include private or technical details.",
  },
  {
    q: "Why do we have both a research paper page and a cipher-book page?",
    a: "They serve different audiences. The research paper is technical and architecture-heavy for evaluators, while the book is teaching-focused for clear understanding and viva preparation. Together they improve both depth and communication.",
  },
  {
    q: "What should we honestly say about browser hardening?",
    a: "Browser hardening is a deterrence layer, not an absolute wall. It blocks easy actions like right-click and common shortcuts, which reduces casual misuse. But determined users with deeper access can still inspect, so we present it as partial protection.",
  },
  {
    q: "How do frontend and backend divide responsibilities in this project?",
    a: "Frontend handles interface, user flow, and immediate feedback. Backend handles core logic, validation, encryption steps, and database operations. This separation keeps the system organized and makes maintenance easier.",
  },
  {
    q: "Why is main.py so large and central?",
    a: "It acts as the API hub where many product features are connected: auth, vault, chat, secrets, and utilities. Keeping related endpoint logic together made rapid integration easier during development. The file is large because it carries most backend orchestration responsibilities.",
  },
  {
    q: "If a teacher asks the strongest point of this project, what should we answer?",
    a: "The strongest point is layered practical security with usable workflows. It does not depend on a single defense; it combines MFA freshness, protected storage, controlled sharing, and user guidance tools. This makes the project both meaningful and realistic.",
  },
  {
    q: "If a teacher asks the main limitation, what should we answer?",
    a: "A fair limitation is that some controls are still client-side convenience and deterrence, not complete zero-trust guarantees. We should clearly say this project improves safety significantly but does not claim impossible perfect security. Honest scope makes the explanation stronger, not weaker.",
  },
];

const deepVivaBank = [
  {
    q: "What is the single-line architecture of CipherGate?",
    a: "Client-side Next.js frontend calls FastAPI endpoints; backend validates, secures, and reads/writes persistent data through Supabase while handling sensitive logic centrally.",
  },
  {
    q: "Why is sensitive logic kept in backend, not frontend?",
    a: "Frontend runs on user device and can be inspected. Backend is controlled by us, so security checks, encryption flow, and policy decisions are safer there.",
  },
  {
    q: "What is the role of data validation in this project?",
    a: "Validation blocks malformed or dangerous inputs before business logic runs. It reduces unexpected behavior and closes common bugs early in request handling.",
  },
  {
    q: "Why are there separate routes for separate operations?",
    a: "Clear route separation improves readability, testing, access control, and debugging. One route should do one job well.",
  },
  {
    q: "How is user session risk reduced after login?",
    a: "By requiring MFA and freshness checks. Even if someone gets a stale session context, sensitive actions are blocked until reauthentication is done.",
  },
  {
    q: "What is the difference between password hashing and vault encryption?",
    a: "Hashing is one-way and used for password verification. Encryption is two-way and used when data must be stored securely but later read by authorized flow.",
  },
  {
    q: "Why does one-time secret feature improve safety?",
    a: "It limits lifetime and visibility of shared sensitive text. Even if a link leaks later, expired/consumed secret reduces long-term damage.",
  },
  {
    q: "What practical attacks does MFA help against?",
    a: "Credential stuffing, reused password compromise, and many phishing-after-password events become harder because attacker still needs valid OTP.",
  },
  {
    q: "What is the project's honest threat model boundary?",
    a: "It significantly raises protection against common web threats and unsafe user habits, but does not claim absolute resistance against every advanced attacker scenario.",
  },
  {
    q: "Why does the app use both educational content and security features?",
    a: "Security is partly technical and partly behavioral. Users make safer choices when they understand risks, so education complements technical controls.",
  },
  {
    q: "Why not keep everything in one giant frontend state only?",
    a: "Critical data must be persisted and verified server-side. Pure frontend state is temporary and not a trustworthy source for secure workflows.",
  },
  {
    q: "Why do we mention deterministic behavior in security guide content?",
    a: "Deterministic rendering avoids hydration mismatch and keeps UI behavior consistent across server/client render paths.",
  },
  {
    q: "What is optimistic UI and where is it useful?",
    a: "Optimistic UI updates screen before server confirmation for smoother experience. It is useful in chat interactions where quick feedback matters.",
  },
  {
    q: "What are indexes and why mention them in SQL schema discussion?",
    a: "Indexes are database lookup accelerators. They are important in chat/history queries where record count can grow quickly.",
  },
  {
    q: "How does environment config improve deployment quality?",
    a: "It separates code from environment-specific values. Same codebase can run across local, staging, and production with safer config management.",
  },
  {
    q: "Why include toasts and feedback components in security-focused app?",
    a: "Good feedback prevents user confusion and mistakes. Clear success/error messages are part of secure UX because they guide correct action flow.",
  },
  {
    q: "Why is route guarding done at multiple levels?",
    a: "Defense in depth. Global watchers catch expired trust broadly, and per-page checks protect sensitive routes individually.",
  },
  {
    q: "Why keep reusable UI primitives rather than page-specific controls?",
    a: "Reusable primitives enforce consistent behavior and styling, reduce duplication, and make bug fixes easier across the app.",
  },
  {
    q: "What is the educational value of this project beyond coding?",
    a: "It teaches system design, secure thinking, user-flow design, practical trade-offs, and honest communication of limitations.",
  },
  {
    q: "If asked: 'Is this production-ready?' how should we answer?",
    a: "Say it is production-oriented and follows many good practices, but final production readiness depends on full testing, monitoring, hardening, and operational controls.",
  },
  {
    q: "How should we answer if teacher asks 'Why not use Django?'",
    a: "Django is strong for full-stack monolith workflows. We chose FastAPI because this project is API-centric and benefits from lightweight, typed, fast endpoint development.",
  },
  {
    q: "How should we answer if teacher asks 'Why not WebSockets everywhere for chat?'",
    a: "WebSockets are great for full realtime, but they add connection management complexity. Polling can be acceptable for scoped rooms when balanced against project complexity and timeline.",
  },
  {
    q: "What testing questions can come in viva?",
    a: "Expect questions on route validation tests, auth flow tests, MFA expiry tests, encryption-decryption integrity checks, and frontend navigation/guard behavior tests.",
  },
  {
    q: "What is a strong final summary answer for the entire project?",
    a: "CipherGate is a practical security-focused platform that combines safe authentication, controlled data handling, secure-sharing patterns, and user-friendly workflows with clear architecture and honest security boundaries.",
  },
];

const crossQuestions = [
  {
    ask: "Teacher may ask: If frontend is compromised, what still protects data?",
    best: "Core protections still rely on backend verification, hashed credentials, encrypted storage flow, and trust-expiry checks instead of trusting UI alone.",
  },
  {
    ask: "Teacher may ask: What is your biggest design trade-off?",
    best: "We balanced security depth with practical development speed and usability. Some controls are deterrence-oriented on client side while critical security stays server-enforced.",
  },
  {
    ask: "Teacher may ask: What would you improve next?",
    best: "Add deeper automated tests, stronger audit logging, stricter token/session architecture, and optional realtime channel upgrades where needed.",
  },
  {
    ask: "Teacher may ask: How did you ensure maintainability?",
    best: "By using route separation, reusable components, central utility helpers, and clear chapter-like documentation for future contributors.",
  },
  {
    ask: "Teacher may ask: Why is this project meaningful for real users?",
    best: "Because users really struggle with unsafe password/secret handling, and this solution gives practical safer workflows instead of only theory.",
  },
];

const fileAtlas = [
  {
    cluster: "Backend Core",
    file: "main.py",
    purpose: "Central Python API layer for auth, vault, chat, secrets, and tools.",
    userImpact: "Everything visible in the UI ultimately depends on routes defined here.",
    mechanisms: ["FastAPI route contracts", "Supabase data operations", "In-memory ephemeral state"],
    terms: ["endpoint", "tombstone", "ephemeral state"],
    q: "Why mix database and in-memory state?",
    a: "Persistent records belong in DB; temporary high-churn signals are intentionally short-lived in memory.",
  },
  {
    cluster: "Backend Core",
    file: "auth_logic.py",
    purpose: "Authentication helper module for hashing and OTP operations.",
    userImpact: "Enables safe login verification and authenticator code validation.",
    mechanisms: ["bcrypt password hashing", "pyotp TOTP secret generation", "verification window handling"],
    terms: ["bcrypt", "TOTP", "time window"],
    q: "Why hash passwords instead of storing them directly?",
    a: "Hashed passwords prevent immediate plaintext exposure if data is leaked.",
  },
  {
    cluster: "Backend Core",
    file: "dashboard_manager.py",
    purpose: "Password variant generation logic.",
    userImpact: "Powers the password generator page with configurable outputs.",
    mechanisms: ["character pool construction", "seed mutation", "class enforcement + shuffle"],
    terms: ["entropy", "variant", "ambiguous characters"],
    q: "Why enforce character classes after generation?",
    a: "It avoids edge cases where random output misses required policy constraints.",
  },
  {
    cluster: "Backend Core",
    file: "setup_chat_tables.sql",
    purpose: "Database schema for chat rooms, participants, and messages.",
    userImpact: "Makes room history and membership durable across sessions.",
    mechanisms: ["table definitions", "foreign keys", "indexes"],
    terms: ["schema", "foreign key", "index"],
    q: "Why are indexes important for chat?",
    a: "They keep room/message lookups responsive as records grow.",
  },
  {
    cluster: "Frontend App Shell",
    file: "frontend/app/page.js",
    purpose: "Landing route and first client-side routing gate.",
    userImpact: "Sends returning users toward MFA flow and new users toward onboarding pages.",
    mechanisms: ["local session check", "router navigation", "animated hero content"],
    terms: ["landing route", "session gate", "client routing"],
    q: "Why not send users directly to dashboard?",
    a: "Because MFA trust must be verified before protected dashboard access.",
  },
  {
    cluster: "Frontend App Shell",
    file: "frontend/app/layout.js",
    purpose: "Global wrapper that mounts app-wide guards and providers.",
    userImpact: "Ensures watchers and notifications are consistent across routes.",
    mechanisms: ["root layout mount", "global watcher components", "toaster integration"],
    terms: ["root layout", "global guard", "provider"],
    q: "Why mount watchers globally?",
    a: "It prevents missing protection on individual pages.",
  },
  {
    cluster: "Auth Flow Pages",
    file: "frontend/app/auth/login/page.jsx",
    purpose: "Combined login/register entry form.",
    userImpact: "Users authenticate and get routed into MFA challenge.",
    mechanisms: ["mode toggle", "auth API call", "session seed with unverified MFA"],
    terms: ["session seed", "next path", "auth mode"],
    q: "Why store session before MFA is complete?",
    a: "Identity context is saved first, trust state is granted only after MFA verify.",
  },
  {
    cluster: "Auth Flow Pages",
    file: "frontend/app/auth/mfa/page.jsx",
    purpose: "MFA setup/challenge/verify route.",
    userImpact: "Displays QR setup if needed and verifies 6-digit code.",
    mechanisms: ["challenge endpoint", "verify endpoint", "session trust timestamp update"],
    terms: ["challenge", "verification", "reauth"],
    q: "What is mfaVerifiedAt used for?",
    a: "It enforces time-bound trust and triggers reauthentication after expiry.",
  },
  {
    cluster: "Auth Flow Pages",
    file: "frontend/app/auth/recover/page.jsx",
    purpose: "Recovery-key based password reset route.",
    userImpact: "Lets locked-out users reset passwords using recovery data.",
    mechanisms: ["input validation", "recovery reset API call", "redirect back to login"],
    terms: ["recovery key", "reset flow", "validation"],
    q: "What prevents random password resets?",
    a: "Reset requires the correct account-linked recovery key.",
  },
  {
    cluster: "Dashboard and Tools",
    file: "frontend/app/dashboard/page.jsx",
    purpose: "Primary control center after auth.",
    userImpact: "Displays vault stats, notes/bookmarks tools, and navigation cards.",
    mechanisms: ["MFA session gate", "vault aggregate fetch", "rich-note sanitization"],
    terms: ["dashboard hub", "sanitization", "reauth countdown"],
    q: "Why is this page so central?",
    a: "It is the orchestrator that links all secure workflows and status indicators.",
  },
  {
    cluster: "Dashboard and Tools",
    file: "frontend/app/dashboard/chat/page.jsx",
    purpose: "Ephemeral room-based chat interface.",
    userImpact: "Users create/join controlled rooms with advanced interaction features.",
    mechanisms: ["polling sync", "optimistic messaging", "content prefixes for rich message types"],
    terms: ["optimistic UI", "invite policy", "approval flow"],
    q: "Why is this not a basic chat feed?",
    a: "It supports room policies, passcodes, approvals, and lifecycle controls.",
  },
  {
    cluster: "Dashboard and Tools",
    file: "frontend/app/dashboard/passwords/page.jsx",
    purpose: "Password vault manager.",
    userImpact: "Store/search/delete credentials and view strength analysis.",
    mechanisms: ["CRUD API calls", "zxcvbn strength scoring", "breach audit integration"],
    terms: ["strength heuristic", "breach audit", "crack estimate"],
    q: "Why combine multiple analyses?",
    a: "Fast local scoring gives instant feedback while external checks add risk context.",
  },
  {
    cluster: "Dashboard and Tools",
    file: "frontend/app/dashboard/authenticator/page.jsx",
    purpose: "Authenticator seed management and live OTP display.",
    userImpact: "Users can manage seeds, scan QR codes, and copy rotating OTP codes.",
    mechanisms: ["camera capture + backend decode", "OTP countdown refresh", "seed CRUD"],
    terms: ["OTP period", "seed", "QR decode"],
    q: "Why periodic refresh of codes?",
    a: "Because OTP values rotate on strict time windows.",
  },
  {
    cluster: "Dashboard and Tools",
    file: "frontend/app/dashboard/generator/page.jsx",
    purpose: "Password generation interface.",
    userImpact: "Users generate policy-compliant password variants quickly.",
    mechanisms: ["parameterized requests", "variant reshuffle", "copy-friendly outputs"],
    terms: ["policy constraint", "variant", "shuffle"],
    q: "Why include base string options?",
    a: "It balances memorability with stronger transformations and randomness.",
  },
  {
    cluster: "Dashboard and Tools",
    file: "frontend/app/dashboard/security/page.jsx",
    purpose: "Article-based security learning surface.",
    userImpact: "Users read practical guidance for safer account behavior.",
    mechanisms: ["search filtering", "article modal", "deterministic content set"],
    terms: ["phishing", "breach response", "security hygiene"],
    q: "Why include education in product?",
    a: "User decisions are part of security; education reduces risky behavior.",
  },
  {
    cluster: "Dashboard and Tools",
    file: "frontend/app/dashboard/secrets/page.jsx",
    purpose: "One-time secret creation and read flow.",
    userImpact: "Share temporary notes that are consumed once or expire.",
    mechanisms: ["tokenized link flow", "consume-on-read behavior", "custom expiry controls"],
    terms: ["burn-after-read", "token", "expiry window"],
    q: "How is this different from normal notes?",
    a: "Normal notes persist; one-time secrets are intentionally self-destructing transfers.",
  },
  {
    cluster: "Knowledge Pages",
    file: "frontend/app/research-papers/page.jsx",
    purpose: "Technical deep-dive presentation layer.",
    userImpact: "Provides architecture-level understanding for technical audience.",
    mechanisms: ["section-driven content arrays", "MathJax rendering", "appendix inventories"],
    terms: ["methodology", "endpoint family", "technical narrative"],
    q: "Is this runtime logic?",
    a: "No, this is documentation UI that explains runtime logic.",
  },
  {
    cluster: "Knowledge Pages",
    file: "frontend/app/cipher-book/page.jsx",
    purpose: "Teaching-oriented project book for partner preparation.",
    userImpact: "Transforms implementation details into teachable chapters.",
    mechanisms: ["chapter and atlas rendering", "viva-focused Q/A blocks", "engaging narrative pacing"],
    terms: ["teaching map", "viva prep", "storyline"],
    q: "Why maintain both book and paper?",
    a: "The paper is technical reference; the book is coaching and explanation.",
  },
  {
    cluster: "Knowledge Pages",
    file: "frontend/app/documentation/page.jsx",
    purpose: "General product documentation and narrative page.",
    userImpact: "Introduces mission and high-level architecture to broad readers.",
    mechanisms: ["structured sections", "animated brand text", "descriptive cards"],
    terms: ["narrative doc", "architecture overview", "feature messaging"],
    q: "Are all doc claims implementation-precise?",
    a: "Not always; verify claims against backend source for strict accuracy.",
  },
  {
    cluster: "Guards and Shared UI",
    file: "frontend/components/security-hardening-guard.jsx",
    purpose: "Best-effort browser friction layer on dashboard routes.",
    userImpact: "Blocks context menu and common devtools shortcuts.",
    mechanisms: ["route-aware listener activation", "contextmenu interception", "keydown interception"],
    terms: ["hardening", "shortcut interception", "deterrence"],
    q: "Does this guarantee no inspection?",
    a: "No. It discourages casual inspection, not determined system-level access.",
  },
  {
    cluster: "Guards and Shared UI",
    file: "frontend/components/mfa-reauth-watcher.jsx",
    purpose: "Global MFA freshness enforcer.",
    userImpact: "Redirects users for reauth when trust time expires.",
    mechanisms: ["periodic timer", "session age math", "reauth redirect"],
    terms: ["freshness window", "periodic enforcement", "trust age"],
    q: "Why combine watcher and page checks?",
    a: "Defense in depth: proactive global monitoring plus local route validation.",
  },
  {
    cluster: "Guards and Shared UI",
    file: "frontend/components/ui/select.jsx",
    purpose: "Reusable styled dropdown primitive.",
    userImpact: "Consistent select behavior and appearance across pages.",
    mechanisms: ["Radix composition", "trigger/content/item wrappers", "shared class strategy"],
    terms: ["primitive", "composition", "stateful trigger"],
    q: "Why centralize UI primitives?",
    a: "Centralization keeps style and behavior consistent and easier to maintain.",
  },
  {
    cluster: "Guards and Shared UI",
    file: "frontend/components/ui/button.jsx",
    purpose: "Button variant system.",
    userImpact: "Uniform action controls across the app.",
    mechanisms: ["class-variance map", "size tokens", "shared behavior"],
    terms: ["variant", "token", "primitive"],
    q: "Why not style buttons ad hoc per page?",
    a: "Shared variants reduce inconsistency and speed up updates.",
  },
  {
    cluster: "Guards and Shared UI",
    file: "frontend/components/ui/alert-dialog.jsx",
    purpose: "Confirmation modal primitives.",
    userImpact: "Safer destructive actions through explicit confirmation.",
    mechanisms: ["overlay + content composition", "action/cancel separation", "focus-safe dialog flow"],
    terms: ["modal", "destructive action", "confirmation guard"],
    q: "Why force confirmation for sensitive actions?",
    a: "It reduces irreversible mistakes and communicates consequence clearly.",
  },
  {
    cluster: "Guards and Shared UI",
    file: "frontend/components/ui/sonner.jsx",
    purpose: "Toast notification wrapper.",
    userImpact: "Immediate feedback for success, error, and state updates.",
    mechanisms: ["shared toaster mount", "icon/theming mapping", "non-blocking alerts"],
    terms: ["toast", "non-blocking feedback", "status signal"],
    q: "Why use toasts instead of only inline messages?",
    a: "Toasts preserve flow while still confirming actions instantly.",
  },
  {
    cluster: "Guards and Shared UI",
    file: "frontend/components/ui/encrypted-text.jsx",
    purpose: "Animated text reveal component.",
    userImpact: "Adds cyber-themed reveal effect for branding and emphasis.",
    mechanisms: ["scramble generation", "progressive reveal", "animation frame timing"],
    terms: ["reveal animation", "scramble", "visual storytelling"],
    q: "Is this security encryption?",
    a: "No. It is a visual effect, not cryptographic protection.",
  },
  {
    cluster: "Runtime and Styling",
    file: "frontend/lib/utils.js",
    purpose: "Shared runtime helpers for session and navigation flows.",
    userImpact: "Keeps auth redirects, pending actions, and trust timing consistent.",
    mechanisms: ["safe storage parsing", "MFA remaining-time math", "pending-action replay"],
    terms: ["session replay", "remaining time", "redirect helper"],
    q: "Why preserve pending actions?",
    a: "Users can finish intended secure actions after reauth instead of starting over.",
  },
  {
    cluster: "Runtime and Styling",
    file: "frontend/lib/env.js",
    purpose: "Frontend environment configuration layer.",
    userImpact: "Controls API target and external integration keys.",
    mechanisms: ["env variable reads", "safe defaults", "URL normalization"],
    terms: ["environment variable", "runtime config", "normalization"],
    q: "Why normalize API base URL?",
    a: "It prevents path concatenation bugs like accidental double slashes.",
  },
  {
    cluster: "Runtime and Styling",
    file: "frontend/app/globals.css",
    purpose: "Global design token and baseline style definitions.",
    userImpact: "Consistent look, spacing, typography, and theme behavior.",
    mechanisms: ["CSS variable tokens", "dark-mode overrides", "base layer defaults"],
    terms: ["design token", "theme variable", "base layer"],
    q: "Why centralize style tokens?",
    a: "A single source of truth keeps the entire UI coherent.",
  },
];

const clusters = [
  "Backend Core",
  "Frontend App Shell",
  "Auth Flow Pages",
  "Dashboard and Tools",
  "Knowledge Pages",
  "Guards and Shared UI",
  "Runtime and Styling",
];

function ChapterCard({ chapter }) {
  const Icon = chapter.icon;
  return (
    <motion.article
      id={chapter.id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.4 }}
      className="rounded-[24px] border border-white/10 bg-[rgba(18,18,20,0.84)] p-6 sm:p-7"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
          <Icon size={18} />
        </div>
        <h2 className="text-2xl font-bitcount uppercase text-white">{chapter.title}</h2>
      </div>
      <p className="mt-4 text-sm leading-7 text-white/74">{chapter.summary}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {chapter.points.map((point) => (
          <div key={point} className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-sm text-white/72">
            {point}
          </div>
        ))}
      </div>
    </motion.article>
  );
}

function SectionList({ title, icon: Icon, items }) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[rgba(18,18,20,0.84)] p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
          <Icon size={18} />
        </div>
        <h3 className="text-2xl font-bitcount uppercase text-white">{title}</h3>
      </div>
      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-sm leading-7 text-white/74">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function FileCard({ entry }) {
  return (
    <article className="rounded-[20px] border border-white/10 bg-[rgba(18,18,20,0.8)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-mono text-sm text-primary/90">{entry.file}</h4>
        <span className="rounded-full border border-white/12 bg-black/35 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/52">
          {entry.cluster}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/72"><span className="text-primary">Purpose:</span> {entry.purpose}</p>
      <p className="mt-2 text-sm text-white/72"><span className="text-primary">User impact:</span> {entry.userImpact}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {entry.mechanisms.map((m) => (
          <div key={m} className="rounded-lg border border-white/8 bg-black/30 px-3 py-2 text-xs text-white/70">
            {m}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {entry.terms.map((term) => (
          <span key={term} className="rounded-md border border-primary/25 bg-primary/8 px-2.5 py-1 text-[11px] text-primary/90">
            {term}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-primary/18 bg-primary/6 px-4 py-3 text-sm text-white/78">
        <p><span className="text-primary">Teacher question:</span> {entry.q}</p>
        <p className="mt-2"><span className="text-primary">Strong answer:</span> {entry.a}</p>
      </div>
    </article>
  );
}

export default function CipherBookPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white font-inconsolata selection:bg-primary/30 scroll-smooth">
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
            <BookOpen size={16} />
            <span className="text-xs uppercase tracking-[0.28em] text-primary/80">Cipher Book</span>
          </div>

          <button
            type="button"
            onClick={() => router.push("/research-papers")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/70 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <FileText size={14} /> Research Paper
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,19,21,0.95),rgba(11,11,12,0.95))] px-6 py-10 sm:px-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-primary/70">Partner Teaching Edition</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-bitcount uppercase leading-none text-white sm:text-6xl">
                CipherGate Complete Learning Book
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
                This page is designed to train a non-programmer partner to explain the project deeply and confidently.
                It includes architecture story, security model, file-by-file knowledge atlas, and viva-ready answers.
              </p>
            </div>

            <div className="rounded-[20px] border border-primary/20 bg-primary/8 p-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-primary/75">Teaching objective</p>
              <p className="mt-2 text-sm leading-7 text-white/78">
                After reading this, you should be able to explain what each major file does,
                why it exists, and how the full system works end to end.
              </p>
            </div>
          </div>
        </section>

        <section className="no-print mt-8 grid gap-4 rounded-[22px] border border-white/10 bg-[rgba(18,18,20,0.75)] p-5 lg:grid-cols-3 xl:grid-cols-7">
          {learningChapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/65 transition-colors hover:border-primary/35 hover:text-primary"
            >
              <span>{chapter.title}</span>
              <ChevronRight size={13} />
            </a>
          ))}
        </section>

        <div className="mt-8 space-y-6">
          {learningChapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>

        <section id="chapter-1" className="mt-8">
          <SectionList title="System Data Flow" icon={Route} items={systemFlow} />
        </section>

        <section id="chapter-2" className="mt-8 grid gap-4 lg:grid-cols-2">
          <SectionList title="Security Model" icon={Shield} items={securityModel} />
          <SectionList title="10 Must-Know Concepts" icon={BrainCircuit} items={mustKnow} />
        </section>

        <section id="chapter-3" className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(18,18,20,0.84)] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <Layers size={18} />
            </div>
            <h3 className="text-2xl font-bitcount uppercase text-white">File Atlas (Full Project Coverage)</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/74">
            Study each card as a mini teaching unit: purpose, user-visible impact, mechanism, terms, and one strong viva answer.
          </p>

          <div className="mt-5 space-y-8">
            {clusters.map((cluster) => {
              const entries = fileAtlas.filter((entry) => entry.cluster === cluster);
              if (!entries.length) return null;
              return (
                <div key={cluster}>
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-primary/70">{cluster}</p>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {entries.map((entry) => (
                      <FileCard key={entry.file} entry={entry} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section id="chapter-4" className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(18,18,20,0.84)] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <Sparkles size={18} />
            </div>
            <h3 className="text-2xl font-bitcount uppercase text-white">Teacher Defense: Mistakes To Avoid</h3>
          </div>
          <div className="mt-5 space-y-2">
            {avoidMistakes.map((item) => (
              <div key={item} className="rounded-xl border border-white/8 bg-black/30 px-4 py-3 text-sm leading-7 text-white/74">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-white/78">
            <span className="text-primary">Final advice:</span> Explain in order: user problem - feature - security reason - technical mechanism.
            This structure sounds natural and avoids both overclaiming and vague answers.
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/75">Viva Practice Bank</p>
            <h4 className="mt-2 text-2xl font-bitcount uppercase text-white">More Questions With Detailed Answers</h4>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/72">
              Practice these in your own words. Keep the same logic, but speak naturally so answers feel genuine.
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {vivaQuestions.map((item) => (
                <article key={item.q} className="rounded-xl border border-white/10 bg-black/35 p-4">
                  <p className="text-sm font-semibold leading-6 text-primary">Q. {item.q}</p>
                  <p className="mt-2 text-sm leading-7 text-white/75">A. {item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="chapter-5" className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(18,18,20,0.84)] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <BookOpen size={18} />
            </div>
            <h3 className="text-2xl font-bitcount uppercase text-white">Core Basics Explained (Deep Beginner Mode)</h3>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/74">
            This section explains small but important terms in easy language. If someone asks what API, route,
            bcrypt, cryptography, backend, or project base means, you can answer clearly without confusion.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {basicsGlossary.map((item) => (
              <article key={item.term} className="rounded-xl border border-white/10 bg-black/35 p-4">
                <p className="text-sm font-semibold leading-6 text-primary">{item.term}</p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  <span className="text-primary">Simple:</span> {item.simple}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/74">
                  <span className="text-primary">Why it matters here:</span> {item.meaning}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="chapter-6" className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(18,18,20,0.84)] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <FileText size={18} />
            </div>
            <h3 className="text-2xl font-bitcount uppercase text-white">Libraries and Stack Explained</h3>
          </div>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-white/74">
            This chapter answers what these technologies are, why they were chosen, and how they support this project.
            Use it when teachers ask, "Why this stack?" or "What does this library do?"
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/75">Framework Vs Library (Very Important)</p>
            <p className="mt-2 text-sm leading-7 text-white/74">
              Many viva questions start here. The short answer is: library is called by your code, framework calls your code.
            </p>
            <div className="mt-4 space-y-3">
              {frameworkVsLibraryRows.map((row) => (
                <article key={row.topic} className="rounded-lg border border-white/10 bg-[rgba(20,20,22,0.8)] p-3">
                  <p className="text-sm font-semibold text-primary">{row.topic}</p>
                  <p className="mt-2 text-sm leading-7 text-white/74">
                    <span className="text-primary">Framework:</span> {row.framework}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-white/74">
                    <span className="text-primary">Library:</span> {row.library}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/8 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/75">Core Stack Q and A</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {stackQuestions.map((item) => (
                <article key={item.q} className="rounded-xl border border-white/10 bg-black/35 p-4">
                  <p className="text-sm font-semibold leading-6 text-primary">Q. {item.q}</p>
                  <p className="mt-2 text-sm leading-7 text-white/75">A. {item.a}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/75">Python Libraries (Backend)</p>
              <div className="mt-3 space-y-3">
                {pythonLibraries.map((lib) => (
                  <article key={lib.name} className="rounded-xl border border-white/10 bg-black/35 p-4">
                    <p className="text-sm font-semibold text-primary">{lib.name}</p>
                    <p className="mt-2 text-sm leading-7 text-white/74">
                      <span className="text-primary">What it is:</span> {lib.what}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/74">
                      <span className="text-primary">Why used here:</span> {lib.why}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/75">npm Libraries (Frontend)</p>
              <div className="mt-3 space-y-3">
                {npmLibraries.map((lib) => (
                  <article key={lib.name} className="rounded-xl border border-white/10 bg-black/35 p-4">
                    <p className="text-sm font-semibold text-primary">{lib.name}</p>
                    <p className="mt-2 text-sm leading-7 text-white/74">
                      <span className="text-primary">What it is:</span> {lib.what}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/74">
                      <span className="text-primary">Why used here:</span> {lib.why}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="chapter-7" className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(18,18,20,0.84)] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-2 text-primary">
              <BrainCircuit size={18} />
            </div>
            <h3 className="text-2xl font-bitcount uppercase text-white">No-Gap Mastery Question Bank</h3>
          </div>

          <p className="mt-4 max-w-5xl text-sm leading-7 text-white/74">
            This is the final high-coverage section for deep viva prep. It includes advanced conceptual,
            architecture, security, and trade-off questions so you can answer confidently even when the
            teacher asks unexpected follow-ups.
          </p>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/8 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/75">Advanced High-Coverage Questions</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {deepVivaBank.map((item) => (
                <article key={item.q} className="rounded-xl border border-white/10 bg-black/35 p-4">
                  <p className="text-sm font-semibold leading-6 text-primary">Q. {item.q}</p>
                  <p className="mt-2 text-sm leading-7 text-white/75">A. {item.a}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/35 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/75">Cross-Question Defense</p>
            <p className="mt-2 text-sm leading-7 text-white/74">
              These are likely follow-up questions after your first answer. Memorize this style to avoid getting stuck.
            </p>
            <div className="mt-4 space-y-3">
              {crossQuestions.map((item) => (
                <article key={item.ask} className="rounded-lg border border-white/10 bg-[rgba(20,20,22,0.8)] p-3">
                  <p className="text-sm font-semibold text-primary">{item.ask}</p>
                  <p className="mt-2 text-sm leading-7 text-white/74">
                    <span className="text-primary">Best answer:</span> {item.best}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
