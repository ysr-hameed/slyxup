import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../core/lib/api";
import AdminUsers from "./AdminUsers";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const jwt = localStorage.getItem("admin_jwt");
  const admin = JSON.parse(localStorage.getItem("admin_user") || "{}");
  const [tab, setTab] = useState<"users" | "tests" | "audit">("users");
  const [testsRunning, setTestsRunning] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => { if (!jwt) navigate("/admin"); }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_jwt"); localStorage.removeItem("admin_user");
    navigate("/admin");
  };

  const runTests = async (type: "auth" | "payment") => {
    setTestsRunning(type); setTestResults(null);
    const res = type === "auth" ? await api.admin.runAuthTests(jwt!) : await api.admin.runPaymentTests(jwt!);
    setTestResults(res); setTestsRunning(null);
  };

  const loadAudit = async () => {
    const res: any = await api.admin.getAuditLogs(jwt!, 50);
    if (res.success) setAuditLogs(res.data);
  };

  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-zinc-500 text-sm">{admin.email} · {admin.role}</p>
          </div>
          <button onClick={handleLogout} className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700">Logout</button>
        </div>

        <div className="flex gap-1 mb-6 border-b border-zinc-800">
          {(["users", "tests", "audit"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                tab === t ? "text-zinc-100 border-b-2 border-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}>
              {t === "audit" ? "Audit Log" : t}
            </button>
          ))}
        </div>

        {tab === "users" && jwt && <AdminUsers />}

        {tab === "tests" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 rounded p-4 border border-zinc-800">
                <h3 className="font-semibold text-sm mb-1">Auth Tests</h3>
                <p className="text-zinc-500 text-xs mb-3">Register, Login, Verify, Me</p>
                <button onClick={() => runTests("auth")} disabled={!!testsRunning}
                  className="px-4 py-2 bg-blue-600 rounded text-xs hover:bg-blue-500 disabled:opacity-50">
                  {testsRunning === "auth" ? "Running..." : "Run Auth Tests"}
                </button>
              </div>
              <div className="bg-zinc-900 rounded p-4 border border-zinc-800">
                <h3 className="font-semibold text-sm mb-1">Payment Tests</h3>
                <p className="text-zinc-500 text-xs mb-3">Checkout, Subscription, Webhook</p>
                <button onClick={() => runTests("payment")} disabled={!!testsRunning}
                  className="px-4 py-2 bg-green-600 rounded text-xs hover:bg-green-500 disabled:opacity-50">
                  {testsRunning === "payment" ? "Running..." : "Run Payment Tests"}
                </button>
              </div>
            </div>

            {testResults && (
              <div className="bg-zinc-900 rounded p-4 border border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-sm">Results</span>
                  {testResults.data?.summary && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      testResults.data.summary.passed ? "bg-green-900/40 text-green-300" : "bg-red-900/40 text-red-300"
                    }`}>
                      {testResults.data.summary.passedCount}/{testResults.data.summary.total}
                    </span>
                  )}
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {testResults.data?.results?.map((r: any, i: number) => (
                    <div key={i} className={`p-2 rounded text-xs ${r.passed ? "bg-green-900/20 text-green-300" : "bg-red-900/20 text-red-300"}`}>
                      <span className="font-medium">{r.test_name}</span> · {r.response_status}
                      {r.error && <span className="block text-red-400 mt-0.5">{r.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div className="bg-zinc-900 rounded border border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Audit Log</h3>
              <button onClick={loadAudit} className="px-2 py-1 bg-zinc-700 rounded text-xs hover:bg-zinc-600">Refresh</button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {auditLogs.length === 0 && <p className="text-zinc-500 text-xs text-center py-8">No logs</p>}
              {auditLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-2 p-2 rounded text-xs text-zinc-400 hover:bg-zinc-800/20">
                  <span className="shrink-0 text-zinc-600 font-mono">{log.created_at?.slice(0, 19).replace("T", " ")}</span>
                  <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300">{log.action}</span>
                  <span>{log.resource}{log.resource_id ? `#${log.resource_id.slice(0, 8)}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
