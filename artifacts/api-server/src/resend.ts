// Resend email integration - connection:conn_resend_01KHBVN64PBBCX3EQPJ8KHQP7Z
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Spartan Coaching <nick@spartanhospicecoaching.com>';

  if (process.env.RESEND_API_KEY) {
    console.log('[Resend] Using RESEND_API_KEY env var, from:', fromEmail);
    return { apiKey: process.env.RESEND_API_KEY, fromEmail };
  }

  console.log('[Resend] RESEND_API_KEY not found, trying Replit connector...');
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('[Resend] No credentials available: RESEND_API_KEY missing and no Replit identity token found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then((data: any) => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('[Resend] Connector found but api_key is missing or connector not linked');
  }
  console.log('[Resend] Using Replit connector credentials, from:', fromEmail);
  return { apiKey: connectionSettings.settings.api_key, fromEmail };
}

export async function checkResendHealth(): Promise<void> {
  try {
    const { fromEmail } = await getCredentials();
    console.log('[Resend] Health check OK — ready to send from:', fromEmail);
  } catch (err: any) {
    console.error('[Resend] WARNING: Email sending will NOT work —', err?.message || err);
  }
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

async function sendEmail(client: Resend, params: Parameters<typeof client.emails.send>[0]): Promise<void> {
  const { data, error } = await client.emails.send(params as any);
  if (error) {
    throw new Error(`Resend delivery error [${(error as any).name ?? 'unknown'}]: ${(error as any).message ?? JSON.stringify(error)}`);
  }
}

function getSiteUrl(): string {
  return process.env.SITE_URL
    || (process.env.REPLIT_DEPLOYMENT_URL ? `https://${process.env.REPLIT_DEPLOYMENT_URL}` : '')
    || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '')
    || 'https://spartanhospicecoaching.com';
}

function emailHeader(): string {
  const siteUrl = getSiteUrl();
  return `<div style="background: #ffffff; padding: 24px; text-align: center; border-bottom: 3px solid #b91c1c;">
    <a href="${siteUrl}" style="display: inline-block;">
      <img src="${siteUrl}/spartan-stamp-email.png" alt="Spartan Coaching" width="200" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
    </a>
  </div>`;
}

