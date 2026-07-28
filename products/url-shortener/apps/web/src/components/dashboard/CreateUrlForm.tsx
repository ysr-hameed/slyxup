import { useState } from "react";
import { Link, Type, Slash, Sparkles, Check, Copy } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import type { CreateUrlResult } from "../../lib/api";

interface CreateUrlFormProps {
  onCreate: (url: string, slug?: string, title?: string) => Promise<CreateUrlResult>;
  plan: "free" | "pro";
}

export function CreateUrlForm({ onCreate, plan }: CreateUrlFormProps) {
  const [newUrl, setNewUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<CreateUrlResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setError("");
    setResult(null);
    setCreating(true);
    try {
      const data = await onCreate(newUrl, showCustom ? slug : undefined, title || undefined);
      setResult(data);
      setNewUrl("");
      setSlug("");
      setTitle("");
      setShowCustom(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyUrl = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-800/20 flex items-center justify-center">
          <Link className="w-4.5 h-4.5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-zinc-100 font-semibold">Create Short Link</h2>
          <p className="text-zinc-500 text-xs">Paste a long URL to shorten it instantly</p>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          icon={<Link className="w-4 h-4" />}
          placeholder="https://example.com/very/long/url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !creating && handleCreate()}
          autoFocus
        />

        <Input
          icon={<Type className="w-4 h-4" />}
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="flex items-center gap-2.5 text-sm text-zinc-400 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={showCustom}
            onChange={(e) => setShowCustom(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0"
          />
          <Sparkles className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          Custom slug
          <Badge variant={plan === "pro" ? "pro" : "default"}>{plan === "pro" ? "Pro" : "Free"}</Badge>
        </label>

        {showCustom && (
          <Input
            icon={<Slash className="w-4 h-4" />}
            placeholder="my-custom-slug (4-12 chars, a-z0-9)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
            maxLength={12}
          />
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <Button onClick={handleCreate} disabled={creating || !newUrl} className="w-full">
          {creating ? "Shortening..." : "Shorten URL"}
        </Button>
      </div>

      {result && (
        <div className="p-4 rounded-xl bg-green-900/20 border border-green-700/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 mb-0.5">Your short link</p>
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="text-green-300 font-medium text-sm hover:underline truncate block"
              >
                {result.shortUrl}
              </a>
            </div>
            <Button variant="secondary" size="sm" onClick={copyUrl} className="shrink-0">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <Badge variant={result.plan === "pro" ? "pro" : "default"}>{result.plan === "pro" ? "Pro" : "Free"}</Badge>
            {result.expiresAt
              ? <span>Expires {new Date(result.expiresAt).toLocaleDateString()}</span>
              : <span>No expiry</span>}
          </div>
        </div>
      )}
    </Card>
  );
}
