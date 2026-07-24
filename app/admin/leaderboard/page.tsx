"use client";
import { useEffect, useState } from "react";
import { formatViews, formatCountdown } from "@/lib/format";

interface LBConfig {
  periodHours: number;
  lastResetAt: string;
  nextResetAt: string;
}

interface LBEntry {
  rank: number;
  userId: string;
  username: string;
  totalViews: number;
}

export default function LeaderboardPage() {
  const [config, setConfig] = useState<LBConfig | null>(null);
  const [periodHours, setPeriodHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [recalcResult, setRecalcResult] = useState<LBEntry[] | null>(null);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/leaderboard/config")
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.data ?? null);
        setPeriodHours(d.data?.periodHours ?? 24);
        setLoading(false);
      });
  }, []);

  // Drives the "Time Until Reset" countdown so it ticks live (hh:mm:ss)
  // instead of freezing at whatever moment the config was fetched.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function savePeriod() {
    setBusy(true);
    const res = await fetch("/api/admin/leaderboard/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodHours }),
    });
    const d = await res.json();
    if (d.success && d.data) setConfig(d.data);
    flash(d.success ? "Period updated!" : (d.error ?? "Failed"), d.success);
    setBusy(false);
  }

  async function triggerReset() {
    if (
      !confirm(
        "Reset the leaderboard now? This will start a new scoring period for all users."
      )
    )
      return;
    setBusy(true);
    const res = await fetch("/api/admin/leaderboard/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodHours, triggerReset: true }),
    });
    const d = await res.json();
    flash(d.success ? "Leaderboard reset!" : (d.error ?? "Failed"), d.success);
    setBusy(false);
  }

  async function recalculate() {
    setBusy(true);
    setRecalcResult(null);
    const res = await fetch("/api/admin/recalculate", { method: "POST" });
    const d = await res.json();
    if (d.success) setRecalcResult(d.data?.leaderboard ?? []);
    flash(
      d.success ? "Views recalculated!" : (d.error ?? "Failed"),
      d.success
    );
    setBusy(false);
  }

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading...</div>;

  const nextReset = config ? new Date(config.nextResetAt) : null;
  const msUntilReset = nextReset ? Math.max(0, nextReset.getTime() - (now ?? Date.now())) : 0;
  const secondsUntilReset = Math.floor(msUntilReset / 1000);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Leaderboard Config</h1>
      <p style={sub}>Manage reset periods and recalculate view rankings</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={card}>
          <h3 style={cardTitle}>Current Period Status</h3>
          {config ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <InfoRow label="Period" value={`${config.periodHours} hours`} />
              <InfoRow
                label="Last Reset"
                value={new Date(config.lastResetAt).toLocaleString()}
              />
              <InfoRow
                label="Next Reset"
                value={new Date(config.nextResetAt).toLocaleString()}
                highlight
              />
              <InfoRow
                label="Time Until Reset"
                value={formatCountdown(secondsUntilReset)}
                highlight={secondsUntilReset < 2 * 3600}
              />
            </div>
          ) : (
            <div style={{ color: "#a0aec0", fontSize: "0.875rem" }}>
              No config set yet.
            </div>
          )}
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Update Period</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Reset Period (hours)</label>
            <input
              type="number"
              min={1}
              max={720}
              value={periodHours}
              onChange={(e) => setPeriodHours(parseInt(e.target.value) || 24)}
              style={input}
            />
            <div style={{ color: "#a0aec0", fontSize: "0.75rem", marginTop: 4 }}>
              Common: 24h (daily), 168h (weekly)
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={savePeriod}
              disabled={busy}
              style={{ ...btn, backgroundColor: "#0f3460" }}
            >
              Save Period
            </button>
            <button
              onClick={triggerReset}
              disabled={busy}
              style={{ ...btn, backgroundColor: "#e94560" }}
            >
              Reset Now
            </button>
            {msg && (
              <span style={{ color: msg.ok ? "#48bb78" : "#e94560", fontSize: "0.875rem" }}>
                {msg.text}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={card}>
        <h3 style={cardTitle}>Recalculate Views</h3>
        <p style={{ color: "#718096", fontSize: "0.875rem", margin: "0 0 16px" }}>
          Trigger a manual view refresh from all connected platforms (YouTube, TikTok) and
          recalculate leaderboard rankings immediately.
        </p>
        <button
          onClick={recalculate}
          disabled={busy}
          style={{ ...btn, backgroundColor: busy ? "#a0aec0" : "#0f3460" }}
        >
          {busy ? "Recalculating…" : "Recalculate Now"}
        </button>

        {recalcResult && recalcResult.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 10,
                color: "#48bb78",
                fontSize: "0.875rem",
              }}
            >
              ✓ Top 10 after recalculation
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Rank", "Username", "Total Views"].map((h) => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recalcResult.map((e, i) => (
                  <tr
                    key={e.userId}
                    style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}
                  >
                    <td style={{ ...td, fontWeight: 700, color: i < 3 ? "#e94560" : "#718096" }}>
                      #{e.rank}
                    </td>
                    <td style={td}>{e.username}</td>
                    <td style={td} title={e.totalViews.toLocaleString()}>{formatViews(e.totalViews)}</td>
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

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <span style={{ color: "#718096", fontSize: "0.8rem" }}>{label}</span>
      <span
        style={{
          color: highlight ? "#e94560" : "#1a1a2e",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
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
const cardTitle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#1a1a2e",
  fontSize: "1rem",
  fontWeight: 600,
};
const lbl: React.CSSProperties = {
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
  padding: "9px 20px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.875rem",
};
const th: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "#718096",
  backgroundColor: "#f7f8fa",
  borderBottom: "1px solid #e2e8f0",
};
const td: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: "0.875rem",
  borderBottom: "1px solid #f0f0f0",
};
