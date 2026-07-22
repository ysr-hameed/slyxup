import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { EmailEnv } from "@slyxup/shared";
import { sendEmailSchema, apiResponseSchema } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: EmailEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/send",
  summary: "Send an email via Brevo",
  tags: ["Email"],
  request: { body: { content: { "application/json": { schema: sendEmailSchema } } } },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ id: z.string() })) } }, description: "Email sent" },
    500: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Send failed" },
  },
});

route.openapi(routeDef, async (c) => {
  const { to, subject, html, text } = c.req.valid("json");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": c.env.BREVO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: "noreply@slyxup.online", name: "SlyxUp" },
      to: to.map((email: string) => ({ email })),
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error("email_send_failed", { status: res.status, error: err });
    return c.json({ success: false, error: "Failed to send email" }, 500);
  }

  const result = await res.json<{ messageId: string }>();
  logger.info("email_sent", { to, subject, id: result.messageId });
  return c.json({ success: true, data: { id: result.messageId } });
});

export default route;