function emailFooter(): string {
  const siteUrl = getSiteUrl();
  return `<div style="padding: 28px 24px; background: #f9fafb; border-top: 2px solid #e5e7eb; text-align: center;">
    <a href="${siteUrl}" style="display: inline-block; margin-bottom: 12px;">
      <img src="${siteUrl}/spartan-stamp-email.png" alt="Spartan Coaching" width="140" style="max-width: 140px; height: auto; display: block; margin: 0 auto;" />
    </a>
    <p style="color: #6b7280; font-size: 12px; margin: 0 0 4px;">Spartan Coaching &mdash; The Authority in Hospice Sales Excellence</p>
    <p style="font-size: 11px; margin: 0;">
      <a href="${siteUrl}" style="color: #b91c1c; text-decoration: none;">spartanhospicecoaching.com</a>
    </p>
  </div>`;
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
    
    const isComplianceInquiry = inquiry.serviceType?.toLowerCase().includes('hipaa') || inquiry.serviceType?.toLowerCase().includes('baa');
    const subjectPrefix = isComplianceInquiry ? '[COMPLIANCE] ' : '';
    
    await sendEmail(client, {
      from: fromEmail,
      to: notificationEmail,
      subject: `${subjectPrefix}New Inquiry from ${inquiry.name}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 24px;">
            ${isComplianceInquiry ? '<div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;"><strong style="color: #dc2626;">COMPLIANCE INQUIRY</strong> — This contact has requested information about HIPAA BAA or compliance-related services.</div>' : ''}
            <h2 style="margin-top: 0;">New Contact Form Submission</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.phone}</td></tr>
              ${inquiry.company ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.company}</td></tr>` : ''}
              ${inquiry.serviceType ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Service Interest</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${inquiry.serviceType}</td></tr>` : ''}
            </table>
            <h3 style="margin-top: 20px;">Message</h3>
            <p style="background: #f9f9f9; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${inquiry.message}</p>
          </div>
          ${emailFooter()}
        </div>
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
    
    await sendEmail(client, {
      from: fromEmail,
      to: email,
      subject: 'Welcome to Spartan Coaching',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 32px 24px;">
            <h1 style="color: #1a1a1a; margin-top: 0;">Welcome to Spartan Coaching</h1>
            <p>Thanks for subscribing to our newsletter. You'll receive weekly tips on hospice sales excellence, coaching strategies, and industry insights.</p>
            <p style="margin-top: 24px;">Stay disciplined. Stay empathetic. Stay strategic.</p>
            <p style="color: #666; font-size: 14px; margin-top: 32px;">— The Spartan Coaching Team</p>
          </div>
          ${emailFooter()}
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
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'nick@spartanhospicecoaching.com';
    
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        ${emailHeader()}
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Agreement Confirmation</h2>
          <h3 style="color: #333;">${data.agreementType}</h3>
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
        ${emailFooter()}
      </div>
    `;

    await Promise.all([
      sendEmail(client, {
        from: fromEmail,
        to: data.signerEmail,
        subject: `Agreement Signed: ${data.agreementType} — Spartan Coaching`,
        html: htmlContent,
      }),
      sendEmail(client, {
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

export async function sendResourceLeadNotification(name: string, email: string, resourceTitle: string, isNew = true): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'nick@spartanhospicecoaching.com';
    const label = isNew ? 'New Lead' : 'Returning User';
    const badgeColor = isNew ? '#b91c1c' : '#374151';

    await sendEmail(client, {
      from: fromEmail,
      to: adminEmail,
      subject: `[${label}] Resource Access: ${resourceTitle}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 24px;">
            <h2 style="margin-top: 0;">
              <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:12px;padding:3px 10px;border-radius:4px;margin-right:8px;vertical-align:middle;">${label}</span>
              Resource Access
            </h2>
            <p style="color:#374151;">
              ${isNew
                ? 'A new contact entered their information to access a resource on your site.'
                : 'A returning contact accessed another resource on your site.'}
            </p>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; width: 110px;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color:#b91c1c;">${email}</a></td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Resource</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${resourceTitle}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Status</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${label}</td></tr>
            </table>
          </div>
          ${emailFooter()}
        </div>
      `,
    });

    console.log(`[Resend] Lead notification sent to admin for ${name} <${email}> (${resourceTitle}) [${label}]`);
    return true;
  } catch (error: any) {
    console.error(`[Resend] FAILED lead notification for ${name} <${email}> (${resourceTitle}):`, error?.message || error);
    return false;
  }
}

export async function sendNewsletterNotification(email: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'nick@spartanhospicecoaching.com';

    await sendEmail(client, {
      from: fromEmail,
      to: adminEmail,
      subject: `New Newsletter Subscriber: ${email}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 24px;">
            <h2 style="margin-top: 0;">New Newsletter Subscriber</h2>
            <p>Someone subscribed to the Spartan Coaching weekly newsletter.</p>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
            </table>
          </div>
          ${emailFooter()}
        </div>
      `,
    });

    console.log(`Newsletter notification sent for new subscriber: ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send newsletter notification:', error);
    return false;
  }
}

export async function sendNewsletterBroadcast(
  emails: string[],
  subject: string,
  body: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      const { client, fromEmail } = await getUncachableResendClient();
      await sendEmail(client, {
        from: fromEmail,
        to: email,
        subject,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            ${emailHeader()}
            <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
              ${body.split('\n').map(line => line.trim() ? `<p style="margin: 0 0 14px 0; line-height: 1.65; color: #1a1a1a;">${line}</p>` : '<br/>').join('\n')}
            </div>
            <div style="padding: 16px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this because you subscribed to the Spartan Coaching newsletter.
              </p>
            </div>
            ${emailFooter()}
          </div>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send broadcast to ${email}:`, err);
      failed++;
    }
  }

  console.log(`Newsletter broadcast complete — sent: ${sent}, failed: ${failed}`);
  return { sent, failed };
}

export async function sendDripDay3(email: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    await sendEmail(client, {
      from: fromEmail,
      to: email,
      subject: 'Your Spartan Coaching Toolkit — 3 Tools Worth Using This Week',
      scheduledAt,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin: 0 0 16px 0; line-height: 1.65; color: #1a1a1a;">A few days in — hope you've had a chance to look around. Here are three tools that hospice sales reps use most on the platform:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              <tr>
                <td style="padding: 16px; border: 1px solid #e5e7eb; vertical-align: top;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a1a1a;">Daily Drills</p>
                  <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5;">Build your habits with focused daily practice. Ten minutes a day compounds fast.</p>
                  <a href="https://spartanhospicecoaching.com/drills" style="color: #b91c1c; font-size: 14px; text-decoration: none; font-weight: bold;">Start Today's Drill &rarr;</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px; border: 1px solid #e5e7eb; border-top: none; vertical-align: top;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a1a1a;">Playbook Generator</p>
                  <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5;">Describe any sales scenario and get an AI-built playbook with opening, key talking points, and a close.</p>
                  <a href="https://spartanhospicecoaching.com/tools/playbooks" style="color: #b91c1c; font-size: 14px; text-decoration: none; font-weight: bold;">Build a Playbook &rarr;</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px; border: 1px solid #e5e7eb; border-top: none; vertical-align: top;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a1a1a;">Objection Handler</p>
                  <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5;">Turn the most common objections into confident, empathetic responses — with AI assistance.</p>
                  <a href="https://spartanhospicecoaching.com/tools/objections" style="color: #b91c1c; font-size: 14px; text-decoration: none; font-weight: bold;">Handle an Objection &rarr;</a>
                </td>
              </tr>
            </table>
            <p style="margin: 0 0 14px 0; line-height: 1.65; color: #1a1a1a;">Ready to accelerate beyond self-guided tools? Reply to this email to learn about personalized coaching engagements.</p>
            <p style="color: #666; font-size: 14px; margin-top: 32px;">— The Spartan Coaching Team</p>
          </div>
          <div style="padding: 16px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">You're receiving this because you subscribed to the Spartan Coaching newsletter.</p>
          </div>
          ${emailFooter()}
        </div>
      `,
    } as any);

    console.log(`Drip Day 3 email scheduled for ${email} at ${scheduledAt}`);
    return true;
  } catch (error) {
    console.error('Failed to schedule drip day 3 email:', error);
    return false;
  }
}

export async function sendDripDay7(email: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await sendEmail(client, {
      from: fromEmail,
      to: email,
      subject: 'One Week In: Keep the Momentum Going',
      scheduledAt,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin: 0 0 16px 0; line-height: 1.65; color: #1a1a1a;">One week in. If you've been using the tools, you're already ahead of most reps in your market. Here's where to go next:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              <tr>
                <td style="padding: 16px; border: 1px solid #e5e7eb; vertical-align: top;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a1a1a;">Test Your Knowledge</p>
                  <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5;">Take the 15-question Hospice Sales Knowledge Quiz. See how you score on eligibility, objections, compliance, and physician engagement.</p>
                  <a href="https://spartanhospicecoaching.com/quiz" style="color: #b91c1c; font-size: 14px; text-decoration: none; font-weight: bold;">Take the Quiz &rarr;</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px; border: 1px solid #e5e7eb; border-top: none; vertical-align: top;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a1a1a;">Read the Articles</p>
                  <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5;">Deep dives on territory strategy, physician relationships, compliance, and referral growth — drawn from real hospice sales coaching experience.</p>
                  <a href="https://spartanhospicecoaching.com/articles" style="color: #b91c1c; font-size: 14px; text-decoration: none; font-weight: bold;">Browse Articles &rarr;</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px; border: 1px solid #e5e7eb; border-top: none; vertical-align: top;">
                  <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a1a1a;">Calculate Your Revenue Potential</p>
                  <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.5;">Use the ROI Calculator to see what a 10–20% improvement in your admit rate is actually worth in annual Medicare revenue.</p>
                  <a href="https://spartanhospicecoaching.com/tools/roi-calculator" style="color: #b91c1c; font-size: 14px; text-decoration: none; font-weight: bold;">Run Your Numbers &rarr;</a>
                </td>
              </tr>
            </table>
            <p style="margin: 0 0 14px 0; line-height: 1.65; color: #1a1a1a;">If you'd like personalized coaching tailored to your team, territory, or specific challenges — <a href="https://spartanhospicecoaching.com/contact" style="color: #b91c1c;">reach out here</a>. We work directly with hospice sales professionals and their leadership teams.</p>
            <p style="color: #666; font-size: 14px; margin-top: 32px;">Stay disciplined. Stay empathetic. Stay strategic.<br/>— The Spartan Coaching Team</p>
          </div>
          <div style="padding: 16px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">You're receiving this because you subscribed to the Spartan Coaching newsletter.</p>
          </div>
          ${emailFooter()}
        </div>
      `,
    } as any);

    console.log(`Drip Day 7 email scheduled for ${email} at ${scheduledAt}`);
    return true;
  } catch (error) {
    console.error('Failed to schedule drip day 7 email:', error);
    return false;
  }
}

export async function sendPdfToUser(toEmail: string, toName: string, pdfBuffer: Buffer, filename: string, resourceTitle: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: `Your ${resourceTitle} — Spartan Coaching`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #111827;">
          ${emailHeader()}
          <div style="padding: 32px 24px;">
            <h2 style="margin: 0 0 16px; font-size: 20px;">Your resource is attached</h2>
            <p style="margin: 0 0 16px; line-height: 1.6;">Hi ${toName},</p>
            <p style="margin: 0 0 16px; line-height: 1.6;">Thanks for using Spartan Coaching's training tools. Your <strong>${resourceTitle}</strong> is attached to this email as a PDF — ready to save, print, or share with your team.</p>
            <p style="margin: 0 0 24px; line-height: 1.6;">Keep pushing forward. Discipline, empathy, and strategy win the day.</p>
            <p style="margin: 0 0 4px; font-weight: bold;">Nick Lynch</p>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Spartan Coaching | <a href="https://spartanhospicecoaching.com" style="color: #C8102E;">spartanhospicecoaching.com</a></p>
          </div>
          ${emailFooter()}
        </div>
      `,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    console.log(`[Resend] PDF "${resourceTitle}" sent to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[Resend] FAILED PDF send to ${toEmail} ("${resourceTitle}"):`, error?.message || error);
    return false;
  }
}

export async function sendAssessmentConfirmation(
  candidateEmail: string,
  candidateName: string,
  assessmentName: string,
  overallScore: number,
  quizScore: number | null,
  aiScore: number | null,
  feedback: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    let tier = "";
    let tierNote = "";
    try {
      const parsed = JSON.parse(feedback);
      tier = parsed.tier || "";
    } catch {}

    if (!tier) {
      tier = overallScore >= 85 ? "Strong Hire" : overallScore >= 70 ? "Solid Candidate" : overallScore >= 50 ? "Development Needed" : "Not Ready";
    }

    if (tier === "Strong Hire") {
      tierNote = "Excellent work. Your responses demonstrated strong alignment with the competencies we look for in top hospice sales representatives. Nick Lynch, our founder, will be reaching out to you shortly to discuss next steps.";
    } else if (tier === "Solid Candidate") {
      tierNote = "Solid performance. You showed real potential in key areas. Nick will review your results in detail and reach out to discuss opportunities and areas for continued growth.";
    } else if (tier === "Development Needed") {
      tierNote = "Thank you for your effort. Your results highlight some areas where further development would strengthen your candidacy. Nick may reach out to discuss coaching opportunities that could help accelerate your growth.";
    } else {
      tierNote = "Thank you for taking the time to complete this assessment. Nick will review your responses and may follow up with additional guidance or resources.";
    }

    await sendEmail(client, {
      from: fromEmail,
      to: candidateEmail,
      subject: `Your Assessment Results: ${assessmentName}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
          ${emailHeader()}
          <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
            <h1 style="color: #333; margin: 0 0 16px; font-size: 24px;">Assessment Results</h1>
            <p style="font-size: 16px; margin: 0 0 16px;">Hi ${candidateName},</p>
            <p style="margin: 0 0 24px; line-height: 1.6;">Thank you for completing the <strong>${assessmentName}</strong> assessment. Here is a summary of your results:</p>
            
            <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 0 0 24px;">
              <div style="text-align: center; margin-bottom: 16px;">
                <span style="font-size: 48px; font-weight: bold; color: #b91c1c;">${overallScore}%</span>
                <br/>
                <span style="display: inline-block; margin-top: 8px; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; color: #fff; background: ${overallScore >= 85 ? '#16a34a' : overallScore >= 70 ? '#2563eb' : overallScore >= 50 ? '#d97706' : '#dc2626'};">${tier}</span>
              </div>
              ${quizScore !== null ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Quiz Accuracy:</strong> ${quizScore}%</p>` : ""}
              ${aiScore !== null ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Scenario Response Score:</strong> ${aiScore}%</p>` : ""}
            </div>

            <p style="margin: 0 0 16px; line-height: 1.6;">${tierNote}</p>
            
          </div>
          ${emailFooter()}
        </div>
      `,
    });

    console.log(`[Resend] Assessment confirmation sent to ${candidateEmail}`);
    return true;
  } catch (error: any) {
    console.error(`[Resend] FAILED assessment confirmation to ${candidateEmail}:`, error?.message || error);
    return false;
  }
}

export async function sendSubmissionResultsToNick(
  submissionId: number,
  candidateName: string,
  candidateEmail: string,
  assessmentName: string,
  overallScore: number,
  quizScore: number | null,
  aiScore: number | null,
  feedback: string | null,
  aiScoringFailed: boolean = false
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'nick@spartanhospicecoaching.com';

    let tier = "";
    let fieldReadinessScore = "";
    let redFlagsHtml = "";
    let standoutHtml = "";
    let categoryHtml = "";
    let hiringRec = "";

    if (feedback && !aiScoringFailed) {
      try {
        const parsed = JSON.parse(feedback);
        tier = parsed.tier || "";
        fieldReadinessScore = parsed.fieldReadinessScore != null ? `${parsed.fieldReadinessScore}/100` : "";

        if (parsed.redFlags?.length > 0) {
          redFlagsHtml = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #dc2626; font-size: 13px;">RED FLAGS</p>
              ${parsed.redFlags.map((f: string) => `<p style="margin: 4px 0; font-size: 14px; color: #7f1d1d;">${f}</p>`).join('')}
            </div>`;
        }

        if (parsed.standoutQualities?.length > 0) {
          standoutHtml = `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #16a34a; font-size: 13px;">STANDOUT QUALITIES</p>
              ${parsed.standoutQualities.map((s: string) => `<p style="margin: 4px 0; font-size: 14px; color: #14532d;">${s}</p>`).join('')}
            </div>`;
        }

        if (parsed.categoryScores) {
          const cs = parsed.categoryScores;
          categoryHtml = `
            <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
              <tr><td style="padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #e5e7eb;">Hospice Knowledge</td><td style="padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${cs.hospiceKnowledge ?? '—'}/25</td></tr>
              <tr><td style="padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #e5e7eb;">Relationship Selling</td><td style="padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${cs.relationshipSelling ?? '—'}/25</td></tr>
              <tr><td style="padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #e5e7eb;">Empathy & Communication</td><td style="padding: 6px 8px; font-size: 13px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${cs.empathyCommunication ?? '—'}/25</td></tr>
              <tr><td style="padding: 6px 8px; font-size: 13px;">Strategic Execution</td><td style="padding: 6px 8px; font-size: 13px; text-align: right; font-weight: bold;">${cs.strategicExecution ?? '—'}/25</td></tr>
            </table>`;
        }

        if (parsed.hiringRecommendation) {
          hiringRec = `
            <div style="background: #f9fafb; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
              <p style="margin: 0 0 6px; font-weight: bold; font-size: 13px; color: #374151;">HIRING RECOMMENDATION</p>
              <p style="margin: 0; font-size: 14px; color: #1f2937; line-height: 1.5;">${parsed.hiringRecommendation}</p>
            </div>`;
        }
      } catch {}
    }

    if (!tier) {
      tier = overallScore >= 85 ? "Strong Hire" : overallScore >= 70 ? "Solid Candidate" : overallScore >= 50 ? "Development Needed" : "Not Ready";
    }

    const tierColor = tier === "Strong Hire" ? "#16a34a" : tier === "Solid Candidate" ? "#2563eb" : tier === "Development Needed" ? "#d97706" : "#dc2626";

    const siteUrl = getSiteUrl();
    const pdfLink = `${siteUrl}/assessment-results/${submissionId}`;

    const subjectLine = aiScoringFailed
      ? `[SCORING PENDING] New Assessment: ${candidateName} — Quiz ${quizScore ?? 0}%`
      : `New Assessment: ${candidateName} — ${tier} (${overallScore}%)`;

    await sendEmail(client, {
      from: fromEmail,
      to: adminEmail,
      subject: subjectLine,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
          ${emailHeader()}
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="margin: 0 0 16px; font-size: 20px;">New Assessment Submission</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; width: 40%;">Candidate</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${candidateName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${candidateEmail}" style="color: #b91c1c;">${candidateEmail}</a></td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Assessment</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${assessmentName}</td></tr>
            </table>

            ${aiScoringFailed ? `
              <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 13px;">AI SCORING UNAVAILABLE</p>
                <p style="margin: 6px 0 0; font-size: 14px; color: #78350f;">AI scoring failed for this submission. Quiz score is available below. Please review scenario responses manually in the admin panel.</p>
              </div>
            ` : ''}

            <div style="text-align: center; padding: 20px 0;">
              <span style="font-size: 42px; font-weight: bold; color: #b91c1c;">${overallScore}%</span>
              <br/>
              <span style="display: inline-block; margin-top: 8px; padding: 5px 20px; border-radius: 20px; font-size: 14px; font-weight: bold; color: #fff; background: ${tierColor};">${tier}</span>
              ${fieldReadinessScore ? `<br/><span style="font-size: 12px; color: #6b7280; margin-top: 6px; display: inline-block;">Field Readiness: ${fieldReadinessScore}</span>` : ''}
            </div>

            ${quizScore !== null ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Quiz:</strong> ${quizScore}%</p>` : ''}
            ${aiScore !== null ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Scenario:</strong> ${aiScore}%</p>` : ''}

            ${categoryHtml}
            ${standoutHtml}
            ${redFlagsHtml}
            ${hiringRec}

            <div style="text-align: center; margin: 24px 0 8px;">
              <a href="${pdfLink}" style="display: inline-block; background: #b91c1c; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Full Results</a>
            </div>
          </div>
          ${emailFooter()}
        </div>
      `,
    });

    console.log(`[Resend] Admin notification sent for submission #${submissionId} (${candidateName})`);
    return true;
  } catch (error: any) {
    console.error(`[Resend] FAILED admin notification for submission #${submissionId}:`, error?.message || error);
    return false;
  }
}

