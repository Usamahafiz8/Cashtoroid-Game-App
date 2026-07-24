"use client";
import { useEffect, useState, FormEvent } from "react";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payoutInfo: string | null;
  adminNote: string | null;
  reviewedAt: string | null;
  /** Set only once the request is approved (i.e. actually paid); null otherwise. */
  payoutDate: string | null;
  createdAt: string;
}

export default function CashoutPage() {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [payoutInfo, setPayoutInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: "", payoutInfo: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function loadData() {
    Promise.all([
      fetch("/api/cashout/history").then((r) => r.json()),
      fetch("/api/users/me").then((r) => r.json()),
    ]).then(([h, u]) => {
      setHistory(h.data ?? []);
      const savedPayout = u.data?.payoutInfo ?? "";
      setPayoutInfo(savedPayout);
      setForm((p) => ({ ...p, payoutInfo: savedPayout }));
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, []);

  const hasPending = history.some((t) => t.status === "pending");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setMsg({ text: "Enter a valid amount.", ok: false });
      return;
    }
    if (!form.payoutInfo.trim()) {
      setMsg({ text: "Please provide payout information (e.g. PayPal email, bank details).", ok: false });
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/cashout/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, payoutInfo: form.payoutInfo }),
    });
    const d = await res.json();
    setSubmitting(false);

    if (d.success) {
      setMsg({ text: "Cashout request submitted! An admin will review it shortly.", ok: true });
      setForm((p) => ({ ...p, amount: "" }));
      loadData();
    } else {
      setMsg({ text: d.error ?? "Failed to submit request.", ok: false });
    }
  }

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading…</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Cashout</h1>
      <p style={sub}>Request a withdrawal of your earnings</p>

      {/* Request form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 28, alignItems: "start" }}>
        <div style={card}>
          <h3 style={cardTitle}>New Cashout Request</h3>

          {hasPending && (
            <div style={warnBox}>
              You already have a pending cashout request. Please wait for it to be reviewed before submitting another.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Amount (USD)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                disabled={hasPending}
                style={{ ...input, opacity: hasPending ? 0.6 : 1 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Payout Info</label>
              <div style={{ color: "#a0aec0", fontSize: "0.75rem", marginBottom: 5 }}>
                PayPal email, bank details, crypto address, etc.
              </div>
              <textarea
                value={form.payoutInfo}
                onChange={(e) => setForm((p) => ({ ...p, payoutInfo: e.target.value }))}
                rows={3}
                placeholder="e.g. paypal@example.com or Bitcoin: bc1q..."
                disabled={hasPending}
                style={{ ...input, resize: "vertical", opacity: hasPending ? 0.6 : 1 }}
              />
            </div>

            {msg && (
              <div style={{ ...msgBox, color: msg.ok ? "#276749" : "#e94560", backgroundColor: msg.ok ? "#f0fff4" : "#fff5f5", borderColor: msg.ok ? "#9ae6b4" : "#fed7d7" }}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || hasPending}
              style={{
                ...btn,
                backgroundColor: submitting || hasPending ? "#a0aec0" : "#e94560",
                cursor: submitting || hasPending ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Submitting…" : "Request Cashout"}
            </button>
          </form>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>How It Works</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["1", "Submit your cashout request with your preferred payment method."],
              ["2", "An admin reviews and approves your request."],
              ["3", "Payment is sent to your provided payout info."],
              ["4", "You receive a confirmation email once paid."],
            ].map(([n, t]) => (
              <div key={n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "#e94560", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                  {n}
                </div>
                <div style={{ color: "#4a5568", fontSize: "0.875rem", lineHeight: 1.5 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div style={card}>
        <h3 style={cardTitle}>Request History</h3>
        {history.length === 0 ? (
          <div style={{ color: "#a0aec0", fontSize: "0.875rem" }}>No cashout requests yet.</div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Amount", "Payout Info", "Status", "Admin Note", "Submitted", "Payout Date"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((tx, i) => (
                  <tr key={tx.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ ...td, fontWeight: 700, color: "#0f3460" }}>
                      ${tx.amount.toLocaleString()} {tx.currency}
                    </td>
                    <td style={{ ...td, fontSize: "0.8rem", maxWidth: 180 }}>
                      {tx.payoutInfo ?? <span style={{ color: "#a0aec0" }}>—</span>}
                    </td>
                    <td style={td}>
                      <StatusBadge status={tx.status} />
                    </td>
                    <td style={{ ...td, fontSize: "0.8rem", color: "#718096" }}>
                      {tx.adminNote ?? "—"}
                    </td>
                    <td style={{ ...td, color: "#718096", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ ...td, color: "#718096", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                      {tx.payoutDate ? (
                        new Date(tx.payoutDate).toLocaleDateString()
                      ) : (
                        <span style={{ color: "#a0aec0" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["#f6ad55", "#f6ad5522"],
    approved: ["#48bb78", "#48bb7822"],
    rejected: ["#e94560", "#e9456022"],
  };
  const [color, bg] = map[status] ?? ["#a0aec0", "#a0aec022"];
  return (
    <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600, color, backgroundColor: bg }}>
      {status}
    </span>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 24px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const cardTitle: React.CSSProperties = { margin: "0 0 16px", color: "#1a1a2e", fontSize: "1rem", fontWeight: 600 };
const lbl: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#4a5568", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" };
const input: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" };
const btn: React.CSSProperties = { padding: "10px 24px", border: "none", borderRadius: 6, fontWeight: 700, color: "#fff", fontSize: "0.875rem" };
const warnBox: React.CSSProperties = { backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 6, padding: "10px 14px", marginBottom: 16, color: "#92400e", fontSize: "0.875rem" };
const msgBox: React.CSSProperties = { padding: "10px 14px", borderRadius: 6, marginBottom: 12, fontSize: "0.875rem", border: "1px solid" };
const th: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#718096", backgroundColor: "#f7f8fa", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" };
