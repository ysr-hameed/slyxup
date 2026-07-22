import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await api.admin.login({ email, password }) as any;
    if (res.success) {
      localStorage.setItem("admin_jwt", res.data.jwt);
      localStorage.setItem("admin_user", JSON.stringify(res.data.admin));
      navigate("/admin/dashboard");
    } else {
      setError(res.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100 text-center">Admin Login</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
        />
        <button type="submit" disabled={loading}
          className="w-full py-2 bg-zinc-100 text-zinc-900 rounded font-medium hover:bg-zinc-300 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
