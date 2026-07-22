import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const jwt = localStorage.getItem("admin_jwt");
  const admin = JSON.parse(localStorage.getItem("admin_user") || "{}");
  const [testsRunning, setTestsRunning] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    if (!jwt) navigate("/admin");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_jwt");
    localStorage.removeItem("admin_user");
    navigate("/admin");
  };

  const runAuthTests = async () => {
    setTestsRunning("auth");
    setTestResults(null);
    const res = await api.admin.runAuthTests(jwt!) as any;
    setTestResults(res);
    setTestsRunning(null);
  };

  const runPaymentTests = async () => {
    setTestsRunning("payment");
    setTestResults(null);
    const res = await api.admin.runPaymentTests(jwt!) as any;
    setTestResults(res);
    setTestsRunning(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-zinc-400 text-sm">{admin.email} ({admin.role})</p>
          </div>
          <button onClick={handleLogout} className="px-3 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-700">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 rounded p-4 border border-zinc-800">
            <h2 className="font-semibold mb-1">Auth Tests</h2>
            <p className="text-zinc-400 text-sm mb-3">Register, Login, Verify, Me, Logout</p>
            <button onClick={runAuthTests} disabled={!!testsRunning}
              className="px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {testsRunning === "auth" ? "Running..." : "Run Auth Tests"}
            </button>
          </div>
          <div className="bg-zinc-900 rounded p-4 border border-zinc-800">
            <h2 className="font-semibold mb-1">Payment Tests</h2>
            <p className="text-zinc-400 text-sm mb-3">Checkout, Subscription, Portal, Webhook</p>
            <button onClick={runPaymentTests} disabled={!!testsRunning}
              className="px-4 py-2 bg-green-600 rounded text-sm hover:bg-green-500 disabled:opacity-50"
            >
              {testsRunning === "payment" ? "Running..." : "Run Payment Tests"}
            </button>
          </div>
        </div>

        {testResults && (
          <div className="bg-zinc-900 rounded p-4 border border-zinc-800">
            <h2 className="font-semibold mb-3">Results</h2>
            {testResults.data?.summary && (
              <p className="text-sm mb-3">
                {testResults.data.summary.passedCount}/{testResults.data.summary.total} passed
                {testResults.data.summary.passed ? " ✅" : " ❌"}
              </p>
            )}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.data?.results?.map((r: any, i: number) => (
                <div key={i} className={`p-2 rounded text-xs ${r.passed ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
                  <span className="font-medium">{r.test_name}</span>
                  {" - "}status {r.response_status}
                  {r.error && <span className="block text-red-400 mt-1">{r.error}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
