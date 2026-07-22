import { Link } from "react-router-dom";
import { useAuth } from "../../core/lib/auth";
import { Button } from "./Button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="font-bold text-zinc-100 text-lg">
          {import.meta.env.VITE_APP_NAME || "Slyxup"}
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Dashboard
              </Link>
              <span className="text-zinc-600 text-sm">|</span>
              <span className="text-sm text-zinc-500">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Login
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
