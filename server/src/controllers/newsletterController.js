import Newsletter from "../models/Newsletter.js";
import { sendNewsletterWelcomeEmail } from "../services/mailService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const subscribeNewsletter = async (req, res) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "This email is already subscribed" });
    }

    await Newsletter.create({ email });

    // Do not block API response on email provider/network delays.
    setImmediate(async () => {
      try {
        const mail = await sendNewsletterWelcomeEmail({ to: email });
        if (!mail?.sent) {
          console.error("Newsletter confirmation email failed:", mail?.message || "unknown");
        }
      } catch (mailError) {
        console.error("Newsletter confirmation email failed:", mailError.message);
      }
    });

    return res.status(201).json({
      message: "Subscribed successfully to LUMEHEAVEN newsletter",
      emailStatus: "queued",
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This email is already subscribed" });
    }

    console.error("Newsletter subscribe failed:", error);
    return res.status(500).json({ message: "Failed to subscribe to newsletter" });
  }
};
