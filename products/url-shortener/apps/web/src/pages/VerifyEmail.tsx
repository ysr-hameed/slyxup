import { useEffect, useState } from "react";
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({
  authBaseUrl: import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online",
});

export function VerifyEmail({ email }: { email?: string }) {
  const [status, setStatus] = useState<"sending" | "resent" | "verified">("sending");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      api.auth.verifyEmail(token).then(() => {
        setStatus("verified");
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
      }).catch(() => {
        setStatus("sending");
      });
    }
  }, []);

  if (status === "verified") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 p-6 bg-zinc-900 rounded-xl">
          <h1 className="text-2xl font-bold text-green-400">Email Verified!</h1>
          <p className="text-zinc-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const resendEmail = async () => {
    if (!email) return;
    setStatus("resent");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 p-6 bg-zinc-900 rounded-xl max-w-sm">
        <h1 className="text-xl font-bold text-zinc-100">Check Your Email</h1>
        <p className="text-zinc-400 text-sm">
          We sent a verification link to <span className="text-zinc-200 font-medium">{email}</span>.
          Click the link to activate your account.
        </p>
        <p className="text-zinc-500 text-xs">Didn't get the email?</p>
        <button
          className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
          onClick={resendEmail}
          disabled={status === "resent"}
        >
          {status === "resent" ? "Resent!" : "Resend"}
        </button>
      </div>
    </div>
  );
}
