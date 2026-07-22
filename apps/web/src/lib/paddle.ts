import { initializePaddle } from "@paddle/paddle-js";
import type { Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | undefined;

export async function initPaddle() {
  if (!paddleInstance) {
    paddleInstance = await initializePaddle({
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? "",
      environment: (import.meta.env.VITE_PADDLE_ENVIRONMENT as "sandbox" | "production") ?? "sandbox",
    });
  }
  return paddleInstance;
}

export function openCheckout(transactionId: string) {
  paddleInstance?.Checkout.open({ transactionId });
}
