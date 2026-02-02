import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/app/db';
import { contactMessages, siteSettings } from '@/app/db/schema';
import { getLogoImageSrc } from '@/app/lib/resolve-image-src';
import { checkRateLimit, getRateLimitKey } from '@/app/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request, 'contact');
    const rate = checkRateLimit(key, CONTACT_LIMIT, CONTACT_WINDOW_MS);
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again in a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await request.json();
    const { name, email, contactNo, message, projectId, projectTitle, wantsDemo, demoMonth, demoDay, demoYear, demoTime } = body;

    if (!name || !email || !contactNo || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    
    if (wantsDemo) {
      if (!demoMonth || !demoDay || !demoYear || !demoTime) {
        return NextResponse.json(
          { error: 'All demo date and time fields are required when requesting a demo' },
          { status: 400 }
        );
      }
    }

    
    const digitsOnly = contactNo.replace(/\D/g, '');
    if (digitsOnly.length !== 11) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      );
    }
    if (!digitsOnly.startsWith('09')) {
      return NextResponse.json(
        { error: 'Phone number must start with 09' },
        { status: 400 }
      );
    }

    await db.insert(contactMessages).values({
      name,
      email,
      contactNo,
      message,
      projectId: projectId ?? null,
      projectTitle: projectTitle ?? null,
      wantsDemo: wantsDemo ?? false,
      demoMonth: wantsDemo ? demoMonth : null,
      demoDay: wantsDemo ? demoDay : null,
      demoYear: wantsDemo ? demoYear : null,
      demoTime: wantsDemo ? demoTime : null,
      status: 'new',
    });

    
    const [settings] = await db.select().from(siteSettings).limit(1);
    const forwardTo = settings?.contactForwardEmail || settings?.companyEmail || process.env.EMAIL_USER;
    const senderUser = process.env.EMAIL_USER || settings?.companyEmail;
    const senderPass = process.env.EMAIL_APP_PASSWORD || process.env.APP_PASSWORD;
    const senderFrom = (() => {
      const fromEnv = process.env.EMAIL_FROM;
      
      if (fromEnv) {
        return fromEnv.includes('@')
          ? (fromEnv.includes('<') ? fromEnv : `${fromEnv} <${senderUser}>`)
          : `${fromEnv} <${senderUser}>`;
      }
      return `iSynergies Contact <${senderUser}>`;
    })();
    const baseUrl = (() => {
      const originHdr = request.headers.get('origin');
      if (originHdr) return originHdr;
      const host = request.headers.get('host');
      if (host) return `https://${host}`;
      if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
      if (process.env.BASE_URL) return process.env.BASE_URL;
      return '';
    })();

    const logoPath = getLogoImageSrc(settings?.logoImage ?? null);
    const logoUrl = !logoPath
      ? null
      : /^https?:\/\//.test(logoPath)
        ? logoPath
        : baseUrl
          ? `${baseUrl}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`
          : logoPath.startsWith('/')
            ? logoPath
            : `/${logoPath}`;

    if (!forwardTo || !senderUser || !senderPass) {
      console.warn('Email configuration missing: ensure EMAIL_USER and EMAIL_APP_PASSWORD/APP_PASSWORD are set.');
    } else {
      const transporter = process.env.SMTP_HOST
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: senderUser,
              pass: senderPass,
            },
          })
        : nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: senderUser,
              pass: senderPass,
            },
          });

      const subject = `New contact message from ${name}`;
      const safe = (s: string) =>
        String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

      const brand = settings?.companyName || 'iSynergies Inc.';
      const primary = '#0D1E66';
      const bg = '#F3F4F6';
      const text = '#111827';
      const muted = '#6B7280';
      const cardBorder = '#E5E7EB';

      const html = `
<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safe(brand)} — Contact Form</title>
  </head>
  <body style="margin:0;padding:0;background:${bg};font-family:Arial,Helvetica,sans-serif;color:${text};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid ${cardBorder};border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:18px 22px;background:${primary};color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:12px;letter-spacing:1.6px;text-transform:uppercase;opacity:.9;">New message</div>
                      <div style="margin-top:4px;font-size:20px;font-weight:700;line-height:1.25;">Contact Form Submission</div>
                      <div style="margin-top:6px;font-size:13px;opacity:.9;">${safe(brand)}</div>
                    </td>
                    ${
                      logoUrl
                        ? `<td align="right" style="vertical-align:middle;">
                            <img src="${safe(logoUrl)}" alt="${safe(brand)} logo" style="max-height:46px; max-width:160px; display:block; border-radius:6px; background: rgba(255,255,255,0.08); padding:6px 8px;" />
                          </td>`
                        : ''
                    }
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 22px 4px 22px;">
                <div style="font-size:14px;color:${muted};line-height:1.6;">
                  You received a new message from your website contact form. Details are below.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 22px 0 22px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${cardBorder};border-radius:12px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:12px;color:${muted};text-transform:uppercase;letter-spacing:1px;">From</div>
                      <div style="margin-top:2px;font-size:16px;font-weight:700;">${safe(name)}</div>
                      <div style="margin-top:6px;font-size:14px;color:${text};">
                        <span style="color:${muted};">Email:</span>
                        <a href="mailto:${safe(email)}" style="color:${primary};text-decoration:none;font-weight:600;">${safe(email)}</a>
                      </div>
                      <div style="margin-top:6px;font-size:14px;color:${text};">
                        <span style="color:${muted};">Contact No.:</span> <span style="font-weight:600;">${safe(contactNo)}</span>
                      </div>
                      ${
                        projectTitle
                          ? `<div style="margin-top:6px;font-size:14px;color:${text};"><span style="color:${muted};">Project:</span> <span style="font-weight:600;">${safe(projectTitle)}</span></div>`
                          : ''
                      }
                      ${
                        wantsDemo
                          ? `<div style="margin-top:6px;font-size:14px;color:${text};"><span style="color:${muted};">Demo Request:</span> <span style="font-weight:600;">Yes</span></div>
                             <div style="margin-top:6px;font-size:14px;color:${text};"><span style="color:${muted};">Preferred Date:</span> <span style="font-weight:600;">${safe(demoMonth || '')}/${safe(demoDay || '')}/${safe(demoYear || '')} at ${safe(demoTime || '')}</span></div>`
                          : ''
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 22px 0 22px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${cardBorder};border-radius:12px;background:#ffffff;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <div style="font-size:12px;color:${muted};text-transform:uppercase;letter-spacing:1px;">Message</div>
                      <div style="margin-top:8px;font-size:14px;line-height:1.7;color:${text};white-space:pre-wrap;">${safe(message)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 22px 22px 22px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:999px;background:${primary};">
                      <a href="mailto:${safe(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}"
                        style="display:inline-block;padding:10px 16px;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;border-radius:999px;">
                        Reply to ${safe(name)}
                      </a>
                    </td>
                    <td style="width:10px;"></td>
                    <td>
                      <div style="font-size:12px;color:${muted};line-height:1.5;">
                        Tip: reply directly to this email to respond faster.
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <div style="max-width:600px;margin:14px auto 0 auto;font-size:11px;color:${muted};line-height:1.6;text-align:center;">
            This email was generated by ${safe(brand)} website contact form.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

      try {
        await transporter.sendMail({
          from: senderFrom,
          to: forwardTo,
          replyTo: email,
          subject,
          html,
        });
      } catch (mailError) {
        console.error('Failed to send contact email:', mailError);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

