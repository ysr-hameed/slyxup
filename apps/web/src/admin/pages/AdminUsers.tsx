import { useEffect, useState, useCallback } from "react";
import { api } from "../../core/lib/api";

interface PlatformUser {
  id: string; email: string; name: string | null; platform: string;
  blocked: number; deleted_at: string | null; created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res: any = await api.users.list(showDeleted ? undefined : undefined);
      if (res.success) {
        const all: PlatformUser[] = res.data;
        setUsers(all);
        setPlatforms([...new Set(all.map(u => u.platform))].sort());
      } else setError(res.error || "Failed");
    } catch { setError("Network error"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const visible = selected === "all"
    ? users.filter(u => showDeleted || !u.deleted_at)
    : users.filter(u => u.platform === selected && (showDeleted || !u.deleted_at));

  const handleBlock = async (id: string) => {
    // optimistic update
    setUsers(prev => prev.map(u => u.id === id ? { ...u, blocked: u.blocked ? 0 : 1 } : u));
    await api.users.toggleBlock(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Soft delete this user?")) return;
    setUsers(prev => prev.map(u => u.id === id ? { ...u, deleted_at: new Date().toISOString() } : u));
    await api.users.delete(id);
  };

  const handleRestore = async (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, deleted_at: null } : u));
    await api.users.restore(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-zinc-100">Platform Users</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-xs text-zinc-400">
            <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} />
            Show deleted
          </label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200">
            <option value="all">All</option>
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={fetch} disabled={loading}
            className="px-3 py-1 bg-zinc-700 rounded text-xs hover:bg-zinc-600 disabled:opacity-50">
            {loading ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {!loading && visible.length === 0 && (
        <p className="text-zinc-500 text-sm py-8 text-center">No users</p>
      )}

      <div className="space-y-1 max-h-[30rem] overflow-y-auto">
        {visible.map(u => (
          <div key={u.id} className={`flex items-center justify-between p-2 rounded text-xs ${
            u.deleted_at ? "bg-zinc-800/20 opacity-50" :
            u.blocked ? "bg-red-900/15" : "bg-zinc-800/10"
          }`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-200">{u.email}</span>
                {!!u.blocked && <span className="px-1 py-0.5 bg-red-900/50 text-red-300 rounded text-[10px]">Blocked</span>}
                {u.deleted_at && <span className="px-1 py-0.5 bg-zinc-700 text-zinc-400 rounded text-[10px]">Deleted</span>}
              </div>
              <div className="text-zinc-500 mt-0.5">{u.name || "—"} · {u.platform}</div>
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-300 rounded text-[10px]">{u.platform}</span>
              {u.deleted_at ? (
                <button onClick={() => handleRestore(u.id)}
                  className="px-2 py-1 bg-green-800/50 text-green-300 rounded hover:bg-green-700/50 text-[11px]">
                  Restore
                </button>
              ) : (
                <>
                  <button onClick={() => handleBlock(u.id)}
                    className={`px-2 py-1 rounded text-[11px] ${u.blocked ? "bg-green-800/50 text-green-300 hover:bg-green-700/50" : "bg-yellow-800/50 text-yellow-300 hover:bg-yellow-700/50"}`}>
                    {u.blocked ? "Unblock" : "Block"}
                  </button>
                  <button onClick={() => handleDelete(u.id)}
                    className="px-2 py-1 bg-red-900/50 text-red-300 rounded hover:bg-red-800/50 text-[11px]">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