export async function sendSigningRequest(
  toEmail: string,
  recipientName: string,
  documentTypes: string[],
  signingUrl: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const docList = documentTypes.map(d => `<li style="padding: 4px 0; color: #333;">${d}</li>`).join('');

    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: `Action Required: Agreement Signing Request — Spartan Coaching`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 32px 24px; background: #ffffff;">
            <h2 style="color: #1a1a1a; margin-top: 0;">Agreement Signing Request</h2>
            <p style="color: #555; line-height: 1.6;">Hi ${recipientName},</p>
            <p style="color: #555; line-height: 1.6;">You have been requested to review and sign the following agreement(s):</p>
            <ul style="margin: 16px 0; padding-left: 20px;">${docList}</ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${signingUrl}" style="display: inline-block; background: #b91c1c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Review & Sign Documents</a>
            </div>
            <p style="color: #888; font-size: 13px; line-height: 1.5;">This link is unique to you. Please do not forward it to others. If you have questions, contact Spartan Coaching directly.</p>
          </div>
          ${emailFooter()}
        </div>
      `,
    });

    console.log(`Signing request email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send signing request:', error);
    return false;
  }
}

export async function sendSignedAgreementPdf(
  toEmail: string,
  signerName: string,
  agreementType: string,
  pdfBuffer: Buffer,
  filename: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'nick@spartanhospicecoaching.com';

    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        ${emailHeader()}
        <div style="padding: 32px 24px; background: #ffffff;">
          <h2 style="color: #1a1a1a; margin-top: 0;">Signed Agreement</h2>
          <h3 style="color: #333;">${agreementType}</h3>
          <p style="color: #555; line-height: 1.6;">A signed copy of the <strong>${agreementType}</strong> is attached to this email as a PDF. Please retain it for your records.</p>
          <p style="color: #555; line-height: 1.6;">Signed by: <strong>${signerName}</strong></p>
          <p style="color: #555; line-height: 1.6;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${emailFooter()}
      </div>
    `;

    await Promise.all([
      sendEmail(client, {
        from: fromEmail,
        to: toEmail,
        subject: `Signed Agreement: ${agreementType} — Spartan Coaching`,
        html: htmlContent,
        attachments: [{ filename, content: pdfBuffer }],
      }),
      sendEmail(client, {
        from: fromEmail,
        to: adminEmail,
        subject: `Agreement Signed: ${agreementType} by ${signerName}`,
        html: htmlContent,
        attachments: [{ filename, content: pdfBuffer }],
      }),
    ]);

    console.log(`Signed agreement PDF emailed to ${toEmail} and admin`);
    return true;
  } catch (error) {
    console.error('Failed to send signed agreement PDF:', error);
    return false;
  }
}

export async function sendAssessmentInvite(
  toEmail: string,
  toName: string,
  assessmentName: string,
  assessmentUrl: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: `You've Been Invited: ${assessmentName} — Spartan Coaching`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #111827;">
          ${emailHeader()}
          <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin: 0 0 16px; line-height: 1.6;">Hi ${toName},</p>
            <p style="margin: 0 0 16px; line-height: 1.6;">You have been invited to complete the <strong>${assessmentName}</strong> assessment by Nick Lynch at Spartan Coaching.</p>
            <p style="margin: 0 0 24px; line-height: 1.6;">This assessment evaluates your hospice sales knowledge, scenario handling, and strategic thinking. It typically takes 15-20 minutes to complete.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${assessmentUrl}" style="display: inline-block; background: #b91c1c; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Start Assessment</a>
            </div>
            <p style="margin: 0 0 16px; line-height: 1.6; color: #555; font-size: 14px;">This link is unique to you. Your name and email are already pre-filled — just click the button above to begin.</p>
            <p style="margin: 0 0 4px; font-weight: bold;">Nick Lynch</p>
            <p style="margin: 0; color: #555; font-size: 14px;">Founder, Spartan Coaching</p>
          </div>
          ${emailFooter()}
        </div>
      `,
    });

    console.log(`Assessment invite email sent to ${toName} <${toEmail}> for "${assessmentName}"`);
    return true;
  } catch (error) {
    console.error(`Failed to send assessment invite to ${toEmail}:`, error);
    return false;
  }
}

export async function sendGeneratedEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    await sendEmail(client, {
      from: fromEmail,
      to,
      subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          ${emailHeader()}
          <div style="padding: 32px 24px;">
            ${body.split('\n').map(line => line.trim() ? `<p style="margin: 8px 0; line-height: 1.6;">${line}</p>` : '<br/>').join('\n')}
          </div>
          ${emailFooter()}
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

// ── Field Kit access emails ──────────────────────────────────────────

function authEmailShell(inner: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #111827;">
      ${emailHeader()}
      <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
        ${inner}
      </div>
      ${emailFooter()}
    </div>
  `;
}

