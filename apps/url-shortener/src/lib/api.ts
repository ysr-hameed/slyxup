const AUTH = import.meta.env.VITE_AUTH_URL || "http://localhost:8000/api/auth";
const URLS = import.meta.env.VITE_URLS_URL || "http://localhost:8003/api";

async function r(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts);
  try { return await res.json(); } catch { return { success: false, error: "Network error" }; }
}

export const auth = {
  register: (body: { email: string; password: string; name?: string }) =>
    r(`${AUTH}/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string; platform?: string }) =>
    r(`${AUTH}/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, platform: "url-shortener" }),
    }),
  me: (jwt: string) => r(`${AUTH}/me`, { headers: { Authorization: `Bearer ${jwt}` } }),
  logout: (token: string) =>
    r(`${AUTH}/logout`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
};

export const urls = {
  list: (jwt: string) => r(`${URLS}/urls`, { headers: { Authorization: `Bearer ${jwt}` } }),
  create: (jwt: string, target: string, title?: string) =>
    r(`${URLS}/urls`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ target, title }),
    }),
  remove: (jwt: string, id: string) =>
    r(`${URLS}/urls/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${jwt}` } }),
};
