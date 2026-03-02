import { sendEmail } from "./emailService.js";

export const sendOrderConfirmationEmail = async ({ to, customerName, order }) => {
  if (!to) {
    return { sent: false, skipped: true, message: "Recipient email is missing" };
  }

  const lineItems = order.items
    .map((item) => `${item.name} x ${item.quantity}`)
    .join("\n");

  const subject = "Your LUMEHEAVEN Order Confirmation";
  const shipping = order.shippingAddress || {};
  const shippingText = [
    shipping.name,
    shipping.phone,
    shipping.line1,
    `${shipping.city}, ${shipping.state} ${shipping.postalCode}`.trim(),
    shipping.country,
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    `Hello ${customerName || "Customer"},`,
    "",
    "Thank you for your order at LUMEHEAVEN.",
    "",
    `Order ID: ${order.orderId}`,
    "",
    "Items Purchased:",
    lineItems || "No items",
    "",
    `Total: Rs ${order.total}`,
    "",
    "Shipping Address:",
    shippingText || "Not provided",
    "",
    "Your order will be shipped soon.",
    "",
    "Thank you for choosing LUMEHEAVEN.",
    "- LUMEHEAVEN",
  ].join("\n");

  const htmlItems = order.items
    .map((item) => `<li>${item.name} x <strong>${item.quantity}</strong></li>`)
    .join("");
  const shippingHtml = [
    shipping.name,
    shipping.phone,
    shipping.line1,
    `${shipping.city}, ${shipping.state} ${shipping.postalCode}`.trim(),
    shipping.country,
  ]
    .filter(Boolean)
    .map((line) => `<div>${line}</div>`)
    .join("");

  const html = `
    <div style="font-family:Poppins,Arial,sans-serif;line-height:1.6;color:#33281f;max-width:640px;margin:0 auto;padding:16px;">
      <h2 style="font-family:'Playfair Display',serif;color:#8f6c3c;margin-bottom:8px;">LUMEHEAVEN</h2>
      <p>Hello ${customerName || "Customer"},</p>
      <p>Thank you for your order at LUMEHEAVEN.</p>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <h3 style="font-family:'Playfair Display',serif;color:#8f6c3c;">Items Purchased</h3>
      <ul>${htmlItems || "<li>No items</li>"}</ul>
      <p><strong>Total:</strong> Rs ${order.total}</p>
      <h3 style="font-family:'Playfair Display',serif;color:#8f6c3c;">Shipping Address</h3>
      <div>${shippingHtml || "<div>Not provided</div>"}</div>
      <p>Your order will be shipped soon.</p>
      <p>Thank you for choosing LUMEHEAVEN.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    htmlContent: html,
    textContent: text,
  });
};

export const sendNewsletterWelcomeEmail = async ({ to }) => {
  if (!to) {
    return { sent: false, skipped: true, message: "Recipient email is missing" };
  }

  const subject = "Welcome to LUMEHEAVEN";
  const text = [
    "Thank you for subscribing to LUMEHEAVEN.",
    "You will now receive updates about new collections, exclusive offers, and style inspirations.",
  ].join("\n");

  const html = `
    <div style="font-family:Poppins,Arial,sans-serif;line-height:1.6;color:#33281f;max-width:640px;margin:0 auto;padding:16px;">
      <h2 style="font-family:'Playfair Display',serif;color:#8f6c3c;margin-bottom:8px;">Welcome to LUMEHEAVEN</h2>
      <p>Thank you for subscribing to LUMEHEAVEN.</p>
      <p>You will now receive updates about new collections, exclusive offers, and style inspirations.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    htmlContent: html,
    textContent: text,
  });
};
