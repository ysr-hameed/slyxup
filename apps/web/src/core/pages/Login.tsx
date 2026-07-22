import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../../components/ui/Button";

function Input2(props: any) {
  return <input className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" {...props} />;
}

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = params.get("redirect") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await login(email, password);
    if (res.success) {
      if (redirect) {
        window.location.href = `${redirect}?jwt=${encodeURIComponent(localStorage.getItem("jwt")!)}`;
      } else {
        navigate("/dashboard");
      }
    } else setError(res.error || "Login failed");
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold text-zinc-100 text-center mb-6">Sign In</h1>

        {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input2 type="email" placeholder="Email" value={email} required
            onChange={(e: any) => setEmail(e.target.value)} />
          <Input2 type="password" placeholder="Password" value={password} required
            onChange={(e: any) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-zinc-500 text-sm text-center mt-4">
          No account?{" "}
          <Link to={redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
            className="text-blue-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
