import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../../components/ui/Button";

function Input2(props: any) {
  return <input className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500" {...props} />;
}

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await register(email, password, name || undefined);
    if (res.success) setSuccess(true);
    else setError(res.error || "Registration failed");
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-100">Registered!</h1>
          <p className="text-zinc-400">You can now sign in.</p>
          <Link to="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold text-zinc-100 text-center mb-1">Create Account</h1>
        <p className="text-zinc-500 text-sm text-center mb-6">
          Platform: <span className="text-blue-400 font-mono">{import.meta.env.VITE_PLATFORM || "web"}</span>
        </p>

        {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input2 type="text" placeholder="Name (optional)" value={name}
            onChange={(e: any) => setName(e.target.value)} />
          <Input2 type="email" placeholder="Email" value={email} required
            onChange={(e: any) => setEmail(e.target.value)} />
          <Input2 type="password" placeholder="Password (min 8 chars)" value={password} required
            onChange={(e: any) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <p className="text-zinc-500 text-sm text-center mt-4">
          Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
