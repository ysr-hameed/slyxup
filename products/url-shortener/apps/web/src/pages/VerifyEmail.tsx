import { useEffect, useState } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AUTH_BASE } from "../config";

const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });

export function VerifyEmail({ email }: { email?: string }) {
  const [status, setStatus] = useState<"sending" | "resent" | "verified" | "error">("sending");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      api.auth.verifyEmail(token).then(() => {
        setStatus("verified");
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
      }).catch((err) => {
        setStatus("error");
        setErrorMsg(err.message || "Invalid or expired token");
      });
    }
  }, []);

  if (status === "verified") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-zinc-900 rounded-xl border border-green-800/50 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-green-400 mt-3">Email Verified!</h1>
          <p className="text-zinc-400 text-sm mt-1">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const resendEmail = async () => {
    if (!email) return;
    setStatus("sending");
    try {
      await api.auth.resendVerification(email);
      setStatus("resent");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to resend");
    }
  };

  const hasToken = new URLSearchParams(window.location.search).has("token");

  if (hasToken && status === "error") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-zinc-900 rounded-xl border border-red-800/50 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-400 mt-3">Verification Failed</h1>
          <p className="text-zinc-400 text-sm mt-1">{errorMsg}</p>
          <a href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/login"); window.dispatchEvent(new Event("popstate")); }}
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline text-sm">Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center p-8 bg-zinc-900 rounded-xl border border-zinc-800 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-100 mt-3">Check your email</h1>
        {email && (
          <p className="text-zinc-400 text-sm mt-1">
            We sent a verification link to <span className="text-zinc-200 font-medium">{email}</span>.
          </p>
        )}
        <p className="text-zinc-500 text-xs mt-3">Didn't get the email?</p>
        <button
          className="mt-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          onClick={resendEmail}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending..." : status === "resent" ? "Resent!" : "Resend"}
        </button>
        <div className="mt-4">
          <a href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/login"); window.dispatchEvent(new Event("popstate")); }}
            className="text-zinc-500 hover:text-zinc-300 underline text-sm">Back to login</a>
        </div>
      </div>
    </div>
  );
}
