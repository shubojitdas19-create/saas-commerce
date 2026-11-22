/**
 * Vanij - Enterprise Email Notification Engine
 * Built by Ninthwave (ninthwave.in)
 * Powered by Resend API with modern responsive HTML templates.
 */

import { db } from "@/lib/db";
import { users } from "@repo/db";
import { eq } from "drizzle-orm";

const RESEND_API_URL = "https://api.resend.com/emails";

// Official UploadThing High-Speed CDN Assets (100% Uptime Worldwide)
const BRAND_LOGO_URL = "https://juip68hrv7.ufs.sh/f/rbcDy8QRznHh46hx7fhYswa5mfAb9QT03WNCOzydkeucEtH6";
const BRAND_ICON_URL = "https://juip68hrv7.ufs.sh/f/rbcDy8QRznHhem5fUSF6Z0dYSM3sKUi1NLaCEcpA4r2hGDvT";
const BASE_DASHBOARD_URL = "https://saas-commerce-mu.vercel.app";

// Default Verified Senders from Ninthwave Domain
const DEFAULT_SECURITY_SENDER = "Vanij Security <security@ninthwave.in>";
const DEFAULT_NOTIFICATION_SENDER = "Vanij Notifications <notifications@ninthwave.in>";

export interface BaseEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Fetch all registered administrator email addresses for a given store
 */
export async function getStoreAdminEmails(storeId: string): Promise<string[]> {
  try {
    const adminUsers = await db.query.users.findMany({
      where: eq(users.storeId, storeId),
    });

    const emails = adminUsers
      .map((u) => u.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e) && e.includes("@"));

    return [...new Set(emails)];
  } catch (error) {
    console.error(`Error resolving admin emails for storeId ${storeId}:`, error);
    return [];
  }
}

/**
 * Core Resend Dispatcher
 */
async function dispatchEmail({
  from,
  to,
  subject,
  html,
  replyTo,
  cc,
  bcc,
  attachments,
}: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{ filename: string; path?: string; content?: string }>;
}): Promise<BaseEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY in environment variables.");
    return { success: false, error: "Email service is not configured on the server." };
  }

  try {
    const payload: any = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    if (cc) {
      const ccList = Array.isArray(cc)
        ? cc.map((e) => e.trim()).filter((e) => Boolean(e) && e.includes("@"))
        : cc
            .split(",")
            .map((e) => e.trim())
            .filter((e) => Boolean(e) && e.includes("@"));
      if (ccList.length > 0) {
        payload.cc = ccList;
      }
    }

    if (bcc) {
      const bccList = Array.isArray(bcc)
        ? bcc.map((e) => e.trim()).filter((e) => Boolean(e) && e.includes("@"))
        : bcc
            .split(",")
            .map((e) => e.trim())
            .filter((e) => Boolean(e) && e.includes("@"));
      if (bccList.length > 0) {
        payload.bcc = bccList;
      }
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API Error:", data);

      if (data.message && data.message.includes("You can only send testing emails to your own email address")) {
        return {
          success: false,
          error: "Resend Sandbox Mode: Can only send to your verified account email. Verify your domain at resend.com/domains.",
        };
      }

      return { success: false, error: data.message || "Failed to deliver email." };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("dispatchEmail Exception:", error);
    return { success: false, error: error.message || "Network error sending email." };
  }
}

/**
 * Universal Mobile-Responsive CSS Header & Google Fonts
 */
