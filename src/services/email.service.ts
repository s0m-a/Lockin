import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendVerificationEmailOptions {
  to: string;
  username: string;
  token: string;
}

export async function sendVerificationEmail({
  to,
  username,
  token,
}: SendVerificationEmailOptions): Promise<boolean> {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Lockin Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF4ED; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAF4ED; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560px" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(91, 49, 19, 0.05); border: 1px solid #EFBFC2;">
          
          <!-- Header Bar with Vintage Warm Brown Aesthetic -->
          <tr>
            <td style="background-color: #3E2312; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #FFF9F2; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; font-family: Georgia, serif;">
                Lockin 🌿
              </h1>
              <p style="margin: 6px 0 0 0; color: #EFBFC2; font-size: 13px; font-weight: 400; letter-spacing: 0.3px;">
                A more intentional you
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px; text-align: left;">
              <h2 style="margin: 0 0 16px 0; color: #5B3113; font-size: 22px; font-weight: 600; font-family: Georgia, serif;">
                Welcome, ${escapeHtml(username)}!
              </h2>

              <p style="margin: 0 0 20px 0; color: #6E4D36; font-size: 15px; line-height: 1.6;">
                Thank you for joining <strong>Lockin</strong>. To finish setting up your account and unlock your personalized scheduling workspace, please verify your email address.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; background-color: #C88D95; color: #FFFFFF; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 4px 12px rgba(200, 141, 149, 0.35); transition: background-color 0.2s ease;">
                      Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background-color: #FFF9F2; border-left: 4px solid #C88D95; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #7E5B44; font-size: 13px; line-height: 1.5;">
                  ⏳ This link will expire in <strong>24 hours</strong>. If you didn't create a Lockin account, you can safely ignore this email.
                </p>
              </div>

              <!-- Raw Fallback Link -->
              <p style="margin: 24px 0 6px 0; color: #AD8F7A; font-size: 12px;">
                Button not working? Copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; word-break: break-all;">
                <a href="${verifyUrl}" style="color: #C88D95; font-size: 12px; text-decoration: underline;">
                  ${verifyUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF4ED; padding: 24px 40px; text-align: center; border-top: 1px solid #EFBFC2;">
              <p style="margin: 0 0 6px 0; color: #AD8F7A; font-size: 12px;">
                Lockin: Scheduling & Productivity Tracker
              </p>
              <p style="margin: 0; color: #C4A792; font-size: 11px;">
                "A focused mind builds a beautiful life."
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

  if (!resend) {
    console.warn('[EmailService] RESEND_API_KEY is not configured. Verification email logged to console:');
    console.log(`[Verification Email Link] ${verifyUrl}`);
    return false;
  }

  try {
    const { error, data } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [to],
      subject: 'Verify your Lockin account',
      html,
    });

    if (error) {
      console.error('[EmailService] Failed to send email via Resend:', error);
      console.log(`\n🔗 [DEV VERIFICATION LINK for ${to}]:\n${verifyUrl}\n`);
      return false;
    }

    console.log(`[EmailService] Verification email sent to ${to} (ID: ${data?.id})`);
    return true;
  } catch (err) {
    console.error('[EmailService] Error sending verification email:', err);
    console.log(`\n🔗 [DEV VERIFICATION LINK for ${to}]:\n${verifyUrl}\n`);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