export async function sendAccessRequestReceived(toEmail: string, toName: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "We received your Field Kit access request — Spartan Coaching",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Thank you for requesting evaluation access to the Spartan Field Kit. Every request is reviewed personally — this is not an automated checkout.</p>
        <p style="margin:0 0 12px;line-height:1.6;"><strong>What happens next:</strong></p>
        <ol style="margin:0 0 16px;padding-left:20px;line-height:1.7;color:#374151;">
          <li>We review your request (usually within one business day).</li>
          <li>If approved, you get a secure email to set your password.</li>
          <li>Your timed evaluation starts (typically 24h individual / 72h company).</li>
          <li>After the window: individuals can continue for $14.99/week from Account (cancel anytime); teams continue under a provider contract.</li>
        </ol>
        <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#555;"><strong>Reminder:</strong> Field Kit tools are for planning and messaging only. Never enter patient names, MRNs, or other PHI.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/faq" style="display:inline-block;background:#111827;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Read FAQ</a>
          <a href="${siteUrl}/contact" style="display:inline-block;background:#b91c1c;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Book a strategy call</a>
        </div>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send access request received email:", error);
    return false;
  }
}

export async function sendAccessRequestAdminAlert(data: {
  name: string;
  email: string;
  type: string;
  companyName?: string | null;
  role?: string | null;
  primaryGoal?: string | null;
  seatsRequested?: number | null;
  message?: string | null;
}): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const notificationEmail = process.env.NOTIFICATION_EMAIL || fromEmail;
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: notificationEmail,
      subject: `[Access Request] ${data.name} — ${data.type}`,
      html: authEmailShell(`
        <h2 style="margin-top:0;">New Field Kit Access Request</h2>
        <table style="border-collapse:collapse;width:100%;">
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Type</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.type}</td></tr>
          ${data.companyName ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.companyName}</td></tr>` : ""}
          ${data.role ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Role</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.role}</td></tr>` : ""}
          ${data.primaryGoal ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Goal</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.primaryGoal}</td></tr>` : ""}
          ${data.seatsRequested ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Seats</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.seatsRequested}</td></tr>` : ""}
        </table>
        ${data.message ? `<h3>Message</h3><p style="background:#f9f9f9;padding:16px;border-radius:8px;white-space:pre-wrap;">${data.message}</p>` : ""}
        <p style="margin-top:24px;"><a href="${siteUrl}/admin/access-desk" style="color:#b91c1c;">Open Access Desk</a></p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send access request admin alert:", error);
    return false;
  }
}

export async function sendAccessApprovedEmail(
  toEmail: string,
  toName: string,
  setPasswordUrl: string,
  trialHours: number,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Your Field Kit evaluation is approved — set password to start",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Your Field Kit evaluation access is approved.</p>
        <p style="margin:0 0 16px;line-height:1.6;">You have a <strong>${trialHours}-hour evaluation window</strong> after you set your password. Use real field scenarios — one tough objection, this week's plan, and a role-play on your hardest conversation.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${setPasswordUrl}" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">Set password &amp; enter Field Kit</a>
        </div>
        <p style="margin:0 0 12px;line-height:1.6;font-size:14px;color:#555;"><strong>Quick start once inside:</strong></p>
        <ol style="margin:0 0 16px;padding-left:20px;line-height:1.7;color:#374151;font-size:14px;">
          <li>Complete the short onboarding checklist on your Field Kit home.</li>
          <li>Open Tools and run one workflow you would use this week.</li>
          <li>Book a debrief so we can turn what you saw into a clear membership next step.</li>
        </ol>
        <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#555;">This set-password link expires in 48 hours. If it expires, reply to this email and we will send a new one. <strong>Never enter PHI</strong> into any tool.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${siteUrl}/contact" style="color:#b91c1c;font-weight:bold;text-decoration:none;">Book a strategy / debrief call →</a>
        </div>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send access approved email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  toName: string,
  resetUrl: string,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Reset your Spartan Field Kit password",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">We received a request to reset your password. Use the button below within one hour.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">Reset Password</a>
        </div>
        <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#555;">If you did not request this, you can ignore this email.</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export async function sendOrgInviteEmail(
  toEmail: string,
  orgName: string,
  setPasswordUrl: string,
  inviterName: string,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: `You're invited to the ${orgName} Field Kit — Spartan Coaching`,
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hello,</p>
        <p style="margin:0 0 16px;line-height:1.6;"><strong>${inviterName}</strong> has invited you to the Spartan Field Kit for <strong>${orgName}</strong>.</p>
        <p style="margin:0 0 16px;line-height:1.6;">Set your password to join your team's private toolkit for hospice growth execution.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${setPasswordUrl}" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">Accept Invite &amp; Set Password</a>
        </div>
        <p style="margin:0;color:#555;font-size:14px;">This invite expires in 7 days.</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send org invite email:", error);
    return false;
  }
}

