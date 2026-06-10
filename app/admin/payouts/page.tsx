"use client";
import { useEffect, useState } from "react";

interface PayoutEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalViews: number;
  videoCount: number;
  isPaid: boolean;
  email: string;
  payoutInfo: string | null;
  paidAt: string | null;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/payouts?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setPayouts(d.data ?? []);
        setLoading(false);
      });
  }, []);

  async function markPaid(userId: string) {
    setBusy(userId);
    const res = await fetch("/api/admin/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const d = await res.json();
    if (d.success) {
      setPayouts((prev) =>
        prev.map((p) =>
          p.userId === userId
            ? { ...p, isPaid: true, paidAt: new Date().toISOString() }
            : p
        )
      );
      setMsg({ id: userId, text: "Marked as paid & email sent", ok: true });
    } else {
      setMsg({ id: userId, text: d.error ?? "Failed", ok: false });
    }
    setBusy(null);
    setTimeout(() => setMsg(null), 3000);
  }

  const unpaidCount = payouts.filter((p) => !p.isPaid).length;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Payouts</h1>
      <p style={sub}>
        Top performers eligible for payout —{" "}
        <strong style={{ color: unpaidCount > 0 ? "#f6ad55" : "#48bb78" }}>
          {unpaidCount} unpaid
        </strong>
      </p>

      {loading ? (
        <div style={{ color: "#718096" }}>Loading payouts...</div>
      ) : payouts.length === 0 ? (
        <div style={{ color: "#718096" }}>No payout data available.</div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Rank", "User", "Email", "Total Views", "Videos", "Payout Info", "Status", "Actions"].map(
                  (h) => (
                    <th key={h} style={th}>{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => (
                <tr
                  key={p.userId}
                  style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}
                >
                  <td style={{ ...td, textAlign: "center" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color:
                          p.rank === 1
                            ? "#f6ad55"
                            : p.rank === 2
                            ? "#a0aec0"
                            : p.rank === 3
                            ? "#c05621"
                            : "#718096",
                      }}
                    >
                      #{p.rank}
                    </span>
                  </td>
                  <td style={td}>
                    <span style={{ fontWeight: 600 }}>{p.username}</span>
                  </td>
                  <td style={{ ...td, fontSize: "0.8rem", color: "#718096" }}>
                    {p.email}
                  </td>
                  <td style={td}>{p.totalViews.toLocaleString()}</td>
                  <td style={{ ...td, textAlign: "center" }}>{p.videoCount}</td>
                  <td style={{ ...td, fontSize: "0.8rem", maxWidth: 180 }}>
                    {p.payoutInfo ? (
                      <span style={{ color: "#4a5568" }}>{p.payoutInfo}</span>
                    ) : (
                      <span style={{ color: "#a0aec0" }}>Not set</span>
                    )}
                  </td>
                  <td style={td}>
                    {p.isPaid ? (
                      <div>
                        <span
                          style={{
                            padding: "2px 10px",
                            borderRadius: 12,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#48bb78",
                            backgroundColor: "#48bb7822",
                          }}
                        >
                          Paid
                        </span>
                        {p.paidAt && (
                          <div style={{ color: "#a0aec0", fontSize: "0.7rem", marginTop: 2 }}>
                            {new Date(p.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#f6ad55",
                          backgroundColor: "#f6ad5522",
                        }}
                      >
                        Pending
                      </span>
                    )}
                  </td>
                  <td style={td}>
                    {!p.isPaid && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => markPaid(p.userId)}
                          disabled={busy === p.userId}
                          style={{
                            ...btnSm,
                            backgroundColor:
                              busy === p.userId ? "#a0aec0" : "#48bb78",
                          }}
                        >
                          {busy === p.userId ? "…" : "Mark Paid"}
                        </button>
                        {msg?.id === p.userId && (
                          <span
                            style={{
                              color: msg.ok ? "#48bb78" : "#e94560",
                              fontSize: "0.75rem",
                            }}
                          >
                            {msg.text}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 20px", color: "#718096", fontSize: "0.875rem" };
const tableWrap: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  overflow: "auto",
};
const th: React.CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "#718096",
  backgroundColor: "#f7f8fa",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "11px 16px",
  fontSize: "0.875rem",
  borderBottom: "1px solid #f0f0f0",
  verticalAlign: "middle",
};
const btnSm: React.CSSProperties = {
  padding: "5px 14px",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.8rem",
};
