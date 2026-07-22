import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  isAuthenticated: boolean;
  fallback?: ReactNode;
}

export function AuthGuard({ children, isAuthenticated, fallback }: AuthGuardProps) {
  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
