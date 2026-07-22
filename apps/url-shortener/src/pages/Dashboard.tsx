import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { urls } from "../lib/api";

interface Link {
  id: string; code: string; target: string; title: string | null;
  clicks: number; created_at: string;
}

const BASE = import.meta.env.VITE_SHORT_BASE || "http://localhost:8003/r";

export default function Dashboard() {
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState("");
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => { if (!jwt) navigate("/login"); }, []);

  const fetchLinks = async () => {
    if (!jwt) return;
    setLoading(true);
    const res: any = await urls.list(jwt);
    if (res.success) setLinks(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt) return;
    setCreating(true); setError("");
    const res: any = await urls.create(jwt, target, title || undefined);
    if (res.success) {
      setLinks(prev => [{ ...res.data, clicks: 0, created_at: new Date().toISOString() }, ...prev]);
      setTarget(""); setTitle("");
    } else setError(res.error || "Failed");
    setCreating(false);
  };

  const deleteLink = async (id: string) => {
    if (!jwt || !confirm("Delete this link?")) return;
    await urls.remove(jwt, id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`${BASE}/${code}`);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 text-sm">Welcome, {user.email}</p>
      </div>

      <form onSubmit={createLink} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold text-sm">Create Short Link</h2>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <input type="url" placeholder="https://example.com/very/long/url" value={target} required
          onChange={e => setTarget(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 text-sm outline-none focus:border-zinc-500" />
        <div className="flex gap-2">
          <input type="text" placeholder="Title (optional)" value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 text-sm outline-none focus:border-zinc-500" />
          <button type="submit" disabled={creating}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded text-sm font-medium hover:bg-zinc-300 disabled:opacity-50">
            {creating ? "..." : "Shorten"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-zinc-400 uppercase tracking-wide">Your Links</h2>
          <span className="text-xs text-zinc-500">{links.length} links</span>
        </div>

        {loading && <p className="text-zinc-500 text-sm text-center py-8">Loading...</p>}

        {!loading && links.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-8">No links yet. Create your first one above.</p>
        )}

        {links.map(link => (
          <div key={link.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <a href={`${BASE}/${link.code}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-sm font-mono truncate">
                  {BASE}/{link.code}
                </a>
                {link.title && <span className="text-zinc-400 text-xs truncate">{link.title}</span>}
              </div>
              <p className="text-zinc-600 text-xs truncate mt-0.5">{link.target}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-500">{link.clicks} clicks</span>
              <button onClick={() => copyLink(link.code)}
                className="px-2 py-1 bg-zinc-800 rounded text-xs hover:bg-zinc-700">
                {copied === link.code ? "Copied!" : "Copy"}
              </button>
              <button onClick={() => deleteLink(link.id)}
                className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs hover:bg-red-800/40">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
