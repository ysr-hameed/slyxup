import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

function Badge2({ variant, children }: any) {
  const v: any = { default: "bg-zinc-700 text-zinc-300", info: "bg-blue-900/40 text-blue-300" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${v[variant] || v.default}`}>{children}</span>;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const platform = import.meta.env.VITE_PLATFORM || "web";

  if (loading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <p className="text-zinc-400">Loading...</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-zinc-100">Welcome to {platform}</h1>
        <p className="text-zinc-400">Please sign in to continue.</p>
        <Link to="/login" className="inline-flex items-center px-6 py-2 bg-zinc-100 text-zinc-900 rounded font-medium hover:bg-zinc-300">
          Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-500 text-sm">Welcome back, {user.name || user.email}</p>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 space-y-4">
        <h2 className="font-semibold text-zinc-100">Profile</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500 block">Name</span>
            <span className="text-zinc-200">{user.name || "—"}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Email</span>
            <span className="text-zinc-200">{user.email}</span>
          </div>
          <div>
            <span className="text-zinc-500 block">Platform</span>
            <Badge2 variant="info">{user.platform}</Badge2>
          </div>
          <div>
            <span className="text-zinc-500 block">User ID</span>
            <span className="text-zinc-400 text-xs font-mono">{user.id.slice(0, 16)}…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
