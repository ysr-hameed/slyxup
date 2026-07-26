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
        <div className="text-center space-y-4 p-6 bg-zinc-900 rounded-xl max-w-sm">
          <h1 className="text-xl font-bold text-zinc-100">Check Your Email</h1>
          <p className="text-zinc-400 text-sm">
            If an account with <span className="text-zinc-200 font-medium">{email}</span> exists,
            we've sent a password reset link.
          </p>
          <a href="/" className="inline-block text-blue-400 hover:text-blue-300 underline text-sm">Back to login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 bg-zinc-900 rounded-xl space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-100">Reset Password</h1>
          <p className="text-zinc-400 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm">{error}</div>
        )}

        <input
          className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <button
          className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="text-center text-sm">
          <a href="/" className="text-zinc-500 hover:text-zinc-300 underline">Back to login</a>
        </p>
      </form>
    </div>
  );
}
