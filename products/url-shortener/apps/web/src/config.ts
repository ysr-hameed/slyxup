const AUTH_BASE = import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online";
const BILLING_BASE = import.meta.env.DEV ? "http://localhost:8001" : "https://billing.slyxup.online";
const API_BASE = import.meta.env.DEV ? "http://localhost:9000" : "https://api-url.slyxup.online";

export { AUTH_BASE, BILLING_BASE, API_BASE };
