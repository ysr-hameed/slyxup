import { useEffect, useState } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { Mail, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { AUTH_BASE } from "../config";

const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });

export function VerifyEmail({ email }: { email?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "resent" | "verified" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setStatus("sending");
      api.auth.verifyEmail(token).then(() => {
        setStatus("verified");
      }).catch((err) => {
        setStatus("error");
        setErrorMsg(err?.message || "Invalid or expired token");
      });
    }
  }, []);

  if (status === "verified") {
    return (
      <AuthLayout title="Email Verified!" subtitle="Your email has been verified successfully.">
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
          >
            <Button>Sign in</Button>
          </a>
        </div>
      </AuthLayout>
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
      <AuthLayout title="Verification Failed" subtitle={errorMsg}>
        <div className="text-center p-8 bg-zinc-900/50 border border-red-800/30 rounded-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-900/30 border border-red-800/30 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7 text-red-400" />
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
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Check your email" subtitle={email ? `We sent a verification link to ${email}.` : undefined}>
      <div className="text-center p-8 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-blue-900/30 border border-blue-800/30 flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7 text-blue-400" />
        </div>
        {status === "resent" && (
          <p className="text-green-400 text-sm">Verification email resent!</p>
        )}
        {status === "error" && (
          <p className="text-red-400 text-sm">{errorMsg || "Failed to resend"}</p>
        )}
        <p className="text-zinc-500 text-xs">Didn't get the email?</p>
        <Button variant="secondary" onClick={resendEmail} loading={status === "sending"} className="w-full">
          Resend
        </Button>
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, "", "/login");
            window.dispatchEvent(new Event("popstate"));
          }}
          className="block text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Back to login
        </a>
      </div>
    </AuthLayout>
  );
}
