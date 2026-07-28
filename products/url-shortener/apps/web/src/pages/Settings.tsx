import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User as UserIcon, Lock, Smartphone, Trash2, RefreshCw } from "lucide-react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AppLayout } from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../hooks/useToast";
import { AUTH_BASE } from "../config";
import type { User } from "../App";

interface SessionInfo {
  id: string; ip: string | null; userAgent: string | null;
  lastSeen: string | null; createdAt: string; expiresAt: string;
}

interface SettingsProps {
  jwt: string;
  user: User | null;
  onLogout: () => void;
}

function formatAgent(ua: string | null) {
  if (!ua) return "Unknown device";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  return ua.slice(0, 40);
}

export function Settings({ jwt, user, onLogout }: SettingsProps) {
  const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });
  const { toast, showToast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
      showToast({ type: "error", message: "Passwords do not match" }); return;
    }
    if (newPassword.length < 8) {
      showToast({ type: "error", message: "Password must be at least 8 characters" }); return;
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
      setSessions((s) => s.filter((s) => s.id !== sessionId));
      showToast({ type: "success", message: "Session revoked" });
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <AppLayout user={user} onLogout={onLogout} toast={toast}>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-800/20 flex items-center justify-center">
            <SettingsIcon className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-zinc-100 font-semibold text-lg">Settings</h1>
            <p className="text-zinc-500 text-xs">Manage your profile, password, and sessions</p>
          </div>
        </div>

        {/* Profile */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <UserIcon className="w-4 h-4 text-blue-400" />
            <h2 className="text-zinc-100 font-semibold">Profile</h2>
          </div>
          <form onSubmit={updateProfile} className="space-y-3">
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Email"
              value={user?.email || ""}
              disabled
              className="text-zinc-500"
            />
            <Button type="submit" loading={profileLoading}>
              Save Changes
            </Button>
          </form>
        </Card>

        {user?.hasPassword && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-blue-400" />
              <h2 className="text-zinc-100 font-semibold">Change Password</h2>
            </div>
            <form onSubmit={changePassword} className="space-y-3">
              <Input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="New password (8+ chars, upper+lower+number)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={passwordLoading}>
                Change Password
              </Button>
            </form>
          </Card>
        )}

        {/* Sessions */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <h2 className="text-zinc-100 font-semibold">Active Sessions</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSessionsLoading(true);
                api.auth.listSessions(jwt).then(setSessions).finally(() => setSessionsLoading(false));
              }}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          {sessionsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-zinc-500 text-sm">No active sessions</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-200 text-sm truncate">{formatAgent(s.userAgent)}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/30 font-medium">
                        current
                      </span>
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {s.ip || "Unknown IP"} · Created {new Date(s.createdAt).toLocaleDateString()}
                      {s.lastSeen && ` · Last seen ${new Date(s.lastSeen).toLocaleDateString()}`}
                    </p>
                    <p className="text-zinc-600 text-xs">Expires {new Date(s.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeSession(s.id)}
                    loading={revokingId === s.id}
                    className="text-red-400 hover:text-red-300 shrink-0 ml-4"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Danger Zone */}
        <Card className="p-5 border-red-900/30 space-y-4">
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-red-400" />
            <h2 className="text-red-400 font-semibold">Danger Zone</h2>
          </div>
          <p className="text-zinc-500 text-sm">
            Permanently delete your account and all data, including all short links. This cannot be undone.
          </p>
          <ul className="text-zinc-600 text-xs space-y-1">
            <li>• All short URLs will stop working</li>
            <li>• Your subscription will be cancelled</li>
            <li>• Email and profile data will be removed</li>
          </ul>
          <Button variant="danger" onClick={deleteAccount}>
            Delete Account
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
