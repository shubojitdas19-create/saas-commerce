/**
 * SaaS Commerce - High-End Email Delivery Engine
 * Powered by Resend API with inline-styled responsive HTML templates.
 */

interface SendOtpEmailOptions {
  toEmail: string;
  merchantName: string;
  storeName: string;
  otp: string;
}

export async function sendPasswordResetOtpEmail({
  toEmail,
  merchantName,
  storeName,
  otp,
}: SendOtpEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vanij AI <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY in environment variables.");
    return { success: false, error: "Email service is not configured on the server." };
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code - Vanij AI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="520" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e4e4e7;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Obsidian Header -->
          <tr>
            <td style="background-color: #09090b; padding: 32px 36px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; vertical-align: middle;">
                      <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0;">Vanij</span>
                      <span style="font-size: 11px; font-weight: 700; color: #34d399; background-color: rgba(16, 185, 129, 0.2); border: 1px solid rgba(52, 211, 153, 0.3); padding: 2px 7px; border-radius: 6px; margin-left: 6px; text-transform: uppercase; letter-spacing: 0.5px;">AI Security</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 10px;">
                    <p style="color: #a1a1aa; font-size: 13px; margin: 0; font-weight: 500;">
                      Administrative Access Control for <strong style="color: #ffffff;">${storeName}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px; background-color: #ffffff;">
              <h2 style="font-size: 22px; font-weight: 700; color: #09090b; margin: 0 0 14px 0; letter-spacing: -0.3px;">
                Password Reset Verification
              </h2>
              
              <p style="font-size: 14px; line-height: 22px; color: #52525b; margin: 0 0 24px 0;">
                Hello <strong>${merchantName}</strong>,<br>
                We received a request to reset your password for the <strong>${storeName}</strong> merchant portal. Please enter the one-time verification code below to authorize this request:
              </p>

              <!-- Luxury OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f8fafc; border: 1.5px dashed #10b981; border-radius: 14px; padding: 20px 24px; text-align: center; display: inline-block; width: 100%; box-sizing: border-box;">
                      <div style="font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                        ONE-TIME VERIFICATION CODE
                      </div>
                      <div style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 38px; font-weight: 800; color: #09090b; letter-spacing: 10px; margin: 4px 0;">
                        ${otp}
                      </div>
                      <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-top: 8px;">
                        ⏱️ Valid for <strong>10 minutes</strong> only
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 20px; color: #71717a; margin: 24px 0 0 0;">
                🔒 If you did not initiate this request, your account remains completely safe. Simply ignore this email or change your password if you suspect unauthorized activity.
              </p>
            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding: 0 36px;">
              <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px 32px 36px; background-color: #ffffff; text-align: center;">
              <p style="font-size: 12px; color: #a1a1aa; margin: 0 0 6px 0;">
                This is an automated security email from <strong>Vanij AI</strong>.
              </p>
              <p style="font-size: 11px; color: #d4d4d8; margin: 0;">
                SJ Digital Studio • Core SaaS Commerce Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    // Development helper: log OTP to server terminal so testing is never blocked
    console.log(`\n==================================================`);
    console.log(`🔑 [PASSWORD RESET OTP] For: ${toEmail} (${storeName})`);
    console.log(`👉 OTP CODE: ${otp}`);
    console.log(`==================================================\n`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: `Your Password Reset OTP: ${otp} - ${storeName}`,
        html: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API Error:", data);

      if (data.message && data.message.includes("You can only send testing emails to your own email address")) {
        return {
          success: false,
          error: "Resend Sandbox Mode: Can only send to your verified account email (shubojitdas19@gmail.com). To send to real clients, please verify your domain at resend.com/domains.",
        };
      }

      return { success: false, error: data.message || "Failed to deliver OTP email." };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("sendPasswordResetOtpEmail exception:", error);
    return { success: false, error: error.message || "Network error sending email." };
  }
}
