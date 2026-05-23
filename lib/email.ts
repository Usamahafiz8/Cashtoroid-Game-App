import nodemailer from "nodemailer";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn("[email] SMTP not configured — skipping send");
    return;
  }

  const transport = createTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    ...opts,
  });
}

export async function sendVideoStatusEmail(opts: {
  to: string;
  username: string;
  videoTitle: string;
  status: "approved" | "rejected";
  flagReason?: string;
}) {
  const isApproved = opts.status === "approved";
  const subject = isApproved
    ? "Your video was approved!"
    : "Video submission update";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:${isApproved ? "#16a34a" : "#dc2626"}">
        ${isApproved ? "Video Approved" : "Video Not Approved"}
      </h2>
      <p>Hi <strong>${opts.username}</strong>,</p>
      <p>Your video <em>${opts.videoTitle ?? "submission"}</em> has been
        <strong>${opts.status}</strong>.
      </p>
      ${opts.flagReason ? `<p>Reason: <em>${opts.flagReason}</em></p>` : ""}
      ${isApproved ? "<p>Your views will now count toward the leaderboard.</p>" : ""}
      <p style="margin-top:24px;font-size:12px;color:#6b7280">
        Cashtoroid Content Rewards
      </p>
    </div>
  `;

  return sendEmail({ to: opts.to, subject, html });
}

export async function sendOtpEmail(opts: {
  to: string;
  username: string;
  otp: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: "Your Cashtoroid password reset OTP",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0f3460">Password Reset OTP</h2>
        <p>Hi <strong>${opts.username}</strong>,</p>
        <p>Use the OTP below to reset your password. It expires in <strong>15 minutes</strong>.</p>
        <div style="margin:28px 0;text-align:center">
          <span style="display:inline-block;background:#f3f4f6;border:2px dashed #d1d5db;border-radius:12px;padding:18px 36px;font-size:2.2rem;font-weight:800;letter-spacing:10px;color:#0f3460">
            ${opts.otp}
          </span>
        </div>
        <p style="font-size:13px;color:#6b7280">If you didn't request this, you can safely ignore this email.</p>
        <p style="margin-top:24px;font-size:12px;color:#6b7280">Cashtoroid Content Rewards</p>
      </div>
    `,
  });
}

export async function sendPayoutNotificationEmail(opts: {
  to: string;
  username: string;
  totalViews: number;
  rank: number;
}) {
  return sendEmail({
    to: opts.to,
    subject: "You've been marked as paid!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#7c3aed">Payout Confirmed</h2>
        <p>Hi <strong>${opts.username}</strong>,</p>
        <p>Your payout has been processed. Here's your summary:</p>
        <ul>
          <li>Rank: #${opts.rank}</li>
          <li>Total Views: ${opts.totalViews.toLocaleString()}</li>
        </ul>
        <p>Thanks for creating content!</p>
        <p style="margin-top:24px;font-size:12px;color:#6b7280">
          Cashtoroid Content Rewards
        </p>
      </div>
    `,
  });
}
