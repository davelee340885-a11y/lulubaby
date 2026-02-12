/**
 * Email Service
 * Sends transactional emails via Nodemailer (any SMTP provider)
 * Default: Titan Email (smtp.titan.email:465 SSL)
 * Also supports Gmail, SendGrid, or any standard SMTP server
 */
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

// Lazy-initialized transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const smtpUser = ENV.smtpUser;
  const smtpPass = ENV.smtpPass;

  if (!smtpUser || !smtpPass) {
    console.warn("[EmailService] SMTP credentials not configured. Email sending disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

export type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

/**
 * Send an email via SMTP.
 * Returns true if sent successfully, false if email service is unavailable.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[EmailService] Cannot send email - transporter not available");
    return false;
  }

  try {
    await transport.sendMail({
      from: `"Lulubaby" <${ENV.smtpFrom}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`[EmailService] Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Failed to send email:", error);
    return false;
  }
}

/**
 * Send password reset email with a branded HTML template
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const expiryHours = 24;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#7c3aed;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Lulubaby</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">您的 AI 智能體平台</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;font-weight:600;">密碼重置請求</h2>
              <p style="margin:0 0 24px;color:#4a4a68;font-size:15px;line-height:1.6;">
                您好，${userName || "用戶"}！<br><br>
                我們收到了您的密碼重置請求。請點擊下方按鈕重置您的密碼：
              </p>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetLink}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" strokecolor="#6d28d9" fillcolor="#7c3aed">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">重置密碼</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${resetLink}" target="_blank" style="display:inline-block;background-color:#7c3aed;color:#ffffff !important;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;mso-hide:all;">
                      重置密碼
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;color:#4a4a68;font-size:14px;line-height:1.6;">
                如果按鈕無法點擊，請複製以下連結到瀏覽器：
              </p>
              <p style="margin:0 0 24px;padding:12px 16px;background-color:#f8f7ff;border-radius:8px;word-break:break-all;color:#7c3aed;font-size:13px;line-height:1.5;">
                ${resetLink}
              </p>
              <div style="border-top:1px solid #e8e8ef;padding-top:20px;margin-top:8px;">
                <p style="margin:0;color:#8e8ea0;font-size:13px;line-height:1.5;">
                  ⏰ 此連結將在 <strong>${expiryHours} 小時</strong>後過期。<br>
                  🔒 如果您沒有請求重置密碼，請忽略此郵件，您的帳戶安全不會受到影響。
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f7ff;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#8e8ea0;font-size:12px;">
                &copy; ${new Date().getFullYear()} Lulubaby. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Lulubaby 密碼重置

您好，${userName || "用戶"}！

我們收到了您的密碼重置請求。請點擊以下連結重置您的密碼：

${resetLink}

此連結將在 ${expiryHours} 小時後過期。

如果您沒有請求重置密碼，請忽略此郵件。

© ${new Date().getFullYear()} Lulubaby
  `.trim();

  return sendEmail({
    to,
    subject: "Lulubaby - 密碼重置",
    text,
    html,
  });
}
