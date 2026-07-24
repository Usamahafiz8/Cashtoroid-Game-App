"use client";
import { useEffect, useState } from "react";
import { formatViews } from "@/lib/format";

interface LBEntry {
  rank: number;
  username: string;
  avatarUrl: string | null;
  totalViews: number;
  videoCount: number;
}

interface MyRank {
  rank: number | null;
  totalViews: number;
}

interface Timer {
  nextResetAt: string;
  hoursRemaining: number;
  minutesRemaining: number;
}

export default function LeaderboardPage() {
  const [board, setBoard] = useState<LBEntry[]>([]);
  const [me, setMe] = useState<MyRank | null>(null);
  const [timer, setTimer] = useState<Timer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/leaderboard/me").then((r) => r.json()),
      fetch("/api/leaderboard/timer").then((r) => r.json()),
    ]).then(([lb, myLb, t]) => {
      setBoard(lb.data ?? []);
      setMe(myLb.data ?? null);
      setTimer(t.data ?? null);
      setLoading(false);
    });
  }, []);

  const medal = (rank: number) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading leaderboard…</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Leaderboard</h1>
      <p style={sub}>Top 100 creators ranked by total approved views</p>

      {/* Timer + my rank */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: "2rem" }}>⏱</div>
          <div>
            <div style={{ color: "#718096", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Next Reset
            </div>
            {timer ? (
              <div style={{ color: "#1a1a2e", fontSize: "1.4rem", fontWeight: 700 }}>
                {timer.hoursRemaining}h {timer.minutesRemaining}m
              </div>
            ) : (
              <div style={{ color: "#a0aec0" }}>—</div>
            )}
            {timer?.nextResetAt && (
              <div style={{ color: "#a0aec0", fontSize: "0.75rem" }}>
                {new Date(timer.nextResetAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: "2rem" }}>🎯</div>
          <div>
            <div style={{ color: "#718096", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Your Rank
            </div>
            <div style={{ color: me?.rank ? "#e94560" : "#a0aec0", fontSize: "1.4rem", fontWeight: 700 }}>
              {me?.rank ? `#${me.rank}` : "Unranked"}
            </div>
            {me?.totalViews !== undefined && (
              <div style={{ color: "#718096", fontSize: "0.75rem" }} title={`${me.totalViews.toLocaleString()} total views`}>
                {formatViews(me.totalViews)} total views
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Rank", "Creator", "Total Views", "Videos"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.map((entry, i) => {
              const isMe = me?.rank === entry.rank;
              return (
                <tr
                  key={entry.rank}
                  style={{
                    backgroundColor: isMe ? "#e9456010" : i % 2 === 0 ? "#fff" : "#f9fafb",
                    border: isMe ? "2px solid #e9456040" : undefined,
                  }}
                >
                  <td style={{ ...td, fontWeight: 700, width: 80 }}>
                    <span style={{ color: entry.rank <= 3 ? "#f6ad55" : "#718096", fontSize: "1rem" }}>
                      {medal(entry.rank) ?? `#${entry.rank}`}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: isMe ? "#e94560" : "#0f3460",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: isMe ? 700 : 500, color: isMe ? "#e94560" : "#1a1a2e" }}>
                        {entry.username} {isMe && <span style={{ fontSize: "0.72rem" }}>(You)</span>}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...td, fontWeight: 600 }} title={entry.totalViews.toLocaleString()}>
                    {formatViews(entry.totalViews)}
                  </td>
                  <td style={{ ...td, color: "#718096" }}>{entry.videoCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 24px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const tableWrap: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "auto" };
const th: React.CSSProperties = { padding: "11px 16px", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#718096", backgroundColor: "#f7f8fa", borderBottom: "1px solid #e2e8f0" };
const td: React.CSSProperties = { padding: "11px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" };
