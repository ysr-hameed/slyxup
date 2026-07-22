export async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  htmlContent: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: from.replace(/.*<(.+)>/, "$1"), name: from.replace(/<.+>/, "").trim() },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return { success: false, error: `Brevo error ${resp.status}: ${text}` };
    }

    const data = await resp.json() as { messageId?: string };
    return { success: true, messageId: data.messageId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function welcomeEmail(name: string): string {
  return `
    <h1>Welcome to Slyxup, ${name}!</h1>
    <p>Your account has been created successfully.</p>
    <p>You can now login and start using our services.</p>
  `;
}
