import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ apiKey: import.meta.env.VITE_API_KEY });

function App() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-50">
      <h1 className="text-4xl font-bold">Slyxup Product</h1>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
