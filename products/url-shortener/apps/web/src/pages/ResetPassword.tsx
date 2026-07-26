import { useState } from "react";
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({
  authBaseUrl: import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online",
});

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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
        <div className="text-center space-y-4 p-6 bg-zinc-900 rounded-xl">
          <h1 className="text-2xl font-bold text-green-400">Password Reset!</h1>
          <p className="text-zinc-400 text-sm">You can now sign in with your new password.</p>
          <a href="/" className="inline-block text-blue-400 hover:text-blue-300 underline text-sm">Sign in</a>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 p-6 bg-zinc-900 rounded-xl">
          <h1 className="text-xl font-bold text-red-400">Invalid Link</h1>
          <p className="text-zinc-400 text-sm">This password reset link is invalid or expired.</p>
          <a href="/forgot-password" className="inline-block text-blue-400 hover:text-blue-300 underline text-sm">Request a new one</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 bg-zinc-900 rounded-xl space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-100">Set New Password</h1>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm">{error}</div>
        )}

        <input
          className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <input
          className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />

        <button
          className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          type="submit"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
