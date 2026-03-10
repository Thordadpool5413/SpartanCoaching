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
  return { apiKey: connectionSettings.settings.api_key, fromEmail: process.env.RESEND_FROM_EMAIL || connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  console.log('Resend fromEmail configured as:', fromEmail);
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
    
    await sendEmail(client, {
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
    
    await sendEmail(client, {
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
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'nick@spartanhospicecoaching.com';
    
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

export async function sendResourceLeadNotification(name: string, email: string, resourceTitle: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'nick@spartanhospicecoaching.com';

    await sendEmail(client, {
      from: fromEmail,
      to: adminEmail,
      subject: `New Resource Download: ${resourceTitle}`,
      html: `
        <h2>New Resource Download</h2>
        <p>Someone entered their information to download a training resource.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Resource</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${resourceTitle}</td></tr>
        </table>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">This notification was sent from the Spartan Coaching resource library.</p>
      `,
    });

    console.log(`Resource lead notification sent for ${name} (${resourceTitle})`);
    return true;
  } catch (error) {
    console.error('Failed to send resource lead notification:', error);
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
        <h2>New Newsletter Subscriber</h2>
        <p>Someone subscribed to the Spartan Coaching weekly newsletter.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
        </table>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
        <p style="color: #888; font-size: 12px;">This notification was sent from the Spartan Coaching newsletter signup.</p>
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
            <div style="background: #b91c1c; padding: 20px 24px; margin-bottom: 0;">
              <h2 style="color: white; margin: 0; font-size: 20px; letter-spacing: 0.5px;">Spartan Coaching</h2>
            </div>
            <div style="padding: 32px 24px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
              ${body.split('\n').map(line => line.trim() ? `<p style="margin: 0 0 14px 0; line-height: 1.65; color: #1a1a1a;">${line}</p>` : '<br/>').join('\n')}
            </div>
            <div style="padding: 16px 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this because you subscribed to the Spartan Coaching newsletter.<br/>
                Spartan Coaching &mdash; The Authority in Hospice Sales Excellence
              </p>
            </div>
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
          <div style="background: #b91c1c; padding: 20px 24px;">
            <h2 style="color: white; margin: 0; font-size: 20px; letter-spacing: 0.5px;">Spartan Coaching</h2>
          </div>
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
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">You're receiving this because you subscribed to the Spartan Coaching newsletter.<br/>Spartan Coaching &mdash; The Authority in Hospice Sales Excellence</p>
          </div>
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
          <div style="background: #b91c1c; padding: 20px 24px;">
            <h2 style="color: white; margin: 0; font-size: 20px; letter-spacing: 0.5px;">Spartan Coaching</h2>
          </div>
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
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">You're receiving this because you subscribed to the Spartan Coaching newsletter.<br/>Spartan Coaching &mdash; The Authority in Hospice Sales Excellence</p>
          </div>
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
          <div style="border-bottom: 3px solid #C8102E; padding-bottom: 16px; margin-bottom: 24px;">
            <p style="color: #C8102E; font-weight: bold; font-size: 13px; margin: 0 0 4px;">SPARTAN COACHING</p>
            <h2 style="margin: 0; font-size: 20px;">Your resource is attached</h2>
          </div>
          <p style="margin: 0 0 16px; line-height: 1.6;">Hi ${toName},</p>
          <p style="margin: 0 0 16px; line-height: 1.6;">Thanks for using Spartan Coaching's training tools. Your <strong>${resourceTitle}</strong> is attached to this email as a PDF — ready to save, print, or share with your team.</p>
          <p style="margin: 0 0 24px; line-height: 1.6;">Keep pushing forward. Discipline, empathy, and strategy win the day.</p>
          <p style="margin: 0 0 4px; font-weight: bold;">Nick Lynch</p>
          <p style="margin: 0; color: #6b7280; font-size: 13px;">Spartan Coaching | <a href="https://spartanhospicecoaching.com" style="color: #C8102E;">spartanhospicecoaching.com</a></p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
          <p style="color: #9ca3af; font-size: 11px; margin-top: 16px;">This resource is for training purposes only. Not for resale. &copy; ${new Date().getFullYear()} Spartan Coaching.</p>
        </div>
      `,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    console.log(`PDF emailed to ${toEmail} (${resourceTitle})`);
    return true;
  } catch (error) {
    console.error('Failed to send PDF to user:', error);
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
