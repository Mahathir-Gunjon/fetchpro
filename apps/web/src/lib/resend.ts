import { Resend } from 'resend';

export interface SendEmailPayload {
  to: string;
  subject: string;
  pitchBody: string;
  businessName: string;
  senderName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Send personalized outreach email via Resend API
 */
export async function sendOutreachEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { to, subject, pitchBody, businessName, senderName = 'FetchPro Outreach' } = payload;
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'FetchPro <onboarding@resend.dev>';

  // Format plain text into clean HTML email
  const formattedHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 20px;">
      ${pitchBody
        .split('\n\n')
        .map((paragraph) => `<p style="margin-bottom: 14px;">${paragraph.replace(/\n/g, '<br/>')}</p>`)
        .join('')}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="font-size: 13px; color: #64748b; margin: 0;">
        Sent to <strong>${businessName}</strong> (${to}) via FetchPro Outreach.
      </p>
    </div>
  `;

  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const resend = new Resend(apiKey);
      const data = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject: subject,
        text: pitchBody,
        html: formattedHtml,
      });

      if (data.error) {
        return {
          success: false,
          error: data.error.message,
        };
      }

      return {
        success: true,
        messageId: data.data?.id,
        simulated: false,
      };
    } catch (error: any) {
      console.error('[Resend Error]', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via Resend',
      };
    }
  }

  // Sandbox simulation mode
  console.log('[Resend Sandbox] Email simulated to:', to, 'Subject:', subject);
  return {
    success: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    simulated: true,
  };
}
