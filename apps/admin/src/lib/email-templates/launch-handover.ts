/**
 * Vanij - Store Launch Handover Email Template
 * Pure HTML/CSS generator with zero server/db dependencies.
 * Safe for use in both Server Actions and Client Previews.
 */

export type DomainOwnershipType = "complimentary" | "client_owned";
export type HostingSetupType = "vanij_managed" | "client_managed";

export interface HandoverAttachment {
  name: string;
  url: string;
  size?: number;
}

export interface StoreLaunchHandoverEmailOptions {
  toEmail: string;
  clientName: string;
  storeName: string;
  storeSlug: string;
  liveStoreUrl: string;
  adminPortalUrl: string;
  loginEmail: string;
  temporaryPassword?: string;
  registeredDomain: string;
  
  // Dynamic Domain & Hosting controls
  domainOwnership?: DomainOwnershipType; // "complimentary" | "client_owned"
  hostingSetup?: HostingSetupType;       // "vanij_managed" | "client_managed"
  
  planName?: string;
  activationDate: string;
  renewalDate: string;
  
  // Attachments (PDFs, JPGs, PNGs)
  attachments?: HandoverAttachment[];
  
  // Optional CC and BCC recipients
  cc?: string | string[];
  bcc?: string | string[];

  customNote?: string;
  senderName?: string;
  supportEmail?: string;
}

