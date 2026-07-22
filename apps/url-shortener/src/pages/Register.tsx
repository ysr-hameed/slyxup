import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../lib/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res: any = await auth.register({ email, password, name: name || undefined });
    if (res.success) setOk(true);
    else setError(res.error || "Registration failed");
    setLoading(false);
  };

  if (ok) return (
    <div className="text-center pt-20">
      <h1 className="text-2xl font-bold mb-2">Registered!</h1>
      <p className="text-zinc-400 mb-4">You can now sign in.</p>
      <Link to="/login" className="px-6 py-2 bg-zinc-100 text-zinc-900 rounded font-medium hover:bg-zinc-300">Sign In</Link>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto pt-20">
      <h1 className="text-2xl font-bold text-center mb-1">Create Account</h1>
      <p className="text-zinc-500 text-sm text-center mb-6">to start shortening URLs</p>
      {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">{error}</p>}
      <form onSubmit={handle} className="space-y-4">
        <input type="text" placeholder="Name (optional)" value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" />
        <input type="email" placeholder="Email" value={email} required
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" />
        <input type="password" placeholder="Password (min 8 chars)" value={password} required
          onChange={e => setPassword(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" />
        <button type="submit" disabled={loading}
          className="w-full py-2 bg-zinc-100 text-zinc-900 rounded font-medium hover:bg-zinc-300 disabled:opacity-50">
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
      <p className="text-zinc-500 text-sm text-center mt-4">
        Have an account? <Link to="/login" className="text-blue-400 hover:underline">Sign In</Link>
      </p>
    </div>
  );
}
