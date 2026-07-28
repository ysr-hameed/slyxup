import { useState } from "react";
import { Lock, CheckCircle, XCircle } from "lucide-react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
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

    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain uppercase, lowercase, and a number"); return;
    }
    if (!token) { setError("Invalid reset link"); return; }

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
      <AuthLayout title="Password reset!" subtitle="You can now sign in with your new password.">
        <div className="text-center p-8 bg-zinc-900/50 border border-green-800/30 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-green-900/30 border border-green-800/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/login");
              window.dispatchEvent(new Event("popstate"));
            }}
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Sign in
          </a>
        </div>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is invalid or expired.">
        <div className="text-center p-8 bg-zinc-900/50 border border-red-800/30 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-900/30 border border-red-800/30 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <a
            href="/forgot-password"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/forgot-password");
              window.dispatchEvent(new Event("popstate"));
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Request a new one
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Must be 8+ characters with upper, lower, and number">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-800/30 text-red-300 text-sm">
            {error}
          </div>
        )}
        <Input
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Input
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading} className="w-full">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
