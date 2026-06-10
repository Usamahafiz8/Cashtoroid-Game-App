"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalVideos: number;
  approvedVideos: number;
  pendingVideos: number;
  rejectedVideos: number;
  totalViews: number;
  rank: number | null;
}

interface Video {
  id: string;
  title: string | null;
  url: string;
  platform: string;
  currentViews: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentVideos, setRecentVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/me/stats").then((r) => r.json()),
      fetch("/api/videos/my-videos").then((r) => r.json()),
    ]).then(([s, v]) => {
      setStats(s.data ?? null);
      setRecentVideos((v.data ?? []).slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading…</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Overview</h1>
      <p style={sub}>Your performance at a glance</p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard
          title="Total Views"
          value={stats?.totalViews.toLocaleString() ?? "0"}
          sub="across approved videos"
          color="#e94560"
        />
        <StatCard
          title="Rank"
          value={stats?.rank ? `#${stats.rank}` : "—"}
          sub="on the leaderboard"
          color="#f6ad55"
        />
        <StatCard
          title="Videos"
          value={stats?.totalVideos ?? 0}
          sub={`${stats?.approvedVideos ?? 0} approved`}
          color="#0f3460"
        />
        <StatCard
          title="Pending"
          value={stats?.pendingVideos ?? 0}
          sub="awaiting review"
          color="#48bb78"
        />
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <h3 style={cardTitle}>Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <QuickLink href="/dashboard/videos" label="Submit a Video" desc="Add a YouTube, TikTok or Instagram video" />
            <QuickLink href="/dashboard/leaderboard" label="View Leaderboard" desc="See where you rank vs others" />
            <QuickLink href="/dashboard/cashout" label="Request Cashout" desc="Withdraw your earnings" />
            <QuickLink href="/dashboard/challenge" label="Current Challenge" desc="See the active challenge & prize pool" />
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>Recent Videos</h3>
          {recentVideos.length === 0 ? (
            <div style={{ color: "#a0aec0", fontSize: "0.875rem" }}>
              No videos yet.{" "}
              <Link href="/dashboard/videos" style={{ color: "#e94560" }}>
                Submit your first one!
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentVideos.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0f3460", fontSize: "0.8rem", textDecoration: "none", fontWeight: 500 }}
                    >
                      {v.title ?? v.url.slice(0, 35) + "…"}
                    </a>
                    <div style={{ color: "#a0aec0", fontSize: "0.7rem", marginTop: 2, textTransform: "capitalize" }}>
                      {v.platform} · {v.currentViews.toLocaleString()} views
                    </div>
                  </div>
                  <StatusDot status={v.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, color }: { title: string; value: string | number; sub: string; color: string }) {
  return (
    <div style={{ ...card, borderTop: `3px solid ${color}`, padding: 20 }}>
      <div style={{ color: "#718096", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </div>
      <div style={{ color: "#1a1a2e", fontSize: "2rem", fontWeight: 700, margin: "8px 0 4px" }}>
        {value}
      </div>
      <div style={{ color: "#a0aec0", fontSize: "0.78rem" }}>{sub}</div>
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        backgroundColor: "#f7f8fa",
        borderRadius: 8,
        textDecoration: "none",
        border: "1px solid #e2e8f0",
        transition: "background 0.15s",
      }}
    >
      <div>
        <div style={{ color: "#1a1a2e", fontSize: "0.875rem", fontWeight: 600 }}>{label}</div>
        <div style={{ color: "#718096", fontSize: "0.75rem", marginTop: 1 }}>{desc}</div>
      </div>
      <span style={{ color: "#e94560", fontSize: "1rem" }}>→</span>
    </Link>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#f6ad55",
    approved: "#48bb78",
    rejected: "#e94560",
  };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: "0.7rem",
        fontWeight: 600,
        color: colors[status] ?? "#a0aec0",
        backgroundColor: (colors[status] ?? "#a0aec0") + "20",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 28px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  padding: 24,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
const cardTitle: React.CSSProperties = { margin: "0 0 16px", color: "#1a1a2e", fontSize: "1rem", fontWeight: 600 };