// Official High-DPI UploadThing CDN Logos
const BRAND_FULL_LOGO_URL = "https://juip68hrv7.ufs.sh/f/rbcDy8QRznHhnM73kIzdk5pOgE9KjNGbL6W7DQP3XoMl0JUA";
const BRAND_ICON_URL = "https://juip68hrv7.ufs.sh/f/rbcDy8QRznHhYkVlwbn7jNqR1Dek5wYWI98FLUM0ZlKoCsBV";

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function generateStoreLaunchHandoverHtml(options: StoreLaunchHandoverEmailOptions): string {
  const {
    clientName,
    storeName,
    liveStoreUrl,
    adminPortalUrl,
    loginEmail,
    temporaryPassword = "ProvidedConfidential123!",
    registeredDomain,
    domainOwnership = "complimentary",
    hostingSetup = "vanij_managed",
    planName = "Domain + Managed Cloud Hosting (Complimentary — Year 1)",
    activationDate,
    renewalDate,
    attachments = [],
    customNote,
  } = options;

  const currentYear = new Date().getFullYear();
  const isDomainComplimentary = domainOwnership === "complimentary";
  const isHostingVanij = hostingSetup === "vanij_managed";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Store ${storeName} Is Now Live! — Official Launch Handover</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border: none !important; }
      .email-wrapper { padding: 0 !important; }
      .email-header-pad { padding: 22px 20px !important; }
      .email-body-pad { padding: 24px 20px !important; }
      .email-footer-pad { padding: 28px 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-stack-right { display: block !important; width: 100% !important; text-align: left !important; margin-top: 14px !important; box-sizing: border-box !important; }
      .mobile-full-btn { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
      .mobile-title { font-size: 21px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-container" style="max-width: 640px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Ultra-Clean Platinum Brand Header with Crisp High-Contrast Logo -->
          <tr>
            <td class="email-header-pad" style="background-color: #ffffff; padding: 24px 32px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" class="mobile-stack">
                    <a href="https://vanij.ninthwave.in" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${BRAND_FULL_LOGO_URL}" alt="Vanij" height="34" style="height: 34px; width: auto; max-width: 140px; display: block; border: 0;" />
                    </a>
                  </td>
                  <td align="right" valign="middle" class="mobile-stack-right">
                    <span style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 11px; font-weight: 700; color: #4338ca; background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 6px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.8px; display: inline-block;">
                      STORE LAUNCH &amp; HANDOVER
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting Banner -->
          <tr>
            <td class="email-body-pad" style="padding: 34px 36px 20px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; margin-bottom: 16px;">
                      <span style="height: 8px; width: 8px; background-color: #10b981; border-radius: 50%; display: inline-block;"></span>
                      <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; color: #065f46; letter-spacing: 0.5px; text-transform: uppercase;">Store Configured &amp; Live</span>
                    </div>

                    <h1 class="mobile-title" style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px; line-height: 1.25;">
                      Your Store <span style="color: #4f46e5;">${storeName}</span> Is Now Live!
                    </h1>
                    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; color: #64748b; margin: 0; line-height: 22px;">
                      Admin Access, Domain &amp; Official Launch Handover
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro Paragraph -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 24px 36px;">
              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; color: #334155; margin: 0 0 16px 0; line-height: 24px;">
                Dear <strong>${clientName}</strong>,
              </p>
              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; color: #475569; margin: 0 0 20px 0; line-height: 24px;">
                Thank you for partnering with us. We are pleased to inform you that your online store, <strong>${storeName}</strong>, has been successfully configured, tested, and launched.
              </p>

              <!-- Live Storefront Callout Box -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; padding: 18px 22px; border: 1px solid #cbd5e1;">
                <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin: 0 0 6px 0;">
                  Live Storefront Destination
                </p>
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; word-break: break-all;">
                  <a href="${liveStoreUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">${liveStoreUrl}</a>
                </div>
                <a href="${liveStoreUrl}" target="_blank" class="mobile-full-btn" style="background-color: #0f172a; color: #ffffff; padding: 9px 20px; border-radius: 8px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700; text-decoration: none; display: inline-block;">
                  Visit Live Storefront →
                </a>
              </div>
            </td>
          </tr>

          <!-- SECTION 1: Admin Credentials -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 28px 36px;">
              <div style="border-radius: 16px; border: 1px solid #e2e8f0; background-color: #ffffff; padding: 24px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
                
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                  <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 800; color: #4f46e5; background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 3px 10px; border-radius: 6px; margin-right: 8px;">
                    1
                  </span>
                  <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">
                    Admin Portal Access Credentials
                  </h2>
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 18px;">
                  <tr>
                    <td style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 13px; color: #64748b; width: 140px;">
                      Admin Portal URL:
                    </td>
                    <td style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 13px; color: #0f172a; font-weight: 600; word-break: break-all;">
                      <a href="${adminPortalUrl}" target="_blank" style="color: #4f46e5; text-decoration: underline;">${adminPortalUrl}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 13px; color: #64748b;">
                      Login ID (Email):
                    </td>
                    <td style="padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 13px; color: #0f172a; font-weight: 700;">
                      <code style="background-color: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #0f172a;">${loginEmail}</code>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 9px 0; font-family: 'Inter', sans-serif; font-size: 13px; color: #64748b;">
                      Temporary Password:
                    </td>
                    <td style="padding: 9px 0; font-family: 'Inter', sans-serif; font-size: 13px; color: #0f172a; font-weight: 700;">
                      <code style="background-color: #fef2f2; color: #991b1b; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; border: 1px solid #fecaca;">${temporaryPassword}</code>
                    </td>
                  </tr>
                </table>

                <div style="margin-bottom: 20px;">
                  <a href="${adminPortalUrl}" target="_blank" class="mobile-full-btn" style="background: linear-gradient(145deg, #4f46e5 0%, #4338ca 100%); color: #ffffff; padding: 13px 26px; border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);">
                    Sign In to Admin Dashboard →
                  </a>
                </div>

                <!-- Security Warning Box -->
                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; border-radius: 10px; padding: 14px 16px;">
                  <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #92400e; margin: 0; line-height: 19px;">
                    <strong>Important Security Notice:</strong> For your account safety, please sign in and change your temporary password immediately after your first login (or use the <em>"Forgot password?"</em> option on the sign-in screen to set a new private password). Please keep these credentials confidential.
                  </p>
                </div>

              </div>
            </td>
          </tr>

          <!-- SECTION 2: Dynamic Domain & Infrastructure Details -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 28px 36px;">
              <div style="border-radius: 16px; border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 24px;">
                
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 800; color: #0284c7; background-color: #e0f2fe; border: 1px solid #bae6fd; padding: 3px 10px; border-radius: 6px; margin-right: 8px;">
                    2
                  </span>
                  <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">
                    ${isDomainComplimentary && isHostingVanij 
                      ? "Complimentary 1-Year Domain &amp; Managed Hosting Details" 
                      : !isDomainComplimentary && isHostingVanij 
                        ? "Custom Domain &amp; Managed Cloud Hosting Details"
                        : "Custom Domain &amp; Infrastructure Configuration"}
                  </h2>
                </div>

                <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #475569; margin: 0 0 16px 0; line-height: 21px;">
                  ${isDomainComplimentary && isHostingVanij
                    ? "Your launch package includes <strong>1 year of free Domain Registration and Managed Cloud Hosting</strong> on Vanij:"
                    : !isDomainComplimentary && isHostingVanij
                      ? "Your store has been configured with your <strong>own custom domain</strong> running on <strong>Vanij Managed Cloud Hosting</strong>:"
                      : "Your store has been successfully configured and deployed to your <strong>own custom domain and cloud infrastructure</strong>:"}
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px; background-color: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; padding: 6px 14px;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 12px; color: #64748b; width: 140px;">
                      ${isDomainComplimentary ? "Registered Domain:" : "Domain Setup:"}
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 13px; color: #0f172a; font-weight: 700;">
                      ${registeredDomain} ${isDomainComplimentary ? '<span style="font-size: 11px; font-weight: normal; color: #059669;">(1-Year Complimentary)</span>' : '<span style="font-size: 11px; font-weight: normal; color: #4f46e5;">(Client-Owned • DNS Pointed)</span>'}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 12px; color: #64748b;">
                      Cloud Hosting:
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 13px; color: #0f172a; font-weight: 600;">
                      ${isHostingVanij ? "Vanij Managed Cloud Infrastructure (Complimentary — Year 1)" : "Client-Managed Infrastructure (Configured &amp; Active)"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 12px; color: #64748b;">
                      ${isHostingVanij ? "Activation Date:" : "Deployment Date:"}
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-family: 'Inter', sans-serif; font-size: 13px; color: #0f172a; font-weight: 600;">
                      ${activationDate}
                    </td>
                  </tr>
                  ${(isDomainComplimentary || isHostingVanij) ? `
                  <tr>
                    <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 12px; color: #64748b;">
                      ${isDomainComplimentary ? "Next Renewal Date:" : "Hosting Renewal Date:"}
                    </td>
                    <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 13px; color: #059669; font-weight: 700;">
                      ${renewalDate}
                    </td>
                  </tr>
                  ` : ""}
                </table>

                <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 10px 14px;">
                  <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #166534; margin: 0; line-height: 18px;">
                    ${(isDomainComplimentary || isHostingVanij)
                      ? `🔔 <strong>Peace of Mind Guarantee:</strong> We will send you a renewal reminder well in advance of <strong>${renewalDate}</strong>, so your website continues running without interruption.`
                      : `🔔 <strong>Account Responsibility:</strong> Your custom domain registration and server hosting are managed directly under your own provider accounts.`}
                  </p>
                </div>

              </div>
            </td>
          </tr>

          <!-- SECTION 3: Security, SEO & Verification Status -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 28px 36px;">
              <div style="border-radius: 16px; border: 1px solid #e2e8f0; background-color: #ffffff; padding: 24px;">
                
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 800; color: #059669; background-color: #d1fae5; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 6px; margin-right: 8px;">
                    3
                  </span>
                  <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">
                    Security, SEO &amp; Technical Setup Summary
                  </h2>
                </div>

                <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #475569; margin: 0 0 16px 0; line-height: 22px;">
                  To ensure your store is secure and ready to be discovered by customers from day one, we have completed the following across your entire website:
                </p>

                <div style="margin-bottom: 16px;">
                  <div style="padding: 12px 14px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; margin-bottom: 10px;">
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">
                      🔒 SSL Certificate &amp; HTTPS Security
                    </p>
                    <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #475569; margin: 0; line-height: 18px;">
                      Full 256-bit SSL encryption is active across your storefront and checkout, ensuring safe browsing and protected customer transactions.
                    </p>
                  </div>

                  <div style="padding: 12px 14px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9; margin-bottom: 10px;">
                    <p style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">
                      🚀 Complete Site SEO Setup
                    </p>
                    <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #475569; margin: 0; line-height: 18px;">
                      Technical and on-page SEO fundamentals—including structured metadata, mobile-friendly layout optimization, clean URLs, and search-engine readiness—have been configured site-wide.
                    </p>
                  </div>
                </div>

                <!-- Proofs & Records Callout -->
                <div style="border-top: 1px solid #f1f5f9; padding-top: 14px;">
                  <p style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; color: #334155; margin: 0 0 8px 0;">
                    Verification Status for Your Records:
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="font-family: 'Inter', sans-serif; font-size: 12px; color: #16a34a; padding: 3px 0;">
                        ✓ SSL Certificate / TLS Encryption: <strong>Active &amp; Verified</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="font-family: 'Inter', sans-serif; font-size: 12px; color: #16a34a; padding: 3px 0;">
                        ${isDomainComplimentary
                          ? "✓ Domain Registration Certificate: <strong>Active (1-Year Complimentary)</strong>"
                          : "✓ Custom Domain DNS Configuration: <strong>Connected &amp; Verified Active</strong>"}
                      </td>
                    </tr>
                    ${isHostingVanij ? `
                    <tr>
                      <td style="font-family: 'Inter', sans-serif; font-size: 12px; color: #16a34a; padding: 3px 0;">
                        ✓ Vanij Managed Cloud CDN: <strong>Active (99.9% Uptime SLA)</strong>
                      </td>
                    </tr>
                    ` : ""}
                  </table>
                </div>

              </div>
            </td>
          </tr>

          ${attachments && attachments.length > 0 ? `
          <!-- ATTACHED DOCUMENTS SECTION -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 28px 36px;">
              <div style="border-radius: 16px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 22px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; margin-right: 8px;">📎</span>
                  <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    Attached Verification Files &amp; Proofs (${attachments.length})
                  </h3>
                </div>
                <p style="font-family: 'Inter', sans-serif; font-size: 12.5px; color: #475569; margin: 0 0 14px 0; line-height: 19px;">
                  The following official documents and certificates are attached to this email and archived for your store records:
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  ${attachments.map((att, idx) => `
                    <tr>
                      <td style="padding: 8px 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 6px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td valign="middle" style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #0f172a;">
                              📄 ${att.name} ${att.size ? `<span style="font-size: 11px; font-weight: normal; color: #64748b;">(${formatBytes(att.size)})</span>` : ""}
                            </td>
                            <td align="right" valign="middle">
                              <a href="${att.url}" target="_blank" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700; color: #4f46e5; text-decoration: none; background-color: #eef2ff; padding: 4px 10px; border-radius: 6px; display: inline-block;">
                                Download ↗
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ${idx < attachments.length - 1 ? '<tr><td height="6"></td></tr>' : ''}
                  `).join("")}
                </table>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- SECTION 4: Vanij Platform Capabilities -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 28px 36px;">
              <div style="border-radius: 16px; border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 24px;">
                
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 800; color: #7c3aed; background-color: #f3e8ff; border: 1px solid #e9d5ff; padding: 3px 10px; border-radius: 6px; margin-right: 8px;">
                    4
                  </span>
                  <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">
                    What You Can Manage in Your Vanij Admin Portal
                  </h2>
                </div>

                <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #475569; margin: 0 0 16px 0; line-height: 22px;">
                  Your store is powered by Vanij, giving you complete control over your business from both desktop and mobile:
                </p>

                <!-- 7 Module List -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; line-height: 20px;">
                      📊 <strong>Live Overview Dashboard:</strong> Track revenue, order volume, active products, registered customers, and recent store activity in real time.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; line-height: 20px;">
                      📦 <strong>Catalog &amp; Inventory:</strong> Add or update products, variants, pricing, stock levels, and categories anytime.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; line-height: 20px;">
                      🛒 <strong>Orders &amp; Fulfillment:</strong> View incoming orders, check payment statuses, and manage deliveries smoothly.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; line-height: 20px;">
                      🏷️ <strong>Discounts &amp; Promotions:</strong> Create and manage coupon codes and promotional offers for your buyers.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; line-height: 20px;">
                      👥 <strong>Customers, Leads &amp; Reviews:</strong> Access customer records, respond to inquiries/leads, and manage store reviews.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; line-height: 20px;">
                      🎨 <strong>Storefront Design &amp; Settings:</strong> Customize your storefront appearance, business details, and store preferences whenever needed.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 12.5px; color: #334155; line-height: 20px;">
                      🤖 <strong>Vanij AI (24/7 Assistant):</strong> Use your built-in Vanij AI assistant inside the dashboard for round-the-clock store guidance and operational help.
                    </td>
                  </tr>
                </table>

              </div>
            </td>
          </tr>

          ${customNote ? `
          <!-- Custom Super Admin Note -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 28px 36px;">
              <div style="background-color: #f1f5f9; border-left: 4px solid #6366f1; border-radius: 8px; padding: 14px 18px;">
                <p style="font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #4338ca; margin: 0 0 6px 0;">
                  Note from Ninthwave Engineering Team:
                </p>
                <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #1e293b; margin: 0; line-height: 21px; white-space: pre-line;">
                  ${customNote}
                </p>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- Support & Closing Sign-Off -->
          <tr>
            <td class="email-body-pad" style="padding: 0 36px 36px 36px;">
              <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #475569; margin: 0 0 16px 0; line-height: 22px;">
                If you have any questions while exploring your dashboard or would like a quick walkthrough, simply reply to this email or reach us at <a href="mailto:support@ninthwave.in" style="color: #4f46e5; text-decoration: none; font-weight: 600;">support@ninthwave.in</a>.
              </p>

              <p style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 24px 0;">
                Wishing you tremendous success with ${storeName}!
              </p>

              <!-- Executive Signature Block -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 13px; color: #64748b; margin: 0 0 4px 0;">
                  Warm regards,
                </p>
                <p style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 15px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">
                  Shubojit Das
                </p>
                <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; font-weight: 600; color: #4f46e5; margin: 0 0 10px 0;">
                  Vanij · Ninthwave Technologies
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family: 'Inter', sans-serif; font-size: 11px; color: #64748b;">
                      Website: <a href="https://vanij.ninthwave.in" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">vanij.ninthwave.in</a> &nbsp;•&nbsp; <a href="https://www.ninthwave.in" target="_blank" style="color: #4f46e5; text-decoration: none; font-weight: 600;">ninthwave.in</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family: 'Inter', sans-serif; font-size: 11px; color: #64748b; padding-top: 4px;">
                      Email: <a href="mailto:support@ninthwave.in" style="color: #4f46e5; text-decoration: none; font-weight: 600;">support@ninthwave.in</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- High-End Modern Footer with Full Vanij Logo at the bottom -->
          <tr>
            <td class="email-footer-pad" style="padding: 30px 32px 34px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <!-- Vanij Full Logo at the bottom -->
                <tr>
                  <td align="center" style="padding-bottom: 14px;">
                    <a href="https://vanij.ninthwave.in" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${BRAND_FULL_LOGO_URL}" alt="Vanij" height="32" style="height: 32px; width: auto; max-width: 140px; display: block; border: 0;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <p style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-size: 13px; font-weight: 600; color: #334155; margin: 0;">
                      Client Store: <span style="color: #0f172a; font-weight: 700;">${storeName}</span>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px;">
                    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #64748b; margin: 0; line-height: 18px;">
                      Powered by <strong style="color: #0f172a;">Vanij</strong> • An enterprise commerce cloud by <a href="https://ninthwave.in" target="_blank" style="color: #6366f1; text-decoration: none; font-weight: 600;">Ninthwave Technologies</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: #94a3b8; margin: 0;">
                      © ${currentYear} Ninthwave Technologies. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
