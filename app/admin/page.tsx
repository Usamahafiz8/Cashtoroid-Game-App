"use client";
import { useEffect, useState } from "react";

interface Stats {
  users: { total: number; admins: number };
  videos: { total: number; pending: number; approved: number; rejected: number };
  transactions: { total: number; pending: number; approved: number };
  prizePool: { totalAmount: number; currency: string };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/videos").then((r) => r.json()),
      fetch("/api/admin/transactions").then((r) => r.json()),
      fetch("/api/admin/prize-pool").then((r) => r.json()),
    ]).then(([users, videos, tx, pp]) => {
      setStats({
        users: {
          total: users.data?.length ?? 0,
          admins:
            users.data?.filter((u: { role: string }) => u.role === "admin")
              .length ?? 0,
        },
        videos: {
          total: videos.data?.length ?? 0,
          pending:
            videos.data?.filter(
              (v: { status: string }) => v.status === "pending"
            ).length ?? 0,
          approved:
            videos.data?.filter(
              (v: { status: string }) => v.status === "approved"
            ).length ?? 0,
          rejected:
            videos.data?.filter(
              (v: { status: string }) => v.status === "rejected"
            ).length ?? 0,
        },
        transactions: {
          total: tx.data?.length ?? 0,
          pending:
            tx.data?.filter(
              (t: { status: string }) => t.status === "pending"
            ).length ?? 0,
          approved:
            tx.data?.filter(
              (t: { status: string }) => t.status === "approved"
            ).length ?? 0,
        },
        prizePool: {
          totalAmount: pp.data?.totalAmount ?? 0,
          currency: pp.data?.currency ?? "USD",
        },
      });
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Dashboard</h1>
      <p style={sub}>Welcome to the Cashtoroid Admin Panel</p>

      {loading ? (
        <div style={{ color: "#718096" }}>Loading stats...</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard
              title="Total Users"
              value={stats!.users.total}
              sub={`${stats!.users.admins} admin${stats!.users.admins !== 1 ? "s" : ""}`}
              color="#0f3460"
            />
            <StatCard
              title="Total Videos"
              value={stats!.videos.total}
              sub={`${stats!.videos.pending} pending review`}
              color="#e94560"
            />
            <StatCard
              title="Transactions"
              value={stats!.transactions.total}
              sub={`${stats!.transactions.pending} awaiting approval`}
              color="#f6ad55"
            />
            <StatCard
              title="Prize Pool"
              value={`$${stats!.prizePool.totalAmount.toLocaleString()}`}
              sub={stats!.prizePool.currency}
              color="#48bb78"
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div style={card}>
              <h3 style={cardTitle}>Video Status Breakdown</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <StatusRow
                  label="Pending"
                  value={stats!.videos.pending}
                  color="#f6ad55"
                />
                <StatusRow
                  label="Approved"
                  value={stats!.videos.approved}
                  color="#48bb78"
                />
                <StatusRow
                  label="Rejected"
                  value={stats!.videos.rejected}
                  color="#e94560"
                />
              </div>
            </div>
            <div style={card}>
              <h3 style={cardTitle}>Transaction Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <StatusRow
                  label="Pending"
                  value={stats!.transactions.pending}
                  color="#f6ad55"
                />
                <StatusRow
                  label="Approved"
                  value={stats!.transactions.approved}
                  color="#48bb78"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div style={{ ...card, borderTop: `3px solid ${color}`, padding: 20 }}>
      <div
        style={{
          color: "#718096",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: "#1a1a2e",
          fontSize: "2rem",
          fontWeight: 700,
          margin: "8px 0 4px",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#a0aec0", fontSize: "0.8rem" }}>{sub}</div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <span style={{ color: "#4a5568", fontSize: "0.875rem" }}>{label}</span>
      <span
        style={{
          backgroundColor: color + "25",
          color,
          padding: "2px 12px",
          borderRadius: 12,
          fontSize: "0.8rem",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

const h1: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#1a1a2e",
  fontSize: "1.5rem",
  fontWeight: 700,
};
const sub: React.CSSProperties = {
  margin: "0 0 28px",
  color: "#718096",
  fontSize: "0.875rem",
};
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
