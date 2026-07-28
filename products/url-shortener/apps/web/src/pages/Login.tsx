import { useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordStrength } from "../components/auth/PasswordStrength";
import { SocialButtons } from "../components/auth/SocialButtons";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, name);
        window.history.pushState({}, "", "/verify-email");
        window.dispatchEvent(new Event("popstate"));
        return;
      }
      await signIn(email, password);
      window.history.pushState({}, "", "/dashboard");
      window.dispatchEvent(new Event("popstate"));
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={mode === "signin" ? "Welcome back" : "Create your account"}
      subtitle={mode === "signin" ? "Sign in to manage your links" : "Start shortening URLs in seconds"}
    >
      <div className="relative">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-900/30 border border-red-800/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <Input
              icon={<User className="w-4 h-4" />}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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

          <Input
            icon={<Lock className="w-4 h-4" />}
            type="password"
            placeholder={mode === "signin" ? "Password" : "Create a password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 8 : 1}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />

          {mode === "signup" && <PasswordStrength password={password} />}

          <Button type="submit" loading={loading} className="w-full">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-5 text-center space-y-2">
          <p className="text-zinc-500 text-sm">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
          {mode === "signin" && (
            <a
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "/forgot-password");
                window.dispatchEvent(new Event("popstate"));
              }}
              className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Forgot password?
            </a>
          )}
        </div>

        <div className="mt-6">
          <SocialButtons />
        </div>
      </div>
    </AuthLayout>
  );
}
