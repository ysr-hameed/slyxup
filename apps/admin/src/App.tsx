import { useState } from "react";
import { Navbar, Card, Button, Input } from "@slyxup/ui";
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({
  authBaseUrl: import.meta.env.VITE_AUTH_URL || "http://localhost:8000",
  billingBaseUrl: import.meta.env.VITE_BILLING_URL || "http://localhost:8001",
  adminBaseUrl: import.meta.env.VITE_ADMIN_URL || "http://localhost:8005",
  apiKey: import.meta.env.VITE_API_KEY,
});

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.auth.login({ email, password });
      setToken(res.jwt);
      setUser(res.user);
    } catch (err) {
      alert("Login failed");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card title="Admin Login" className="w-full max-w-sm">
          <div className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button onClick={handleLogin} className="w-full">Login</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar brand="Slyxup Admin" items={[{ label: "Dashboard", href: "/" }]} user={user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card title="Welcome to Slyxup Admin">
          <p className="text-gray-600">You are logged in as {user?.email}</p>
        </Card>
      </main>
    </div>
  );
}
