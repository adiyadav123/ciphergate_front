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

	return (
		<div className="min-h-screen bg-black text-white font-inconsolata flex items-center justify-center px-6">
			<div className="w-full max-w-xl rounded-[20px] bg-[rgba(20,19,19,0.637)] border border-white/10 p-8">
				<h1 className="text-3xl text-primary font-bitcount uppercase">Multi-Factor Authentication</h1>
				<p className="mt-3 text-sm text-gray-400">
					{isReauth && "Session timed out. Re-enter your code to continue. "}
					{challenge?.needs_setup
						? "Scan this QR in Google Authenticator (or any TOTP app), then enter the 6-digit code."
						: "Enter your current 6-digit authenticator code to continue."}
				</p>

				{challenge?.needs_setup && (
					<div className="mt-6 rounded-lg border border-primary/20 bg-black/40 p-4">
						{challenge?.qr_code_url && (
							<img
								src={challenge.qr_code_url}
								alt="MFA QR code"
								className="mx-auto h-56 w-56 rounded-md border border-white/10 bg-white p-2"
							/>
						)}
						<p className="mt-4 text-xs uppercase tracking-[0.2em] text-gray-500">Manual setup key</p>
						<p className="mt-2 break-all text-sm text-primary font-mono">{challenge?.secret_key}</p>
					</div>
				)}

				<form onSubmit={handleVerify} className="mt-6 space-y-4">
					<div className="space-y-2">
						<Label htmlFor="mfa-code" className="text-gray-400">Authenticator code</Label>
						<Input
							id="mfa-code"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={6}
							value={code}
							onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
							placeholder="123456"
							className="h-12 bg-black/40 border-gray-600 text-xl tracking-[0.3em] text-center rounded-[10px]"
							required
						/>
					</div>

					<Button
						type="submit"
						disabled={verifying}
						className="w-full h-12 bg-primary text-black hover:bg-white rounded-[10px] uppercase tracking-[0.2em] font-bold cursor-pointer"
					>
						{verifying ? "Verifying..." : "Verify and continue"}
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
			</div>
		</div>
	);
}