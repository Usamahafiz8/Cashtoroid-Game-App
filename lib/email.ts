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

export async function sendPasswordResetEmail(opts: {
  to: string;
  username: string;
  resetUrl: string;
}) {
  return sendEmail({
    to: opts.to,
    subject: "Reset your Cashtoroid password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#0f3460">Password Reset</h2>
        <p>Hi <strong>${opts.username}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.</p>
        <p style="margin:24px 0">
          <a href="${opts.resetUrl}"
             style="background:#e94560;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
        </p>
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
