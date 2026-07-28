import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
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
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link if the account exists.">
        <div className="text-center p-8 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-900/30 border border-blue-800/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-zinc-300 text-sm">
            If an account with <span className="text-zinc-100 font-medium">{email}</span> exists,
            we've sent a password reset link.
          </p>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/login");
              window.dispatchEvent(new Event("popstate"));
            }}
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-800/30 text-red-300 text-sm">
            {error}
          </div>
        )}
        <Input
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Button type="submit" loading={loading} className="w-full">
          Send Reset Link
        </Button>
        <div className="text-center">
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/login");
              window.dispatchEvent(new Event("popstate"));
            }}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </a>
        </div>
      </form>
    </AuthLayout>
  );
}
