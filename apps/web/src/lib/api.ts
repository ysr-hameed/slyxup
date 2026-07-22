const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? "/api/auth";
const PAYMENT_URL = import.meta.env.VITE_PAYMENT_URL ?? "/api/payment";
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? "/api/admin";

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string }) =>
      fetch(`${AUTH_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),

    login: (body: { email: string; password: string }) =>
      fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),

    verify: (jwt: string) =>
      fetch(`${AUTH_URL}/verify`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    me: (jwt: string) =>
      fetch(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    logout: (token: string) =>
      fetch(`${AUTH_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).then((r) => r.json()),
  },

  payment: {
    checkout: (body: { priceId: string; userId: string; returnUrl?: string }) =>
      fetch(`${PAYMENT_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),

    subscription: (userId: string) =>
      fetch(`${PAYMENT_URL}/subscription?userId=${userId}`).then((r) => r.json()),

    portal: (body: { customerId: string; returnUrl?: string }) =>
      fetch(`${PAYMENT_URL}/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
  },

  admin: {
    login: (body: { email: string; password: string }) =>
      fetch(`${ADMIN_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),

    register: (body: { email: string; password: string; name?: string; secret: string }) =>
      fetch(`${ADMIN_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json()),

    getAdmins: (jwt: string) =>
      fetch(`${ADMIN_URL}/users`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    getAdmin: (jwt: string, id: string) =>
      fetch(`${ADMIN_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    deleteAdmin: (jwt: string, id: string) =>
      fetch(`${ADMIN_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    getAuditLogs: (jwt: string, limit?: number) =>
      fetch(`${ADMIN_URL}/audit${limit ? `?limit=${limit}` : ""}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    runAuthTests: (jwt: string) =>
      fetch(`${ADMIN_URL}/test/auth`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    runPaymentTests: (jwt: string) =>
      fetch(`${ADMIN_URL}/test/payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),

    getTestResults: (jwt: string, endpoint?: string, limit?: number) =>
      fetch(`${ADMIN_URL}/test/results${endpoint ? `/${endpoint}` : ""}${limit ? `${endpoint ? "&" : "?"}limit=${limit}` : ""}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      }).then((r) => r.json()),
  },
};