export async function sendTrialMidpointEmail(
  toEmail: string,
  toName: string,
  hoursLeft: number,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    const hoursLabel =
      hoursLeft < 1
        ? "less than an hour"
        : `about ${Math.max(1, Math.round(hoursLeft))} hour${Math.round(hoursLeft) === 1 ? "" : "s"}`;
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Your Field Kit evaluation window is winding down — Spartan Coaching",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">You have <strong>${hoursLabel}</strong> left in your Field Kit evaluation.</p>
        <p style="margin:0 0 16px;line-height:1.6;">If you have not already: run one real objection, build this week's plan, and try a role-play on your toughest scenario. Then book a short debrief so we can turn what you are seeing into a clear next step.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/portal" style="display:inline-block;background:#b91c1c;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Open Field Kit</a>
          <a href="${siteUrl}/contact" style="display:inline-block;background:#111827;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Book a debrief call</a>
        </div>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send trial midpoint email:", error);
    return false;
  }
}

export async function sendTrialExpiredEmail(
  toEmail: string,
  toName: string,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Your Field Kit evaluation ended — clear next steps",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Your Field Kit evaluation window has ended. Thank you for running real scenarios through the tools.</p>
        <p style="margin:0 0 12px;line-height:1.6;"><strong>Clear next steps:</strong></p>
        <ul style="margin:0 0 16px;padding-left:20px;line-height:1.7;">
          <li><strong>Continue as a client</strong> — book a short debrief; we agree seats, coaching, and terms, then activate offline.</li>
          <li><strong>Need more evaluation time</strong> — sign in and request an extension, or reply to this email.</li>
          <li><strong>Coaching without tools first</strong> — we can still help on a strategy call.</li>
        </ul>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/contact?service=Field+Kit+Membership" style="display:inline-block;background:#b91c1c;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Book a debrief</a>
          <a href="${siteUrl}/field-kit-membership" style="display:inline-block;background:#111827;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Membership path</a>
        </div>
        <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#555;">Your login still works for account info — tools stay gated until access is active again.</p>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send trial expired email:", error);
    return false;
  }
}

