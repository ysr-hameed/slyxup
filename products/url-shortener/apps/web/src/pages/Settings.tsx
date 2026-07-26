import { useState, useEffect } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { Layout } from "../components/Layout";
import { AUTH_BASE } from "../config";

interface SessionInfo {
  id: string; ip: string | null; userAgent: string | null;
  lastSeen: string | null; createdAt: string; expiresAt: string;
}

export function Settings({ jwt, user, onLogout }: { jwt: string; user: { id?: string; name?: string | null; email: string } | null; onLogout: () => void }) {
  const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.auth.listSessions(jwt).then(setSessions).catch(() => {});
  }, [jwt]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    try {
      const updated = await api.auth.updateProfile(jwt, { name });
      setMessage("Profile updated");
      if (updated.name) setName(updated.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await api.auth.changePassword(jwt, currentPassword, newPassword);
      setMessage("Password changed");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setError(""); setMessage("");
    try {
      await api.auth.deleteAccount(jwt);
      onLogout();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await api.auth.revokeSession(jwt, sessionId);
      setSessions(s => s.filter(s => s.id !== sessionId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isCurrentSession = (s: SessionInfo) => {
    return s.userAgent === navigator.userAgent && !sessions.find(o => o.id !== s.id && o.userAgent === s.userAgent);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {message && <div className="p-3 rounded bg-green-900/50 border border-green-700 text-green-300 text-sm">{message}</div>}
        {error && <div className="p-3 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm">{error}</div>}

        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <h2 className="text-zinc-100 font-semibold">Profile</h2>
          <form onSubmit={updateProfile} className="space-y-3">
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="Email" value={user?.email || ""} disabled />
            <button className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
          </form>
        </div>

        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <h2 className="text-zinc-100 font-semibold">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              type="password" placeholder="New password (8+ chars, upper+lower+number)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <button className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              type="submit" disabled={loading}>{loading ? "Changing..." : "Change Password"}</button>
          </form>
        </div>

        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-zinc-100 font-semibold">Sessions</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300"
              onClick={() => api.auth.listSessions(jwt).then(setSessions)}>Refresh</button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-zinc-500 text-sm">No active sessions</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-200 text-sm truncate">{s.userAgent || "Unknown device"}</p>
                    <p className="text-zinc-500 text-xs">
                      {s.ip || "Unknown IP"} · Last seen {s.lastSeen ? new Date(s.lastSeen).toLocaleDateString() : "never"}
                    </p>
                    <p className="text-zinc-500 text-xs">Expires {new Date(s.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <button className="text-red-400 hover:text-red-300 text-sm ml-4 transition-colors"
                    onClick={() => revokeSession(s.id)}>Revoke</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-900 rounded-xl border border-red-900/50">
          <h2 className="text-red-400 font-semibold">Danger Zone</h2>
          <p className="text-zinc-500 text-sm mt-1">Permanently delete your account and all data.</p>
          <button className="mt-3 px-4 py-2 rounded-lg bg-red-800 text-red-200 text-sm hover:bg-red-700 transition-colors"
            onClick={deleteAccount}>Delete Account</button>
        </div>
      </div>
    </Layout>
  );
}
