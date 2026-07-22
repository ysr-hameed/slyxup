import { Paddle as PaddleSDK, Environment } from "@paddle/paddle-node-sdk";
import type { PaymentEnv } from "@slyxup/shared-types";

export function createPaddleClient(
  apiKey: string,
  environment: string,
) {
  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is not configured");
  }
  return new PaddleSDK(apiKey, {
    environment: environment === "production" ? Environment.production : Environment.sandbox,
  });
}

export function getEnv(c: { env: PaymentEnv }) {
  return {
    client: createPaddleClient(c.env.PADDLE_API_KEY, c.env.PADDLE_ENVIRONMENT),
    secret: c.env.PADDLE_WEBHOOK_SECRET,
  };
}
