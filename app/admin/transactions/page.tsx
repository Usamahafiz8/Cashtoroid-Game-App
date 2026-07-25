"use client";
import { useEffect, useState } from "react";

interface AdminTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payoutInfo: string | null;
  adminNote: string | null;
  createdAt: string;
  /** Paid-on date once approved; otherwise the request's createdAt. */
  payoutDate: string | null;
  user: { id: string; username: string; email: string; avatarUrl: string | null };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    const url =
      statusFilter !== "all"
        ? `/api/admin/transactions?status=${statusFilter}`
        : "/api/admin/transactions";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setTransactions(d.data ?? []);
        setLoading(false);
      });
  }, [statusFilter]);

  function flash(id: string, text: string, ok: boolean) {
    setMsg({ id, text, ok });
    setTimeout(() => setMsg(null), 2500);
  }

  async function action(id: string, act: "approve" | "reject") {
    setBusy(id + "-" + act);
    const res = await fetch(`/api/admin/transactions/${id}/${act}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: notes[id] || undefined }),
    });
    const d = await res.json();
    if (d.success) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: act === "approve" ? "approved" : "rejected" }
            : t
        )
      );
      flash(id, `Transaction ${act}d`, true);
    } else {
      flash(id, d.error ?? "Failed", false);
    }
    setBusy(null);
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Transactions</h1>
      <p style={sub}>Manage user cashout requests</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              ...filterBtn,
              backgroundColor: statusFilter === s ? "#0f3460" : "#e2e8f0",
              color: statusFilter === s ? "#fff" : "#4a5568",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#718096" }}>Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div style={{ color: "#718096" }}>No transactions found.</div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "Amount", "Payout Info", "Status", "Submitted", "Payout Date", "Actions"].map(
                  (h) => (
                    <th key={h} style={th}>{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr
                  key={tx.id}
                  style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}
                >
                  <td style={td}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                      {tx.user.username}
                    </div>
                    <div style={{ color: "#718096", fontSize: "0.75rem" }}>
                      {tx.user.email}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ fontWeight: 700, color: "#0f3460" }}>
                      ${tx.amount.toLocaleString()} {tx.currency}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: "0.8rem", maxWidth: 200 }}>
                    {tx.payoutInfo ? (
                      <span style={{ color: "#4a5568" }}>{tx.payoutInfo}</span>
                    ) : (
                      <span style={{ color: "#a0aec0" }}>—</span>
                    )}
                  </td>
                  <td style={td}>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td style={{ ...td, fontSize: "0.75rem", color: "#718096", whiteSpace: "nowrap" }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ ...td, fontSize: "0.75rem", color: "#718096", whiteSpace: "nowrap" }}>
                    {tx.payoutDate ? (
                      new Date(tx.payoutDate).toLocaleDateString()
                    ) : (
                      <span style={{ color: "#a0aec0" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...td, minWidth: 220 }}>
                    {tx.status === "pending" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <input
                          placeholder="Admin note (optional)"
                          value={notes[tx.id] ?? ""}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [tx.id]: e.target.value }))
                          }
                          style={inputSm}
                        />
                        <div style={{ display: "flex", gap: 5 }}>
                          <button
                            onClick={() => action(tx.id, "approve")}
                            disabled={!!busy}
                            style={{ ...btnSm, backgroundColor: "#48bb78" }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => action(tx.id, "reject")}
                            disabled={!!busy}
                            style={{ ...btnSm, backgroundColor: "#e94560" }}
                          >
                            Reject
                          </button>
                        </div>
                        {msg?.id === tx.id && (
                          <span
                            style={{
                              color: msg.ok ? "#48bb78" : "#e94560",
                              fontSize: "0.72rem",
                            }}
                          >
                            {msg.text}
                          </span>
                        )}
                      </div>
                    ) : (
                      tx.adminNote && (
                        <span style={{ color: "#718096", fontSize: "0.8rem" }}>
                          Note: {tx.adminNote}
                        </span>
                      )
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["#f6ad55", "#f6ad5522"],
    approved: ["#48bb78", "#48bb7822"],
    rejected: ["#e94560", "#e9456022"],
  };
  const [color, bg] = map[status] ?? ["#a0aec0", "#a0aec022"];
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: "0.75rem",
        fontWeight: 600,
        color,
        backgroundColor: bg,
      }}
    >
      {status}
    </span>
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
  verticalAlign: "top",
};
const filterBtn: React.CSSProperties = {
  padding: "6px 14px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.8rem",
};
const btnSm: React.CSSProperties = {
  padding: "5px 12px",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.75rem",
};
const inputSm: React.CSSProperties = {
  padding: "5px 8px",
  border: "1px solid #e2e8f0",
  borderRadius: 5,
  fontSize: "0.75rem",
  boxSizing: "border-box",
  width: "100%",
  outline: "none",
};
