import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../core/lib/api";

function Input2(props: any) {
  return <input className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" {...props} />;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res: any = await api.admin.login({ email, password });
    if (res.success) {
      localStorage.setItem("admin_jwt", res.data.jwt);
      localStorage.setItem("admin_user", JSON.stringify(res.data.admin));
      navigate("/admin/dashboard");
    } else setError(res.error || "Login failed");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold text-zinc-100 text-center mb-1">Admin Login</h1>
        <p className="text-zinc-500 text-sm text-center mb-6">Enter your admin credentials</p>

        {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input2 type="email" placeholder="Email" value={email} required
            onChange={(e: any) => setEmail(e.target.value)} />
          <Input2 type="password" placeholder="Password" value={password} required
            onChange={(e: any) => setPassword(e.target.value)} />
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-zinc-100 text-zinc-900 rounded font-medium hover:bg-zinc-300 disabled:opacity-50">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