export async function sendMagicLinkEmail(
  toEmail: string,
  toName: string,
  magicUrl: string,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Your Spartan Field Kit sign-in link",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Use this secure link to sign in to your Field Kit. It expires in one hour and can only be used once.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${magicUrl}" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">Sign in to Field Kit</a>
        </div>
        <p style="margin:0;color:#555;font-size:14px;">If you did not request this, you can ignore this email.</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    return false;
  }
}

export async function sendAccessRejectedEmail(
  toEmail: string,
  toName: string,
  note?: string | null,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Update on your Field Kit access request — Spartan Coaching",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Thank you for your interest in the Spartan Field Kit. We are not able to open evaluation access at this time.</p>
        ${note ? `<p style="margin:0 0 16px;line-height:1.6;background:#f9fafb;padding:12px;border-left:3px solid #b91c1c;border-radius:4px;">${note}</p>` : ""}
        <p style="margin:0 0 16px;line-height:1.6;">That does not mean we cannot help. Many teams start with a strategy conversation on coaching, territory systems, or leadership rhythms — then revisit tools when the fit is clear.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/contact" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Book a strategy call</a>
          <a href="${siteUrl}/services" style="display:inline-block;background:#111827;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">View services</a>
        </div>
        <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#555;">You are welcome to request access again later if your situation changes.</p>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send access rejected email:", error);
    return false;
  }
}