function getEmailHeadStyles(title: string): string {
  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!-- Google Fonts: Plus Jakarta Sans & Inter for high-end typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        border: none !important;
      }
      .email-wrapper {
        padding: 0 !important;
      }
      .email-header-pad {
        padding: 24px 20px !important;
      }
      .email-body-pad {
        padding: 24px 20px !important;
      }
      .email-footer-pad {
        padding: 24px 20px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .mobile-stack-right {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        margin-top: 14px !important;
        box-sizing: border-box !important;
      }
      .mobile-full-btn {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      .mobile-title {
        font-size: 20px !important;
      }
      .mobile-otp {
        font-size: 32px !important;
        letter-spacing: 8px !important;
      }
    }
  </style>
  `;
}

/**
 * Modern Obsidian Brand Header
 */
function renderModernHeader(categoryLabel: string, badgeBg = "#10b981", badgeText = "#ffffff"): string {
  return `
  <tr>
    <td class="email-header-pad" style="background: linear-gradient(145deg, #09090b 0%, #18181b 100%); padding: 28px 32px; border-bottom: 1px solid #27272a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td valign="middle" class="mobile-stack">
            <a href="https://ninthwave.in" target="_blank" style="text-decoration: none; display: inline-block;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <img src="${BRAND_LOGO_URL}" alt="Vanij" height="32" style="height: 32px; width: auto; max-width: 130px; display: block; border: 0;" />
                  </td>
                </tr>
              </table>
            </a>
          </td>
          <td align="right" valign="middle" class="mobile-stack-right">
            <span style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 700; color: ${badgeText}; background-color: ${badgeBg}; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.8px; display: inline-block;">
              ${categoryLabel}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  `;
}

/**
 * Modern Clean Footer with Ninthwave Attribution
 */
function renderModernFooter(storeName?: string): string {
  return `
  <tr>
    <td class="email-footer-pad" style="padding: 26px 32px 30px 32px; background-color: #fafafa; border-top: 1px solid #e2e8f0; text-align: center;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${storeName ? `
        <tr>
          <td style="padding-bottom: 10px;">
            <p style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 13px; font-weight: 600; color: #334155; margin: 0;">
              Merchant Store: <span style="color: #0f172a; font-weight: 700;">${storeName}</span>
            </p>
          </td>
        </tr>
        ` : ""}
        <tr>
          <td style="padding-bottom: 8px;">
            <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; margin: 0; line-height: 18px;">
              Powered by <strong style="color: #0f172a;">Vanij</strong> • An e-commerce platform by <a href="https://ninthwave.in" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: 600;">Ninthwave</a>
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: #94a3b8; margin: 0;">
              © ${new Date().getFullYear()} Ninthwave Technologies. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  `;
}

// ============================================================================
// 1. PASSWORD RESET OTP EMAIL
// ============================================================================

