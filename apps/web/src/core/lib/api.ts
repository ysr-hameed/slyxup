const platform = () => import.meta.env.VITE_PLATFORM || "web";
const AUTH_URL = import.meta.env.VITE_AUTH_URL || "/api/auth";
const PAYMENT_URL = import.meta.env.VITE_PAYMENT_URL || "/api/payment";
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || "/api/admin";

const adminKey = () => import.meta.env.VITE_ADMIN_API_KEY || "superadmin-secret-2026";

async function r(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  try { return await res.json(); } catch { return { success: false, error: "Invalid response" }; }
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string }) =>
      r(`${AUTH_URL}/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, platform: platform() }),
      }),
    login: (body: { email: string; password: string }) =>
      r(`${AUTH_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, platform: platform() }),
      }),
    verify: (jwt: string) => r(`${AUTH_URL}/verify`, { headers: { Authorization: `Bearer ${jwt}` } }),
    me: (jwt: string) => r(`${AUTH_URL}/me`, { headers: { Authorization: `Bearer ${jwt}` } }),
    logout: (token: string) =>
      r(`${AUTH_URL}/logout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
  },
  payment: {
    subscription: (userId: string) =>
      r(`${PAYMENT_URL}/subscription?userId=${userId}&platform=${platform()}`),
    checkout: (body: { priceId: string; userId: string }) =>
      r(`${PAYMENT_URL}/checkout`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, platform: platform() }),
      }),
    portal: (body: { customerId: string }) =>
      r(`${PAYMENT_URL}/portal`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, platform: platform() }),
      }),
  },
  admin: {
    login: (body: { email: string; password: string }) =>
      r(`${ADMIN_URL}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }),
    register: (body: { email: string; password: string; secret: string; name?: string }) =>
      r(`${ADMIN_URL}/register`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }),
    getAdmins: (jwt: string) => r(`${ADMIN_URL}/users`, { headers: { Authorization: `Bearer ${jwt}` } }),
    deleteAdmin: (jwt: string, id: string) =>
      r(`${ADMIN_URL}/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${jwt}` } }),
    getAuditLogs: (jwt: string, limit?: number) =>
      r(`${ADMIN_URL}/audit${limit ? `?limit=${limit}` : ""}`, { headers: { Authorization: `Bearer ${jwt}` } }),
    runAuthTests: (jwt: string) =>
      r(`${ADMIN_URL}/test/auth`, { method: "POST", headers: { Authorization: `Bearer ${jwt}` } }),
    runPaymentTests: (jwt: string) =>
      r(`${ADMIN_URL}/test/payment`, { method: "POST", headers: { Authorization: `Bearer ${jwt}` } }),
    getTestResults: (jwt: string, endpoint?: string, limit?: number) =>
      r(`${ADMIN_URL}/test/results${endpoint ? `/${endpoint}` : ""}${limit ? `?limit=${limit}` : ""}`,
        { headers: { Authorization: `Bearer ${jwt}` } }),
  },
  users: {
    list: (p?: string) =>
      r(`${AUTH_URL}/admin/users${p ? `?platform=${p}` : ""}`, { headers: { "x-admin-key": adminKey() } }),
    toggleBlock: (id: string) =>
      r(`${AUTH_URL}/admin/users/${id}/block`, { method: "PATCH", headers: { "x-admin-key": adminKey() } }),
    delete: (id: string) =>
      r(`${AUTH_URL}/admin/users/${id}`, { method: "DELETE", headers: { "x-admin-key": adminKey() } }),
    restore: (id: string) =>
      r(`${AUTH_URL}/admin/users/${id}/restore`, { method: "PATCH", headers: { "x-admin-key": adminKey() } }),
  },
};
