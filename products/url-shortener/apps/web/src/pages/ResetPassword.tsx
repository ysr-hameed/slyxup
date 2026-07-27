import { useState } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AUTH_BASE } from "../config";

const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain uppercase, lowercase, and a number");
      return;
    }
    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-zinc-900 rounded-xl border border-green-800/50 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-green-400 mt-3">Password reset!</h1>
          <p className="text-zinc-400 text-sm mt-1">You can now sign in with your new password.</p>
          <a href="/login" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/login"); window.dispatchEvent(new Event("popstate")); }}
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline text-sm">Sign in</a>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-zinc-900 rounded-xl border border-red-800/50 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-400 mt-3">Invalid link</h1>
          <p className="text-zinc-400 text-sm mt-1">This password reset link is invalid or expired.</p>
          <a href="/forgot-password" onClick={(e) => { e.preventDefault(); window.history.pushState({}, "", "/forgot-password"); window.dispatchEvent(new Event("popstate")); }}
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 underline text-sm">Request a new one</a>
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
            <h1 className="text-xl font-bold text-zinc-100">Set new password</h1>
            <p className="text-zinc-500 text-sm mt-1">Must be 8+ characters with upper, lower, and number</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              className="w-full pl-9 p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              className="w-full pl-9 p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
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
                Resetting...
              </span>
            ) : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
