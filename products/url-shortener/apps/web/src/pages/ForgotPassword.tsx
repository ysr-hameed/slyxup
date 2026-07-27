import { useState } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AUTH_BASE } from "../config";

const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-zinc-900 rounded-xl border border-zinc-800 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mt-3">Check your email</h1>
          <p className="text-zinc-400 text-sm mt-1">
            If an account with <span className="text-zinc-200 font-medium">{email}</span> exists,
            we've sent a password reset link.
          </p>
          <a href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/login"); window.dispatchEvent(new Event("popstate")); }}
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline text-sm">Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/"); window.dispatchEvent(new Event("popstate")); }}
            className="text-xl font-bold text-zinc-100 hover:text-zinc-300 transition-colors">
            <span className="text-blue-500">Slyx</span>Up
          </a>
        </div>
        <form onSubmit={handleSubmit} className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-zinc-100">Reset password</h1>
            <p className="text-zinc-500 text-sm mt-1">Enter your email to receive a reset link</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-800/60 text-red-300 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              className="w-full pl-9 p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button
            className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Sending...
              </span>
            ) : "Send Reset Link"}
          </button>

          <p className="text-center text-sm">
            <a href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/login"); window.dispatchEvent(new Event("popstate")); }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors">Back to login</a>
          </p>
        </form>
      </div>
    </div>
  );
}
