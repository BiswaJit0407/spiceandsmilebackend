const cron = require("node-cron");
const User = require("../models/User");
const Recipe = require("../models/Recipe");
const { sendMail } = require("./mailer");

async function buildNewsletterFor(user) {
  const lang = user.newsletterPreferences?.language || "en";
  const [fresh, trending, festival] = await Promise.all([
    Recipe.findOne({ status: "published" }).sort({ createdAt: -1 }),
    Recipe.findOne({ status: "published" }).sort({ viewsCount: -1 }),
    Recipe.findOne({ status: "published", festivalTags: { $exists: true, $ne: [] } })
      .sort({ createdAt: -1 }),
  ]);

  const clientUrl = process.env.CLIENT_URL || "";
  const card = (r, label) =>
    r
      ? `<div style="margin:16px 0;padding:16px;background:#fff;border-radius:12px;border:1px solid #eee">
          <div style="color:#F5A623;font-size:12px;text-transform:uppercase;letter-spacing:1px">${label}</div>
          <h3 style="font-family:'Playfair Display',serif;color:#2D5016;margin:8px 0">
            <a href="${clientUrl}/recipes/${r._id}" style="color:#D4523C;text-decoration:none">${r.title?.[lang] || r.title?.en}</a>
          </h3>
          <p style="color:#2C3E50;font-size:14px">${(r.description?.[lang] || r.description?.en || "").slice(0, 160)}</p>
        </div>`
      : "";

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#FFFBF5;padding:24px;color:#2C3E50">
      <h1 style="font-family:'Playfair Display',serif;color:#D4523C">From Our Kitchen to Your Heart 🌶️</h1>
      <p>Hi ${user.name}, here are this week's picks:</p>
      ${card(fresh, "Fresh from the kitchen")}
      ${card(trending, "Trending this week")}
      ${card(festival, "Seasonal & festival")}
      <p style="color:#888;font-size:12px;margin-top:24px">
        You're subscribed to Spice&Smile.
        <a href="${clientUrl}/unsubscribe?u=${user._id}" style="color:#888">Unsubscribe</a>.
      </p>
    </div>`;
}

function startNewsletterCron() {
  // Every Sunday 9:00 AM server-local time
  cron.schedule("0 9 * * 0", async () => {
    console.log("[cron] Sending weekly newsletter");
    const subs = await User.find({ newsletterSubscribed: true, verified: true });
    for (const user of subs) {
      try {
        const html = await buildNewsletterFor(user);
        await sendMail({ to: user.email, subject: "Your weekly Spice&Smile 🌶️", html });
      } catch (err) {
        console.error("Newsletter send failed for", user.email, err.message);
      }
    }
  });
}

function startQuotaResetCron() {
  // 1st of each month at 00:05, reset monthly quotas
  cron.schedule("5 0 1 * *", async () => {
    console.log("[cron] Resetting monthly post quotas");
    await User.updateMany({}, { $set: { postCountThisMonth: 0, rejectionsThisMonth: 0 } });
  });
}

module.exports = { startNewsletterCron, startQuotaResetCron };
