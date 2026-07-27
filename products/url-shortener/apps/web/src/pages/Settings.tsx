import { useState, useEffect } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { Layout } from "../components/Layout";
import { AUTH_BASE } from "../config";

interface SessionInfo {
  id: string; ip: string | null; userAgent: string | null;
  lastSeen: string | null; createdAt: string; expiresAt: string;
}

type Toast = { type: "success" | "error"; message: string };

export function Settings({ jwt, user, onLogout }: { jwt: string; user: { id?: string; name?: string | null; email: string } | null; onLogout: () => void }) {
  const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.auth.listSessions(jwt).then(setSessions).catch(() => {}).finally(() => setSessionsLoading(false));
  }, [jwt]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updated = await api.auth.updateProfile(jwt, { name });
      showToast({ type: "success", message: "Profile updated" });
      if (updated.name) setName(updated.name);
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast({ type: "error", message: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      showToast({ type: "error", message: "Password must be at least 8 characters" });
      return;
    }
    setPasswordLoading(true);
    try {
      await api.auth.changePassword(jwt, currentPassword, newPassword);
      showToast({ type: "success", message: "Password changed" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure? This action cannot be undone. All your links will be permanently deleted.")) return;
    try {
      await api.auth.deleteAccount(jwt);
      onLogout();
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await api.auth.revokeSession(jwt, sessionId);
      setSessions(s => s.filter(s => s.id !== sessionId));
      showToast({ type: "success", message: "Session revoked" });
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setRevokingId(null);
    }
  };

  const formatAgent = (ua: string | null) => {
    if (!ua) return "Unknown device";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    return ua.slice(0, 40);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {toast && (
          <div className={`p-3 rounded-lg text-sm ${
            toast.type === "success"
              ? "bg-green-900/50 border border-green-700 text-green-300"
              : "bg-red-900/50 border border-red-700 text-red-300"
          }`}>
            {toast.message}
          </div>
        )}

        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <h2 className="text-zinc-100 font-semibold">Profile</h2>
          <form onSubmit={updateProfile} className="space-y-3">
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
              placeholder="Email" value={user?.email || ""} disabled />
            <button className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              type="submit" disabled={profileLoading}>
              {profileLoading ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <h2 className="text-zinc-100 font-semibold">Change Password</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              type="password" placeholder="New password (8+ chars, upper+lower+number)" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <input className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <button className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-zinc-100 font-semibold">Active Sessions</h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              onClick={() => { setSessionsLoading(true); api.auth.listSessions(jwt).then(setSessions).finally(() => setSessionsLoading(false)); }}>
              Refresh
            </button>
          </div>
          {sessionsLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="p-3 bg-zinc-800 rounded-lg animate-pulse space-y-2">
                  <div className="h-4 bg-zinc-700 rounded w-24" />
                  <div className="h-3 bg-zinc-700 rounded w-48" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-zinc-500 text-sm">No active sessions</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-200 text-sm truncate">{formatAgent(s.userAgent)}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 font-medium">current</span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {s.ip || "Unknown IP"} · Created {new Date(s.createdAt).toLocaleDateString()}
                      {s.lastSeen && ` · Last seen ${new Date(s.lastSeen).toLocaleDateString()}`}
                    </p>
                    <p className="text-zinc-600 text-xs">Expires {new Date(s.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <button className="text-red-400 hover:text-red-300 text-sm ml-4 transition-colors disabled:opacity-30 shrink-0"
                    onClick={() => revokeSession(s.id)}
                    disabled={revokingId === s.id}>
                    {revokingId === s.id ? (
                      <span className="animate-spin inline-block h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
                    ) : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-900 rounded-xl border border-red-900/50">
          <h2 className="text-red-400 font-semibold">Danger Zone</h2>
          <p className="text-zinc-500 text-sm mt-1">Permanently delete your account and all data, including all short links. This cannot be undone.</p>
          <ul className="text-zinc-600 text-xs mt-2 space-y-0.5">
            <li>• All short URLs will stop working</li>
            <li>• Your subscription will be cancelled</li>
            <li>• Email and profile data will be removed</li>
          </ul>
          <button className="mt-3 px-4 py-2 rounded-lg bg-red-800 text-red-200 text-sm hover:bg-red-700 transition-colors"
            onClick={deleteAccount}>Delete Account</button>
        </div>
      </div>
    </Layout>
  );
}
