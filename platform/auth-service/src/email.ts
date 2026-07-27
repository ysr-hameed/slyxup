export function verificationEmailHtml(verifyLink: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:40px 32px 32px;text-align:center;background:linear-gradient(135deg,#0a0a0a,#1a1a2e)">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">SlyxUp</h1>
              <p style="margin:8px 0 0;color:#8888aa;font-size:14px">Verify your email address</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <p style="margin:0 0 20px;color:#333;font-size:15px;line-height:1.5">Thanks for signing up! Click the button below to verify your email address and get started.</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr>
                  <td align="center" style="background:#1a1a2e;border-radius:8px;padding:12px 32px">
                    <a href="${verifyLink}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:block">Verify Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#888;font-size:13px;line-height:1.4">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:4px 0 0;color:#666;font-size:12px;word-break:break-all">${verifyLink}</p>
              <p style="margin:24px 0 0;color:#aaa;font-size:12px;border-top:1px solid #eee;padding-top:16px">If you didn't create an account, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
