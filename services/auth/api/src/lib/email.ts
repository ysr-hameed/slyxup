import type { Env } from "../env";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(env: Env, params: SendEmailParams) {
  if (env.EMAIL) {
    try {
      const from = env.EMAIL_FROM ?? "noreply@slyxup.online";
      await env.EMAIL.send({
        to: params.to,
        from: { email: from, name: "SlyxUp" },
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      return;
    } catch (err) {
      console.error("Email sending failed:", err);
    }
  }

  console.log("[EMAIL]", { to: params.to, subject: params.subject });
}

export function sendVerificationEmail(env: Env, user: { email: string; name?: string }, url: string) {
  return sendEmail(env, {
    to: user.email,
    subject: "Verify your email address",
    html: `<p>Hi ${user.name ?? "there"},</p><p>Click <a href="${url}">here</a> to verify your email address.</p>`,
    text: `Hi ${user.name ?? "there"},\n\nClick here to verify your email address: ${url}`,
  });
}

export function sendResetPasswordEmail(env: Env, user: { email: string; name?: string }, url: string) {
  return sendEmail(env, {
    to: user.email,
    subject: "Reset your password",
    html: `<p>Hi ${user.name ?? "there"},</p><p>Click <a href="${url}">here</a> to reset your password.</p>`,
    text: `Hi ${user.name ?? "there"},\n\nClick here to reset your password: ${url}`,
  });
}
