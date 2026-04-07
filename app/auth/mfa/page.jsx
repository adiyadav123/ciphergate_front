"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/env";

export default function MfaPage() {
	const [loading, setLoading] = useState(true);
	const [verifying, setVerifying] = useState(false);
	const [code, setCode] = useState("");
	const [session, setSession] = useState(null);
	const [challenge, setChallenge] = useState(null);
	const [status, setStatus] = useState(null);
	const searchParams = useSearchParams();
	const isReauth = searchParams.get("reauth") === "1";

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

		setSession(parsed);
		fetchChallenge(parsed.user.id);
	}, []);

	const fetchChallenge = async (userId) => {
		setLoading(true);
		setStatus(null);

		try {
			const res = await fetch(`${API_BASE_URL}/auth/mfa/challenge`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user_id: userId }),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.detail || "Unable to initialize MFA challenge");
			}

			setChallenge(data);
		} catch (err) {
			setStatus({ type: "error", msg: err.message || "MFA challenge failed." });
		} finally {
			setLoading(false);
		}
	};

	const handleVerify = async (e) => {
		e.preventDefault();
		setStatus(null);

		const normalized = code.trim().replace(/\s+/g, "");
		if (!/^\d{6}$/.test(normalized)) {
			setStatus({ type: "error", msg: "Enter a valid 6-digit code." });
			return;
		}

		setVerifying(true);
		try {
			const res = await fetch(`${API_BASE_URL}/auth/mfa/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					user_id: session.user.id,
					code: normalized,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.detail || "Invalid MFA code");
			}

			const updatedSession = {
				...session,
				mfaVerified: true,
				mfaVerifiedAt: Date.now(),
			};
			localStorage.setItem("cipher_session", JSON.stringify(updatedSession));

			setStatus({ type: "success", msg: "MFA verified. Redirecting to vault..." });
			setTimeout(() => {
				window.location.href = "/dashboard";
			}, 1000);
		} catch (err) {
			setStatus({ type: "error", msg: err.message || "MFA verification failed." });
		} finally {
			setVerifying(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-black text-white font-inconsolata flex items-center justify-center">
				<p className="text-sm uppercase tracking-[0.2em] text-gray-400">Preparing MFA challenge...</p>
			</div>
		);
	}

export default function MfaPage() {
	return (
		<Suspense fallback={<MfaFallback />}>
			<MfaClient />
		</Suspense>
	);
}