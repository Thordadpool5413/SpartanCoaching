// Resend email integration - connection:conn_resend_01KHBVN64PBBCX3EQPJ8KHQP7Z
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

interface InquiryEmailData {
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  serviceType?: string | null;
  message: string;
}

export async function sendInquiryNotification(inquiry: InquiryEmailData): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const notificationEmail = process.env.NOTIFICATION_EMAIL || fromEmail;
    
    await client.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `New Inquiry from ${inquiry.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.phone}</td></tr>
          ${inquiry.company ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.company}</td></tr>` : ''}
          ${inquiry.serviceType ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Service Interest</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.serviceType}</td></tr>` : ''}
        </table>
        <h3 style="margin-top: 20px;">Message</h3>
        <p style="background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${inquiry.message}</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">This notification was sent from the Spartan Coaching contact form.</p>
      `,
    });
    
    console.log(`Inquiry notification email sent for ${inquiry.name}`);
    return true;
  } catch (error) {
    console.error('Failed to send inquiry notification email:', error);
    return false;
  }
}

export async function sendNewsletterConfirmation(email: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to Spartan Coaching',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h1 style="color: #1a1a1a;">Welcome to Spartan Coaching</h1>
          <p>Thanks for subscribing to our newsletter. You'll receive weekly tips on hospice sales excellence, coaching strategies, and industry insights.</p>
          <p style="margin-top: 24px;">Stay disciplined. Stay empathetic. Stay strategic.</p>
          <p style="color: #666; font-size: 14px; margin-top: 32px;">— The Spartan Coaching Team</p>
        </div>
      `,
    });
    
    console.log(`Newsletter confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send newsletter confirmation email:', error);
    return false;
  }
}

interface AgreementEmailData {
  agreementType: string;
  signerName: string;
  signerTitle: string;
  signerOrganization: string;
  signerEmail: string;
  signedAt: string;
}

export async function sendAgreementConfirmation(data: AgreementEmailData): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const adminEmail = 'nicholas.lynch@spartan-coaching-schools.org';
    
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #b91c1c; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Spartan Coaching</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0;">Agreement Confirmation</p>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1a1a1a; margin-top: 0;">${data.agreementType}</h2>
          <p style="color: #555;">This confirms that the following agreement has been digitally signed:</p>
          <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
            <tr><td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #eee; color: #333;">Name</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${data.signerName}</td></tr>
            <tr><td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #eee; color: #333;">Title</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${data.signerTitle}</td></tr>
            <tr><td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #eee; color: #333;">Organization</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${data.signerOrganization}</td></tr>
            <tr><td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #eee; color: #333;">Email</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;"><a href="mailto:${data.signerEmail}">${data.signerEmail}</a></td></tr>
            <tr><td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #eee; color: #333;">Date Signed</td><td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${data.signedAt}</td></tr>
          </table>
          <p style="color: #555; font-size: 14px;">This is a digital record of the agreement. Please retain this email for your records. For questions, contact Spartan Coaching.</p>
        </div>
        <div style="padding: 16px; background: #f5f5f5; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">Spartan Coaching &mdash; The Authority in Hospice Excellence</p>
        </div>
      </div>
    `;

    await Promise.all([
      client.emails.send({
        from: fromEmail,
        to: data.signerEmail,
        subject: `Agreement Signed: ${data.agreementType} — Spartan Coaching`,
        html: htmlContent,
      }),
      client.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `New Agreement Signed: ${data.agreementType} by ${data.signerName} (${data.signerOrganization})`,
        html: htmlContent,
      }),
    ]);
    
    console.log(`Agreement confirmation emails sent for ${data.agreementType} - ${data.signerName}`);
    return true;
  } catch (error) {
    console.error('Failed to send agreement confirmation emails:', error);
    return false;
  }
}

export async function sendGeneratedEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${body.split('\n').map(line => line.trim() ? `<p style="margin: 8px 0; line-height: 1.6;">${line}</p>` : '<br/>').join('\n')}
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #888; font-size: 12px;">Sent via Spartan Coaching email tools.</p>
        </div>
      `,
    });

    console.log(`Generated email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Failed to send generated email:', error);
    return false;
  }
}
