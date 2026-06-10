"use client";
import { useEffect, useState } from "react";

interface Challenge {
  title: string;
  description: string;
  rules: string;
  guidelines: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

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

export default function ChallengePage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [pool, setPool] = useState<PrizePool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/challenge").then((r) => r.json()),
      fetch("/api/prize-pool").then((r) => r.json()),
    ]).then(([c, p]) => {
      setChallenge(c.data ?? null);
      setPool(p.data ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading…</div>;

  const now = new Date();
  const start = challenge?.startDate ? new Date(challenge.startDate) : null;
  const end = challenge?.endDate ? new Date(challenge.endDate) : null;
  const isLive = challenge?.isActive && (!start || start <= now) && (!end || end >= now);

  const tiers: PrizeTier[] = Array.isArray(pool?.tiers) ? (pool!.tiers as PrizeTier[]) : [];

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Challenge & Prize Pool</h1>
      <p style={sub}>Current challenge details and prize distribution</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
        {/* Challenge details */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: "0.8rem",
                fontWeight: 700,
                color: isLive ? "#276749" : "#a0aec0",
                backgroundColor: isLive ? "#f0fff4" : "#f7f8fa",
                border: `1px solid ${isLive ? "#9ae6b4" : "#e2e8f0"}`,
              }}
            >
              {isLive ? "● LIVE" : challenge?.isActive ? "⏳ Scheduled" : "○ Inactive"}
            </span>
            {start && (
              <span style={{ color: "#718096", fontSize: "0.78rem" }}>
                {start.toLocaleDateString()} – {end ? end.toLocaleDateString() : "ongoing"}
              </span>
            )}
          </div>

          {challenge && challenge.isActive ? (
            <>
              <h2 style={{ margin: "0 0 12px", color: "#1a1a2e", fontSize: "1.4rem", fontWeight: 700 }}>
                {challenge.title}
              </h2>
              {challenge.description && (
                <p style={{ color: "#4a5568", lineHeight: 1.7, marginBottom: 20, fontSize: "0.95rem" }}>
                  {challenge.description}
                </p>
              )}

              {challenge.rules && (
                <div style={{ marginBottom: 20 }}>
                  <div style={sectionLabel}>Rules</div>
                  <div style={{ color: "#4a5568", lineHeight: 1.8, fontSize: "0.9rem", whiteSpace: "pre-line" }}>
                    {challenge.rules}
                  </div>
                </div>
              )}

              {challenge.guidelines && (
                <div>
                  <div style={sectionLabel}>Guidelines</div>
                  <div style={{ color: "#718096", lineHeight: 1.8, fontSize: "0.875rem", whiteSpace: "pre-line" }}>
                    {challenge.guidelines}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>⚡</div>
              <div style={{ color: "#718096", fontSize: "1rem" }}>No active challenge right now.</div>
              <div style={{ color: "#a0aec0", fontSize: "0.875rem", marginTop: 6 }}>
                Check back soon!
              </div>
            </div>
          )}
        </div>

        {/* Prize pool */}
        <div>
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionLabel}>Total Prize Pool</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "#0f3460", lineHeight: 1 }}>
              ${pool?.totalAmount.toLocaleString() ?? "0"}
            </div>
            <div style={{ color: "#718096", fontSize: "0.875rem", marginTop: 4 }}>
              {pool?.currency ?? "USD"}
            </div>
            {pool?.description && (
              <div style={{ color: "#718096", fontSize: "0.8rem", marginTop: 10, lineHeight: 1.5 }}>
                {pool.description}
              </div>
            )}
          </div>

          {tiers.length > 0 && (
            <div style={card}>
              <div style={sectionLabel}>Prize Distribution</div>
              {tiers.map((tier) => (
                <div
                  key={tier.rank}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "1.2rem" }}>
                      {tier.rank === 1 ? "🥇" : tier.rank === 2 ? "🥈" : tier.rank === 3 ? "🥉" : `#${tier.rank}`}
                    </span>
                    <span style={{ color: "#4a5568", fontSize: "0.875rem" }}>Rank {tier.rank}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: "#0f3460", fontSize: "1rem" }}>
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
const card: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const sectionLabel: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#718096",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 8,
};
