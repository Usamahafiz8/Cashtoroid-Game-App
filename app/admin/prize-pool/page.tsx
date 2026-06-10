"use client";
import { useEffect, useState } from "react";

interface PrizeTier {
  rank: number;
  amount: number;
}

interface PrizePool {
  totalAmount: number;
  currency: string;
  tiers: PrizeTier[];
  description: string | null;
}

const DEFAULT: PrizePool = {
  totalAmount: 0,
  currency: "USD",
  tiers: [],
  description: null,
};

export default function PrizePoolPage() {
  const [data, setData] = useState<PrizePool>(DEFAULT);
  const [tiersText, setTiersText] = useState("[]");
  const [tiersError, setTiersError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/prize-pool")
      .then((r) => r.json())
      .then((d) => {
        const pool: PrizePool = d.data ?? DEFAULT;
        setData(pool);
        setTiersText(JSON.stringify(pool.tiers ?? [], null, 2));
        setLoading(false);
      });
  }, []);

  async function save() {
    let tiers: PrizeTier[];
    try {
      tiers = JSON.parse(tiersText);
      setTiersError("");
    } catch {
      setTiersError("Invalid JSON — please fix before saving.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/prize-pool", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, tiers }),
    });
    const d = await res.json();
    setSaving(false);
    setMsg({ text: d.success ? "Saved!" : (d.error ?? "Failed"), ok: d.success });
    if (d.success) setData((prev) => ({ ...prev, tiers }));
    setTimeout(() => setMsg(null), 3000);
  }

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading...</div>;

  const tiersParsed: PrizeTier[] = (() => {
    try { return JSON.parse(tiersText); } catch { return []; }
  })();

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Prize Pool</h1>
      <p style={sub}>Configure the prize pool distributed to top performers</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        <div style={card}>
          <div style={fieldGroup}>
            <label style={label}>Total Amount</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={data.totalAmount}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  totalAmount: parseFloat(e.target.value) || 0,
                }))
              }
              style={input}
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Currency</label>
            <input
              value={data.currency}
              onChange={(e) =>
                setData((prev) => ({ ...prev, currency: e.target.value }))
              }
              style={input}
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Description</label>
            <textarea
              value={data.description ?? ""}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  description: e.target.value || null,
                }))
              }
              rows={3}
              style={{ ...input, resize: "vertical" }}
            />
          </div>

          <div style={fieldGroup}>
            <label style={label}>Prize Tiers (JSON)</label>
            <div style={{ color: "#a0aec0", fontSize: "0.75rem", marginBottom: 6 }}>
              Format: <code>[{"{ \"rank\": 1, \"amount\": 500 }"}]</code>
            </div>
            <textarea
              value={tiersText}
              onChange={(e) => {
                setTiersText(e.target.value);
                setTiersError("");
              }}
              rows={10}
              style={{
                ...input,
                fontFamily: "monospace",
                fontSize: "0.85rem",
                resize: "vertical",
                borderColor: tiersError ? "#e94560" : "#e2e8f0",
              }}
            />
            {tiersError && (
              <div style={{ color: "#e94560", fontSize: "0.75rem", marginTop: 4 }}>
                {tiersError}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ ...btn, backgroundColor: saving ? "#a0aec0" : "#0f3460" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {msg && (
              <span style={{ color: msg.ok ? "#48bb78" : "#e94560", fontSize: "0.875rem" }}>
                {msg.text}
              </span>
            )}
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: "0 0 16px", color: "#1a1a2e", fontSize: "1rem", fontWeight: 600 }}>
            Preview
          </h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#718096", fontSize: "0.75rem" }}>Total Pool</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#0f3460" }}>
              ${data.totalAmount.toLocaleString()}{" "}
              <span style={{ fontSize: "1rem", color: "#718096" }}>{data.currency}</span>
            </div>
          </div>
          {data.description && (
            <div style={{ marginBottom: 16, color: "#4a5568", fontSize: "0.875rem" }}>
              {data.description}
            </div>
          )}
          {tiersParsed.length > 0 && (
            <div>
              <div style={{ color: "#718096", fontSize: "0.75rem", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Tier Breakdown
              </div>
              {tiersParsed.map((tier) => (
                <div
                  key={tier.rank}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <span style={{ color: "#4a5568", fontSize: "0.875rem" }}>
                    {tier.rank === 1 ? "🥇" : tier.rank === 2 ? "🥈" : tier.rank === 3 ? "🥉" : `#${tier.rank}`} Rank {tier.rank}
                  </span>
                  <span style={{ fontWeight: 700, color: "#0f3460" }}>
                    ${tier.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 24px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
const fieldGroup: React.CSSProperties = { marginBottom: 18 };
const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#4a5568",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
const input: React.CSSProperties = {
  padding: "9px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.875rem",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};
const btn: React.CSSProperties = {
  padding: "10px 24px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.875rem",
};
