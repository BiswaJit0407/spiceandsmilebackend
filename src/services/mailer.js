const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  });
}

async function sendVerificationEmail(user, verifyUrl) {
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#FFFBF5;padding:32px;color:#2C3E50">
      <h1 style="font-family:'Playfair Display',serif;color:#D4523C">Welcome to Spice&Smile 🌶️</h1>
      <p>Hi ${user.name}, please confirm your email to start sharing recipes.</p>
      <p><a href="${verifyUrl}" style="background:#D4523C;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Verify my email</a></p>
      <p style="color:#666;font-size:12px">Link expires in 30 minutes.</p>
    </div>`;
  return sendMail({ to: user.email, subject: "Verify your Spice&Smile account", html });
}

async function sendRejectionEmail(user, recipeTitle, reason) {
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#FFFBF5;padding:32px;color:#2C3E50">
      <h2 style="font-family:'Playfair Display',serif;color:#D4523C">About your recipe "${recipeTitle}"</h2>
      <p>Hi ${user.name}, your submission couldn't be published this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You can edit and resubmit — see our guidelines for tips.</p>
    </div>`;
  return sendMail({
    to: user.email,
    subject: `Your recipe "${recipeTitle}" needs changes`,
    html,
  });
}

module.exports = { sendMail, sendVerificationEmail, sendRejectionEmail };