export interface SendOtpEmailOptions {
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
}: SendOtpEmailOptions): Promise<BaseEmailResult> {
  const fromEmail = process.env.RESEND_FROM_SECURITY || DEFAULT_SECURITY_SENDER;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  ${getEmailHeadStyles("Security Verification Code - Vanij")}
</head>
<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-container" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          
          ${renderModernHeader("Security Alert", "#10b981", "#ffffff")}

          <!-- Body Content -->
          <tr>
            <td class="email-body-pad" style="padding: 36px 36px 28px 36px; background-color: #ffffff;">
              <h1 class="mobile-title" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.4px;">
                Password Reset Verification
              </h1>
              
              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 24px 0;">
                Hello <strong>${merchantName}</strong>,<br>
                We received a request to reset your administrator password for <strong>${storeName}</strong> on the Vanij platform. Use the verification code below to authorize this change:
              </p>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #10b981; border-radius: 16px; padding: 24px; text-align: center; display: inline-block; width: 100%; box-sizing: border-box;">
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                        ONE-TIME VERIFICATION CODE
                      </div>
                      <div class="mobile-otp" style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 42px; font-weight: 800; color: #0f172a; letter-spacing: 12px; margin: 6px 0;">
                        ${otp}
                      </div>
                      <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; font-weight: 600; margin-top: 8px;">
                        ⏱️ Valid for 10 minutes only
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; line-height: 20px; color: #64748b; margin: 20px 0 0 0;">
                🔒 If you did not make this request, please ignore this email. Your current password remains completely secure.
              </p>
            </td>
          </tr>

          ${renderModernFooter(storeName)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return dispatchEmail({
    from: fromEmail,
    to: toEmail,
    subject: `Your Security Verification Code: ${otp} - ${storeName}`,
    html,
  });
}

// ============================================================================
// 1B. PAYMENT GATEWAY / RAZORPAY SECURITY VERIFICATION OTP EMAIL
// ============================================================================

export interface SendPaymentGatewayOtpEmailOptions {
  toEmail: string;
  merchantName: string;
  storeName: string;
  otp: string;
  providerName?: string;
}

export async function sendPaymentGatewayOtpEmail({
  toEmail,
  merchantName,
  storeName,
  otp,
  providerName = "Razorpay",
}: SendPaymentGatewayOtpEmailOptions): Promise<BaseEmailResult> {
  const fromEmail = process.env.RESEND_FROM_SECURITY || DEFAULT_SECURITY_SENDER;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  ${getEmailHeadStyles(`Security Verification Code: ${otp} - Vanij`)}
</head>
<body style="background-color: #f1f5f9; margin: 0; padding: 0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-container" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          
          ${renderModernHeader("Security Verification", "#4f46e5", "#ffffff")}

          <!-- Body Content -->
          <tr>
            <td class="email-body-pad" style="padding: 36px 36px 28px 36px; background-color: #ffffff;">
              <h1 class="mobile-title" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.4px;">
                Payment Gateway Unlock Request
              </h1>
              
              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0;">
                Hello <strong>${merchantName}</strong>,<br>
                We received a request to unlock and modify the <strong>${providerName}</strong> payment gateway credentials for your store <strong>${storeName}</strong>.
              </p>

              <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; margin: 0; line-height: 18px;">
                  🛡️ <strong>Security Verification:</strong> Modifying payment keys directly impacts live customer transactions and checkout routing. Use the verification code below to authorize this unlock:
                </p>
              </div>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #6366f1; border-radius: 16px; padding: 24px; text-align: center; display: inline-block; width: 100%; box-sizing: border-box;">
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                        ONE-TIME UNLOCK CODE
                      </div>
                      <div class="mobile-otp" style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 40px; font-weight: 800; color: #0f172a; letter-spacing: 12px; margin: 6px 0;">
                        ${otp}
                      </div>
                      <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; font-weight: 600; margin-top: 8px;">
                        ⏱️ Valid for 10 minutes only
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12.5px; line-height: 19px; color: #64748b; margin: 20px 0 0 0;">
                🔒 If you did not initiate this change in your Vanij dashboard, please do not share this code and verify your store account immediately.
              </p>
            </td>
          </tr>

          ${renderModernFooter(storeName)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return dispatchEmail({
    from: fromEmail,
    to: toEmail,
    subject: `🔐 Security Verification Code: ${otp} - Unlock ${providerName} Settings (${storeName})`,
    html,
  });
}

// ============================================================================
// 2. NEW ORDER NOTIFICATION EMAIL
// ============================================================================

export interface OrderItemSummary {
  name?: string;
  quantity: number;
  price: string | number;
}

export interface SendNewOrderEmailOptions {
  toEmail: string | string[];
  storeName: string;
  storeSlug: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: string | number;
  paymentMethod: string;
  items?: OrderItemSummary[];
}

export async function sendNewOrderNotificationEmail({
  toEmail,
  storeName,
  storeSlug,
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  totalAmount,
  paymentMethod,
  items = [],
}: SendNewOrderEmailOptions): Promise<BaseEmailResult> {
  const fromEmail = process.env.RESEND_FROM_NOTIFICATIONS || DEFAULT_NOTIFICATION_SENDER;
  const dashboardOrderUrl = `${BASE_DASHBOARD_URL}/${storeSlug}/dashboard/orders`;

  const formattedAmount = Number(totalAmount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const isOnline = paymentMethod.toUpperCase() === "ONLINE";
  const paymentBadge = isOnline
    ? `<span style="background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">Paid Online (Razorpay)</span>`
    : `<span style="background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">Cash On Delivery (COD)</span>`;

  // Render items rows
  const itemsHtml = items.length > 0
    ? items.map(item => `
      <tr>
        <td style="padding: 12px 14px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-weight: 500;">
          ${item.name || "Item"}
        </td>
        <td align="center" style="padding: 12px 14px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">
          ${item.quantity}
        </td>
        <td align="right" style="padding: 12px 14px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; font-weight: 700;">
          ₹${(Number(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join("")
    : `
      <tr>
        <td colspan="3" style="padding: 14px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #94a3b8; text-align: center;">
          Order items recorded in dashboard
        </td>
      </tr>
    `;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  ${getEmailHeadStyles(`New Order #${orderNumber} - Vanij`)}
</head>
<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-container" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          
          ${renderModernHeader("New Order", "#059669", "#ffffff")}

          <!-- Hero Banner -->
          <tr>
            <td class="email-body-pad" style="padding: 32px 36px 20px 36px; background-color: #ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="mobile-stack">
                    <span style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px;">
                      Order Received
                    </span>
                    <h1 class="mobile-title" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0; letter-spacing: -0.5px;">
                      #${orderNumber}
                    </h1>
                  </td>
                  <td align="right" valign="top" class="mobile-stack-right">
                    <div>
                      <span style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Total Amount</span>
                      <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 28px; font-weight: 800; color: #059669; line-height: 1.1;">
                        ₹${formattedAmount}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Payment Ribbon -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 20px 36px;">
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 12px 18px; border: 1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #475569; font-weight: 500;">
                      Payment Method:
                    </td>
                    <td align="right">
                      ${paymentBadge}
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Customer Details Card -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 24px 36px;">
              <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; background-color: #ffffff;">
                <h3 style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0; text-transform: uppercase; letter-spacing: 0.8px;">
                  Customer Information
                </h3>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px; color: #64748b; width: 110px;">Name:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px; color: #64748b;">Phone:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px;">
                      <a href="tel:${customerPhone}" style="color: #059669; text-decoration: none; font-weight: 700;">📞 ${customerPhone}</a>
                    </td>
                  </tr>
                  ${customerEmail ? `
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px; color: #64748b;">Email:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px;">
                      <a href="mailto:${customerEmail}" style="color: #6366f1; text-decoration: none; font-weight: 500;">${customerEmail}</a>
                    </td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px; color: #64748b; vertical-align: top;">Shipping To:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 5px 0; font-size: 13px; color: #334155; line-height: 20px;">${shippingAddress}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 28px 36px;">
              <h3 style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.8px;">
                Ordered Items
              </h3>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th align="left" style="font-family: 'Inter', -apple-system, sans-serif; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
                    <th align="center" style="font-family: 'Inter', -apple-system, sans-serif; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th align="right" style="font-family: 'Inter', -apple-system, sans-serif; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Action CTA -->
          <tr>
            <td align="center" class="email-body-pad" style="padding: 0 36px 36px 36px;">
              <a href="${dashboardOrderUrl}" target="_blank" class="mobile-full-btn" style="background-color: #0f172a; color: #ffffff; padding: 14px 34px; border-radius: 12px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);">
                Manage Order in Dashboard →
              </a>
            </td>
          </tr>

          ${renderModernFooter(storeName)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return dispatchEmail({
    from: fromEmail,
    to: toEmail,
    subject: `🛍️ New Order #${orderNumber} received for ${storeName} (₹${formattedAmount})`,
    html,
  });
}

// ============================================================================
// 3. NEW LEAD NOTIFICATION EMAIL
// ============================================================================

export interface SendNewLeadEmailOptions {
  toEmail: string | string[];
  storeName: string;
  storeSlug: string;
  customerName: string;
  customerPhone: string;
  address: string;
  message?: string | null;
}

export async function sendNewLeadNotificationEmail({
  toEmail,
  storeName,
  storeSlug,
  customerName,
  customerPhone,
  address,
  message,
}: SendNewLeadEmailOptions): Promise<BaseEmailResult> {
  const fromEmail = process.env.RESEND_FROM_NOTIFICATIONS || DEFAULT_NOTIFICATION_SENDER;
  const dashboardLeadsUrl = `${BASE_DASHBOARD_URL}/${storeSlug}/dashboard/leads`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  ${getEmailHeadStyles(`New Lead Inquiry from ${customerName} - Vanij`)}
</head>
<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-container" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          
          ${renderModernHeader("New Lead Inquiry", "#6366f1", "#ffffff")}

          <!-- Header Intro -->
          <tr>
            <td class="email-body-pad" style="padding: 32px 36px 16px 36px; background-color: #ffffff;">
              <span style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 1.2px;">
                Customer Inquiry
              </span>
              <h1 class="mobile-title" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; margin: 4px 0 8px 0; letter-spacing: -0.4px;">
                New consultation request from ${customerName}
              </h1>
              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 22px; color: #475569; margin: 0;">
                A new prospective customer has reached out through your storefront contact form.
              </p>
            </td>
          </tr>

          <!-- Contact Details Box -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 20px 36px;">
              <div style="background-color: #f8fafc; border-radius: 14px; padding: 20px 22px; border: 1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 6px 0; font-size: 13px; color: #64748b; width: 90px;">Contact:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 700;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 6px 0; font-size: 13px; color: #64748b;">Phone:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 6px 0; font-size: 14px;">
                      <a href="tel:${customerPhone}" style="color: #059669; text-decoration: none; font-weight: 700; font-size: 15px;">📞 ${customerPhone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 6px 0; font-size: 13px; color: #64748b; vertical-align: top;">Address:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; padding: 6px 0; font-size: 13px; color: #334155; line-height: 20px;">${address}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Inquiry Message -->
          ${message ? `
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 24px 36px;">
              <h3 style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.8px;">
                Client Message
              </h3>
              <div style="background-color: #faf5ff; border: 1px solid #f3e8ff; border-left: 4px solid #a855f7; border-radius: 12px; padding: 16px 20px; font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; line-height: 22px; color: #4c1d95; font-style: italic;">
                "${message}"
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- CTA Button -->
          <tr>
            <td align="center" class="email-body-pad" style="padding: 0 36px 36px 36px;">
              <a href="${dashboardLeadsUrl}" target="_blank" class="mobile-full-btn" style="background-color: #0f172a; color: #ffffff; padding: 14px 34px; border-radius: 12px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);">
                Open Leads Manager →
              </a>
            </td>
          </tr>

          ${renderModernFooter(storeName)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return dispatchEmail({
    from: fromEmail,
    to: toEmail,
    subject: `💼 New Lead Inquiry from ${customerName} - ${storeName}`,
    html,
  });
}

// ============================================================================
// 4. NEW REVIEW NOTIFICATION EMAIL
// ============================================================================

export interface SendNewReviewEmailOptions {
  toEmail: string | string[];
  storeName: string;
  storeSlug: string;
  customerName: string;
  rating: number;
  text: string;
  customerEmail?: string;
  customerPhone?: string;
  location?: string | null;
}

export async function sendNewReviewNotificationEmail({
  toEmail,
  storeName,
  storeSlug,
  customerName,
  rating,
  text,
  customerEmail,
  customerPhone,
  location,
}: SendNewReviewEmailOptions): Promise<BaseEmailResult> {
  const fromEmail = process.env.RESEND_FROM_NOTIFICATIONS || DEFAULT_NOTIFICATION_SENDER;
  const dashboardReviewsUrl = `${BASE_DASHBOARD_URL}/${storeSlug}/dashboard/reviews`;

  const starCount = Math.max(1, Math.min(5, Math.round(rating)));
  const starString = "★".repeat(starCount) + "☆".repeat(5 - starCount);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  ${getEmailHeadStyles(`New ${starCount}-Star Review for ${storeName} - Vanij`)}
</head>
<body>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" class="email-container" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          
          ${renderModernHeader("New Customer Review", "#f59e0b", "#ffffff")}

          <!-- Review Summary Banner -->
          <tr>
            <td class="email-body-pad" style="padding: 32px 36px 16px 36px; background-color: #ffffff; text-align: center;">
              <div style="font-size: 30px; color: #f59e0b; letter-spacing: 5px; margin-bottom: 8px;">
                ${starString}
              </div>
              <h1 class="mobile-title" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.4px;">
                ${starCount} Out of 5 Stars
              </h1>
              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #64748b; margin: 0;">
                Submitted by <strong style="color: #0f172a;">${customerName}</strong>
              </p>
            </td>
          </tr>

          <!-- Feedback Quote -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 20px 36px;">
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 20px 22px;">
                <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 24px; color: #78350f; font-style: italic; margin: 0;">
                  "${text}"
                </p>
              </div>
            </td>
          </tr>

          <!-- Reviewer Details -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 24px 36px;">
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; width: 90px;">Reviewer:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #0f172a; font-weight: 700;">${customerName}</td>
                  </tr>
                  ${customerEmail ? `
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; padding-top: 5px;">Email:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #334155; padding-top: 5px;">${customerEmail}</td>
                  </tr>
                  ` : ""}
                  ${customerPhone && customerPhone !== "N/A" ? `
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; padding-top: 5px;">Phone:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #334155; padding-top: 5px;">${customerPhone}</td>
                  </tr>
                  ` : ""}
                  ${location && location !== "Website Review" ? `
                  <tr>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; padding-top: 5px;">Context:</td>
                    <td style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #334155; padding-top: 5px;">${location}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>
            </td>
          </tr>

          <!-- Action CTA -->
          <tr>
            <td align="center" class="email-body-pad" style="padding: 0 36px 36px 36px;">
              <a href="${dashboardReviewsUrl}" target="_blank" class="mobile-full-btn" style="background-color: #0f172a; color: #ffffff; padding: 14px 34px; border-radius: 12px; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);">
                Reply & Moderate in Dashboard →
              </a>
            </td>
          </tr>

          ${renderModernFooter(storeName)}

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return dispatchEmail({
    from: fromEmail,
    to: toEmail,
    subject: `⭐ New ${starCount}-Star Review for ${storeName} from ${customerName}`,
    html,
  });
}

// ============================================================================
// 5. OFFICIAL STORE LAUNCH HANDOVER EMAIL (SUPER ADMIN PORTAL)
// ============================================================================

export {
  generateStoreLaunchHandoverHtml,
  type StoreLaunchHandoverEmailOptions,
  type HandoverAttachment,
  type DomainOwnershipType,
  type HostingSetupType,
} from "./email-templates/launch-handover";

import {
  generateStoreLaunchHandoverHtml,
  type StoreLaunchHandoverEmailOptions,
} from "./email-templates/launch-handover";

/**
 * Dispatch Store Launch Handover Email via Resend
 * Supports dynamic domain/hosting and file attachments (PDF/JPG/PNG).
 */
export async function sendStoreLaunchHandoverEmail(options: StoreLaunchHandoverEmailOptions): Promise<BaseEmailResult> {
  const { toEmail, storeName, supportEmail = "support@ninthwave.in", attachments = [], cc, bcc } = options;

  const html = generateStoreLaunchHandoverHtml(options);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vanij <notifications@ninthwave.in>";

  // Resend accepts { filename: string, path: string } for remote URLs
  const emailAttachments = attachments.map((att) => ({
    filename: att.name,
    path: att.url,
  }));

  return dispatchEmail({
    from: fromEmail,
    to: toEmail,
    cc,
    bcc,
    subject: `Your Store ${storeName} Is Now Live! — Admin Access, Domain & Launch Handover`,
    html,
    replyTo: supportEmail,
    attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
  });
}
