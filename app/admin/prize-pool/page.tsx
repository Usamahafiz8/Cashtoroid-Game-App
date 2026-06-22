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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/prize-pool")
      .then((r) => r.json())
      .then((d) => {
        const pool: PrizePool = d.data ?? DEFAULT;
        setData({ ...pool, tiers: pool.tiers ?? [] });
        setLoading(false);
      });
  }, []);

  function addTier() {
    setData((prev) => {
      const nextRank =
        prev.tiers.length > 0
          ? Math.max(...prev.tiers.map((t) => t.rank)) + 1
          : 1;
      return { ...prev, tiers: [...prev.tiers, { rank: nextRank, amount: 0 }] };
    });
  }

  function removeTier(index: number) {
    setData((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index),
    }));
  }

  function updateTier(index: number, field: "rank" | "amount", value: number) {
    setData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }));
  }

  async function save() {
    if (validationError) return;

    setSaving(true);
    const res = await fetch("/api/admin/prize-pool", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    setSaving(false);
    setMsg({ text: d.success ? "Saved!" : (d.error ?? "Failed"), ok: d.success });
    if (d.success && d.data) setData({ ...d.data, tiers: d.data.tiers ?? [] });
    setTimeout(() => setMsg(null), 3000);
  }

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading...</div>;

  const tiers = data.tiers;
  const tiersSum = tiers.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  // Validation — shown live and used to guard Save.
  const ranks = tiers.map((t) => t.rank);
  const hasDuplicateRank = new Set(ranks).size !== ranks.length;
  const hasInvalidRank = tiers.some((t) => !Number.isInteger(t.rank) || t.rank < 1);
  const sumMismatch =
    tiers.length > 0 &&
    Math.round(tiersSum * 100) !== Math.round((data.totalAmount || 0) * 100);

  const validationError = hasInvalidRank
    ? "Each rank must be a whole number (1 or higher)."
    : hasDuplicateRank
    ? "Each rank can only be used once."
    : sumMismatch
    ? `Tiers add up to $${tiersSum.toLocaleString()} but the pool is $${(data.totalAmount || 0).toLocaleString()} — they must match exactly.`
    : "";

  const remaining = (data.totalAmount || 0) - tiersSum;
  const sortedTiers = [...tiers].sort((a, b) => a.rank - b.rank);

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
            <label style={label}>Prize Tiers</label>
            <div style={{ color: "#a0aec0", fontSize: "0.75rem", marginBottom: 10 }}>
              Add a row for each rank. The amounts must add up to the Total Amount above.
            </div>

            {tiers.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                <div style={{ ...colLabel, width: 110 }}>Rank</div>
                <div style={{ ...colLabel, flex: 1 }}>Amount ({data.currency})</div>
                <div style={{ width: 36 }} />
              </div>
            )}

            {tiers.map((tier, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={tier.rank}
                  onChange={(e) =>
                    updateTier(i, "rank", parseInt(e.target.value, 10) || 0)
                  }
                  style={{ ...input, width: 110 }}
                  placeholder="1"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={tier.amount}
                  onChange={(e) =>
                    updateTier(i, "amount", parseFloat(e.target.value) || 0)
                  }
                  style={{ ...input, flex: 1 }}
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  title="Remove tier"
                  style={removeBtn}
                >
                  ✕
                </button>
              </div>
            ))}

            <button type="button" onClick={addTier} style={addBtn}>
              + Add Tier
            </button>

            <div
              style={{
                marginTop: 12,
                fontSize: "0.8rem",
                color: remaining === 0 ? "#48bb78" : "#718096",
              }}
            >
              Allocated: ${tiersSum.toLocaleString()} of $
              {(data.totalAmount || 0).toLocaleString()}{" "}
              {remaining !== 0 && (
                <span style={{ color: "#e94560" }}>
                  ({remaining > 0 ? `$${remaining.toLocaleString()} left to allocate` : `$${Math.abs(remaining).toLocaleString()} over`})
                </span>
              )}
            </div>

            {validationError && (
              <div style={{ color: "#e94560", fontSize: "0.75rem", marginTop: 6 }}>
                {validationError}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={save}
              disabled={saving || !!validationError}
              style={{
                ...btn,
                backgroundColor: saving || validationError ? "#a0aec0" : "#0f3460",
                cursor: saving || validationError ? "not-allowed" : "pointer",
              }}
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
          {sortedTiers.length > 0 && (
            <div>
              <div style={{ color: "#718096", fontSize: "0.75rem", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Tier Breakdown
              </div>
              {sortedTiers.map((tier, i) => (
                <div
                  key={i}
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
                    ${(Number(tier.amount) || 0).toLocaleString()}
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
const colLabel: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  color: "#a0aec0",
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
const addBtn: React.CSSProperties = {
  padding: "8px 16px",
  border: "1px dashed #cbd5e0",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  color: "#0f3460",
  backgroundColor: "#f7fafc",
  fontSize: "0.8rem",
};
const removeBtn: React.CSSProperties = {
  width: 36,
  flexShrink: 0,
  border: "1px solid #fed7d7",
  borderRadius: 6,
  cursor: "pointer",
  color: "#e94560",
  backgroundColor: "#fff5f5",
  fontSize: "0.85rem",
};
