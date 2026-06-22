import axios from 'axios';
import nodemailer from 'nodemailer';

interface ContactEmailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function formatContactText(payload: ContactEmailPayload): string {
  return `Name: ${payload.name}
Email: ${payload.email}
Subject: ${payload.subject}

Message:
${payload.message}`;
}

export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  const to = process.env.CONTACT_RECEIVER_EMAIL;
  if (!to) {
    throw new Error('CONTACT_RECEIVER_EMAIL is not configured.');
  }

  const subject = `PokéWorld Contact: ${payload.subject}`;
  const text = formatContactText(payload);
  const resendKey = process.env.RESEND_API_KEY;

  // Render blocks outbound SMTP; Resend uses HTTPS instead.
  if (resendKey) {
    const from = process.env.EMAIL_FROM ?? 'PokéWorld <onboarding@resend.dev>';

    await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to: [to],
        reply_to: payload.email,
        subject,
        text,
      },
      {
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return;
  }

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    throw new Error('Email is not configured on the server.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to,
    replyTo: payload.email,
    subject,
    text,
  });
}
