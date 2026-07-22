import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const jwt = localStorage.getItem("jwt");

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <nav className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="font-bold text-lg">Shrt</Link>
            <div className="flex items-center gap-3">
              {jwt ? (
                <>
                  <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100">Dashboard</Link>
                  <button onClick={() => { localStorage.clear(); location.href = "/login"; }}
                    className="text-sm text-zinc-500 hover:text-zinc-300">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm text-zinc-400 hover:text-zinc-100">Login</Link>
                  <Link to="/register" className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded text-sm font-medium hover:bg-zinc-300">Register</Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Landing() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">Shorten URLs. Simplify Sharing.</h1>
      <p className="text-zinc-400 mb-8 max-w-md mx-auto">Create short, memorable links that redirect to your long URLs. Track clicks and manage all your links in one place.</p>
      <Link to="/register" className="inline-flex px-6 py-3 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-300">Get Started</Link>
    </div>
  );
}