/** Sent when Nick activates paid / ongoing client access (org status → active). */
export async function sendMembershipActivatedEmail(
  toEmail: string,
  toName: string,
  orgName: string,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Your Spartan Field Kit membership is active",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Your Field Kit access for <strong>${orgName}</strong> is now <strong>active</strong> as a continuing client — not a timed evaluation.</p>
        <p style="margin:0 0 16px;line-height:1.6;">Sign in anytime, run your weekly workflows, and reach out when you want coaching, more seats, or a leadership debrief.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/login" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Sign in to Field Kit</a>
          <a href="${siteUrl}/portal" style="display:inline-block;background:#111827;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;margin:4px;">Open portal</a>
        </div>
        <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#555;">Billing and seat changes stay human: reply here or book a call. Never enter PHI into tools.</p>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send membership activated email:", error);
    return false;
  }
}

/** Daily ops snapshot for Nick (pending, follow-ups, trials, billing). */
export async function sendOpsDigestEmail(
  toEmail: string,
  snapshot: {
    pendingRequests: number;
    followUpsDue: number;
    inTrial: number;
    trialsEndingSoon4h: number;
    expired: number;
    won: number;
    toolUsesLast7Days: number;
    billingPastDue?: number;
    billingCanceled?: number;
    billingActivePaid?: number;
  },
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    const pastDue = snapshot.billingPastDue ?? 0;
    const canceled = snapshot.billingCanceled ?? 0;
    const hot =
      snapshot.pendingRequests > 0 ||
      snapshot.followUpsDue > 0 ||
      snapshot.trialsEndingSoon4h > 0 ||
      pastDue > 0;
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: hot
        ? `[Action] Spartan ops — ${snapshot.pendingRequests} pending · ${pastDue} past due`
        : `Spartan ops digest — quiet day`,
      html: authEmailShell(`
        <h2 style="margin:0 0 16px;">Access Desk snapshot</h2>
        <p style="margin:0 0 16px;line-height:1.6;color:#555;font-size:14px;">
          Generated ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}.
        </p>
        <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Pending access requests</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.pendingRequests}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Follow-ups due</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.followUpsDue}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">In trial</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.inTrial}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Trials ending ≤4h</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.trialsEndingSoon4h}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Expired access</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.expired}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Won clients</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.won}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Paid active (billing)</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.billingActivePaid ?? 0}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;color:#b91c1c;">Billing past due</td><td style="padding:8px;border-bottom:1px solid #eee;color:#b91c1c;">${pastDue}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Billing canceled</td><td style="padding:8px;border-bottom:1px solid #eee;">${canceled}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Tool uses (7d)</td><td style="padding:8px;border-bottom:1px solid #eee;">${snapshot.toolUsesLast7Days}</td></tr>
        </table>
        <div style="text-align:center;margin:24px 0;">
          <a href="${siteUrl}/admin/access-desk" style="display:inline-block;background:#b91c1c;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Access Desk</a>
        </div>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send ops digest email:", error);
    return false;
  }
}

/** Member: payment failed — update card via Account → Manage billing. */
export async function sendBillingPaymentFailedEmail(
  toEmail: string,
  toName: string,
  orgName: string,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: "Action needed: Field Kit payment failed",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">We could not process the latest payment for <strong>${orgName}</strong> Field Kit access. Tools may be locked until billing is updated.</p>
        <p style="margin:0 0 16px;line-height:1.6;">Update your payment method under <strong>Account → Manage billing</strong>. If you already fixed this, you can ignore this message.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/account" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Account</a>
        </div>
        <p style="margin:0 0 16px;line-height:1.6;font-size:14px;color:#555;">Need help? Reply to this email or book a call. Never enter PHI into tools.</p>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send payment failed email:", error);
    return false;
  }
}

/** Member: subscription canceled (immediate or at period end). */
export async function sendBillingCanceledEmail(
  toEmail: string,
  toName: string,
  orgName: string,
  opts: { atPeriodEnd?: boolean; periodEnd?: Date | null },
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    const periodLabel = opts.periodEnd
      ? opts.periodEnd.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;
    const body = opts.atPeriodEnd
      ? `<p style="margin:0 0 16px;line-height:1.6;">Your Field Kit subscription for <strong>${orgName}</strong> is set to <strong>cancel at period end</strong>${periodLabel ? ` (${periodLabel})` : ""}. You keep access until then. You can reverse the cancel in Account → Manage billing before that date.</p>`
      : `<p style="margin:0 0 16px;line-height:1.6;">Your Field Kit subscription for <strong>${orgName}</strong> has been <strong>canceled</strong>. Tools are locked. You can re-subscribe anytime from Account (individuals $14.99/week) or contact us for team contracts.</p>`;
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: opts.atPeriodEnd
        ? "Field Kit: cancellation scheduled"
        : "Field Kit subscription canceled",
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        ${body}
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/account" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Manage membership</a>
        </div>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send billing canceled email:", error);
    return false;
  }
}

/** Admin: past-due org needs attention. */
export async function sendBillingPastDueAdminAlert(
  toEmail: string,
  data: {
    orgId: number;
    orgName: string;
    billingPlan?: string | null;
    billingStatus?: string | null;
    memberEmails: string[];
  },
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: `[Billing] Past due — ${data.orgName}`,
      html: authEmailShell(`
        <h2 style="margin:0 0 16px;">Payment failed / past due</h2>
        <p style="margin:0 0 12px;line-height:1.6;"><strong>${data.orgName}</strong> (org #${data.orgId})</p>
        <p style="margin:0 0 8px;font-size:14px;color:#555;">Plan: ${data.billingPlan || "—"} · Status: ${data.billingStatus || "past_due"}</p>
        <p style="margin:0 0 16px;font-size:14px;color:#555;">Members: ${data.memberEmails.join(", ") || "—"}</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${siteUrl}/admin/access-desk" style="display:inline-block;background:#b91c1c;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Access Desk</a>
        </div>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send past-due admin alert:", error);
    return false;
  }
}

/** Optional notice when trial is extended from Access Desk. */
export async function sendTrialExtendedEmail(
  toEmail: string,
  toName: string,
  hoursAdded: number,
  trialEndsAt: Date,
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const siteUrl = getSiteUrl();
    const endsLabel = trialEndsAt.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    await sendEmail(client, {
      from: fromEmail,
      to: toEmail,
      subject: `Field Kit evaluation extended (+${hoursAdded}h) — Spartan Coaching`,
      html: authEmailShell(`
        <p style="margin:0 0 16px;line-height:1.6;">Hi ${toName},</p>
        <p style="margin:0 0 16px;line-height:1.6;">Your Field Kit evaluation has been extended by <strong>${hoursAdded} hour${hoursAdded === 1 ? "" : "s"}</strong>.</p>
        <p style="margin:0 0 16px;line-height:1.6;">New window end: <strong>${endsLabel}</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${siteUrl}/login" style="display:inline-block;background:#b91c1c;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Continue in Field Kit</a>
        </div>
        <p style="margin:0 0 4px;font-weight:bold;">Nick Lynch</p>
        <p style="margin:0;color:#555;font-size:14px;">Founder, Spartan Coaching</p>
      `),
    });
    return true;
  } catch (error) {
    console.error("Failed to send trial extended email:", error);
    return false;
  }
}
