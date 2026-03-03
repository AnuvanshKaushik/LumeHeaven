import nodemailer from "nodemailer";

let cachedTransporter = null;
let smtpVerified = false;

const createTransporter = () => {
  const service = process.env.SMTP_SERVICE || process.env.EMAIL_SERVICE;
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || "").trim();
  let pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || "").trim();
  const isGmail =
    String(service || "").toLowerCase() === "gmail" ||
    String(host || "").toLowerCase().includes("gmail");

  // Gmail app passwords are frequently copied with spaces; normalize safely.
  if (isGmail) {
    pass = pass.replace(/\s+/g, "");
  }

  if (!user || !pass) {
    console.error("Email transport not configured: missing EMAIL_USER/EMAIL_PASS");
    return null;
  }

  const resolvedService = service || (isGmail ? "gmail" : "");

  if (resolvedService) {
    return nodemailer.createTransport({
      service: resolvedService,
      auth: { user, pass },
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 3000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 3000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 5000),
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
    requireTLS: port === 587,
    auth: { user, pass },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 3000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 3000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 5000),
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
      // Some hosts fail verify() in cloud environments but still allow sendMail().
      console.warn("SMTP verification failed; continuing with best-effort send", error.message);
      smtpVerified = true;
    }
  }

  return cachedTransporter;
};

const sendViaResend = async ({ to, subject, htmlContent, textContent }) => {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return { sent: false, skipped: true, message: "Resend API key is not configured" };
  }

  const from = process.env.EMAIL_FROM || "LUMEHEAVEN <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const apiMessage =
        payload?.message || payload?.error || `Resend request failed with status ${response.status}`;
      return { sent: false, skipped: false, message: apiMessage };
    }

    return { sent: true, skipped: false, messageId: payload?.id };
  } catch (error) {
    return { sent: false, skipped: false, message: error.message || "Resend request failed" };
  }
};

export const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const sendViaSmtp = async () => {
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

    console.log(`Email sent successfully via SMTP: messageId=${info.messageId}, to=${to}`);
    return { sent: true, skipped: false, messageId: info.messageId };
  };

  try {
    const provider = String(process.env.EMAIL_PROVIDER || "auto")
      .trim()
      .toLowerCase();
    const canUseResend = Boolean((process.env.RESEND_API_KEY || "").trim());
    const allowSmtpFallback = String(process.env.EMAIL_FALLBACK_TO_SMTP || "false")
      .trim()
      .toLowerCase() === "true";

    if (provider !== "smtp" && canUseResend) {
      const resendResult = await sendViaResend({ to, subject, htmlContent, textContent });
      if (resendResult?.sent) {
        console.log(`Email sent successfully via Resend: messageId=${resendResult.messageId || "n/a"}, to=${to}`);
        return resendResult;
      }

      console.error(`Resend email error: ${resendResult?.message || "Unknown error"}`);
      if (provider === "resend" || !allowSmtpFallback) {
        return resendResult;
      }

      const smtpFallback = await sendViaSmtp();
      if (smtpFallback?.sent) {
        return smtpFallback;
      }

      return {
        sent: false,
        skipped: Boolean(resendResult?.skipped && smtpFallback?.skipped),
        message: `Resend failed (${resendResult?.message || "unknown"}); SMTP failed (${smtpFallback?.message || "unknown"})`,
      };
    }

    return await sendViaSmtp();
  } catch (error) {
    console.error("Email sending error:", error);
    return { sent: false, skipped: false, message: error.message || "Email sending failed" };
  }
};
