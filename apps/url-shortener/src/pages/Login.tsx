import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/api";

interface Props {
  onLogin: (jwt: string, user: any) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res: any = await auth.login({ email, password });
    if (res.success) {
      onLogin(res.data.jwt, res.data.user);
    } else setError(res.error || "Login failed");
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto pt-20">
      <h1 className="text-2xl font-bold text-center mb-1">Sign In</h1>
      <p className="text-zinc-500 text-sm text-center mb-6">to your Shrt account</p>
      {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">{error}</p>}
      <form onSubmit={handle} className="space-y-4">
        <input type="email" placeholder="Email" value={email} required
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" />
        <input type="password" placeholder="Password" value={password} required
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" />
        <button type="submit" disabled={loading}
          className="w-full py-2 bg-zinc-100 text-zinc-900 rounded font-medium hover:bg-zinc-300 disabled:opacity-50">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p className="text-zinc-500 text-sm text-center mt-4">
        No account? <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
      </p>
    </div>
  );
}
