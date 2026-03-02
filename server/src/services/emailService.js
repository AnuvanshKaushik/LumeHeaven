import nodemailer from "nodemailer";

let cachedTransporter = null;
let smtpVerified = false;

const createTransporter = () => {
  const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error("Email transport not configured: missing EMAIL_USER/EMAIL_PASS");
    return null;
  }

  if (service) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
  }

  if (!host) {
    console.error("Email transport not configured: missing EMAIL_HOST (or SMTP_HOST)");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const getTransporter = async () => {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }

  if (!cachedTransporter) {
    return null;
  }

  if (!smtpVerified) {
    try {
      await cachedTransporter.verify();
      smtpVerified = true;
      console.log("SMTP connection status: ready");
    } catch (error) {
      console.error("SMTP connection status: failed", error);
      throw new Error("SMTP connection verification failed");
    }
  }

  return cachedTransporter;
};

export const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      return { sent: false, skipped: true, message: "Email transport is not configured" };
    }

    const from =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      process.env.MAIL_FROM ||
      process.env.EMAIL_USER ||
      process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    });

    console.log(`Email sent successfully: messageId=${info.messageId}, to=${to}`);
    return { sent: true, skipped: false, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending error:", error);
    return { sent: false, skipped: false, message: error.message || "Email sending failed" };
  }
};
