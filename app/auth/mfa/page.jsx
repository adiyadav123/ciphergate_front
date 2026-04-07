import { Suspense } from "react";
import MfaClient from "./mfa-client";

function MfaPageFallback() {
	return (
		<div className="min-h-screen bg-black text-white font-inconsolata flex items-center justify-center">
			<p className="text-sm uppercase tracking-[0.2em] text-gray-400">Preparing MFA challenge...</p>
		</div>
	);
}

export default function MfaPage() {
	return (
		<Suspense fallback={<MfaPageFallback />}>
			<MfaClient />
		</Suspense>
	);
}