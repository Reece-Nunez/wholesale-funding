import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import * as Sentry from '@sentry/nextjs';

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

function sanitizeString(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY not configured, skipping verification');
    return { success: true };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data: RecaptchaResponse = await response.json();

    if (data.success && data.score !== undefined) {
      return { success: data.score >= 0.5, score: data.score };
    }

    return { success: data.success };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, company, message, recaptchaToken } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaResult.success) {
        return NextResponse.json(
          { error: 'Security verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // Sanitize inputs
    const safe = {
      firstName: sanitizeString(firstName),
      lastName: sanitizeString(lastName),
      email: sanitizeString(email),
      phone: sanitizeString(phone || ''),
      company: sanitizeString(company || ''),
      message: sanitizeString(message),
    };

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      Sentry.captureMessage('RESEND_API_KEY not configured for contact form', { level: 'error' });
      return NextResponse.json(
        { error: 'Email service is not configured. Please try again later.' },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: 'Wholesale Funding Solutions <noreply@wholesalefundingsolutions.com>',
      to: ['info@wholesalefundingsolutions.com'],
      replyTo: safe.email,
      subject: `[WFS Contact] New inquiry from ${safe.firstName} ${safe.lastName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f8fafc; }
    .container { background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; padding: 24px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; font-size: 20px; font-weight: bold; }
    .accent-bar { background-color: #2aafab; height: 4px; }
    .content { padding: 30px; }
    .field { margin-bottom: 16px; }
    .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { color: #1a1a2e; font-size: 15px; margin-top: 4px; }
    .message-box { background-color: #f8fafc; border-left: 3px solid #2aafab; padding: 16px; margin-top: 8px; border-radius: 0 4px 4px 0; }
    .footer { text-align: center; padding: 16px; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">New Contact Form Inquiry</div>
    <div class="accent-bar"></div>
    <div class="content">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${safe.firstName} ${safe.lastName}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${safe.email}">${safe.email}</a></div>
      </div>
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${safe.phone || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="label">Company</div>
        <div class="value">${safe.company || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="label">Message</div>
        <div class="message-box">${safe.message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">
      Sent from wholesalefundingsolutions.com contact form
    </div>
  </div>
</body>
</html>`,
    });

    if (error) {
      Sentry.captureException(error, {
        tags: { feature: 'contact-form' },
        extra: { email: safe.email, name: `${safe.firstName} ${safe.lastName}` },
      });
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    Sentry.captureException(error, { tags: { feature: 'contact-form' } });
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
