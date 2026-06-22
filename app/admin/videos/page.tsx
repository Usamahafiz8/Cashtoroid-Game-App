"use client";
import { useEffect, useMemo, useState } from "react";

interface AdminVideo {
  id: string;
  url: string;
  platform: string;
  title: string | null;
  currentViews: number;
  status: string;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
  user: { id: string; username: string; email: string };
}

const STATUSES = ["all", "pending", "approved", "rejected"] as const;
type StatusFilter = (typeof STATUSES)[number];

export default function VideosPage() {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [flagReasons, setFlagReasons] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/videos")
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.data ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  function flash(id: string, text: string, ok: boolean) {
    setMsg({ id, text, ok });
    setTimeout(() => setMsg(null), 2500);
  }

  async function updateStatus(videoId: string, status: string, flagReason?: string) {
    setBusy(videoId + "-status");
    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        status,
        ...(flagReason ? { flagReason } : {}),
      }),
    });
    const d = await res.json();
    if (d.success) {
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, status, isFlagged: !!flagReason, flagReason: flagReason ?? null }
            : v
        )
      );
      setRejectingId(null);
      flash(videoId, status === "approved" ? "Approved" : "Rejected", true);
    } else {
      flash(videoId, d.error ?? "Failed", false);
    }
    setBusy(null);
  }

  async function deleteVideo(videoId: string, title: string | null) {
    if (!confirm(`Delete video "${title ?? videoId}"? This cannot be undone.`)) return;
    setBusy(videoId + "-del");
    const res = await fetch(`/api/admin/videos/${videoId}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
    } else {
      flash(videoId, d.error ?? "Failed to delete", false);
    }
    setBusy(null);
  }

  const counts = useMemo(() => {
    const c = { all: videos.length, pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
    for (const v of videos) c[v.status] = (c[v.status] ?? 0) + 1;
    return c;
  }, [videos]);

  const totalViews = useMemo(
    () => videos.reduce((s, v) => s + (v.currentViews || 0), 0),
    [videos]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (v.title ?? "").toLowerCase().includes(q) ||
        v.url.toLowerCase().includes(q) ||
        v.user.username.toLowerCase().includes(q) ||
        v.user.email.toLowerCase().includes(q)
      );
    });
  }, [videos, statusFilter, search]);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={h1}>Videos</h1>
          <p style={sub}>Review, approve, and moderate submitted videos</p>
        </div>
        <button onClick={load} style={refreshBtn} disabled={loading}>
          ⟳ Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Videos" value={counts.all} color="#0f3460" />
        <StatCard label="Pending Review" value={counts.pending ?? 0} color="#f6ad55" />
        <StatCard label="Approved" value={counts.approved ?? 0} color="#48bb78" />
        <StatCard label="Total Views" value={totalViews} color="#e94560" />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                ...filterBtn,
                backgroundColor: statusFilter === s ? "#0f3460" : "#edf2f7",
                color: statusFilter === s ? "#fff" : "#4a5568",
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span style={{ opacity: 0.7, marginLeft: 6 }}>{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
        <input
          placeholder="Search title, user, or URL…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...input, maxWidth: 320, marginLeft: "auto" }}
        />
      </div>

      {loading ? (
        <div style={{ color: "#718096" }}>Loading videos...</div>
      ) : filtered.length === 0 ? (
        <div style={emptyBox}>No videos match this view.</div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Video", "User", "Views", "Status", "Submitted", "Actions"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((video, i) => (
                <tr
                  key={video.id}
                  style={{
                    backgroundColor:
                      video.status === "pending" ? "#fffaf0" : i % 2 === 0 ? "#fff" : "#f9fafb",
                  }}
                >
                  {/* Video */}
                  <td style={{ ...td, maxWidth: 320 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <PlatformIcon platform={video.platform} />
                      <div style={{ minWidth: 0 }}>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#0f3460",
                            textDecoration: "none",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={video.title ?? video.url}
                        >
                          {video.title ?? video.url}
                        </a>
                        <div style={{ color: "#a0aec0", fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {video.url}
                        </div>
                        {video.isFlagged && video.flagReason && (
                          <div style={{ color: "#e94560", fontSize: "0.72rem", marginTop: 3 }}>
                            ⚠ {video.flagReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* User */}
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: "0.82rem" }}>
                      {video.user.username}
                    </div>
                    <div style={{ color: "#a0aec0", fontSize: "0.72rem" }}>
                      {video.user.email}
                    </div>
                  </td>

                  {/* Views */}
                  <td style={{ ...td, fontWeight: 600, color: "#1a1a2e" }}>
                    {video.currentViews.toLocaleString()}
                  </td>

                  {/* Status */}
                  <td style={td}>
                    <StatusBadge status={video.status} />
                  </td>

                  {/* Submitted */}
                  <td style={{ ...td, color: "#718096", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                    {new Date(video.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td style={{ ...td, minWidth: 200 }}>
                    {rejectingId === video.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          autoFocus
                          placeholder="Reason for rejection"
                          value={flagReasons[video.id] ?? ""}
                          onChange={(e) =>
                            setFlagReasons((prev) => ({ ...prev, [video.id]: e.target.value }))
                          }
                          style={inputSm}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => updateStatus(video.id, "rejected", flagReasons[video.id] || "Rejected by admin")}
                            disabled={busy === video.id + "-status"}
                            style={{ ...btnSm, backgroundColor: "#e94560" }}
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            style={{ ...btnSm, backgroundColor: "#a0aec0" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {video.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(video.id, "approved")}
                            disabled={busy === video.id + "-status"}
                            style={{ ...btnSm, backgroundColor: "#48bb78" }}
                          >
                            ✓ Approve
                          </button>
                        )}
                        {video.status !== "rejected" && (
                          <button
                            onClick={() => setRejectingId(video.id)}
                            disabled={busy === video.id + "-status"}
                            style={{ ...btnSm, backgroundColor: "#ed8936" }}
                          >
                            ✕ Reject
                          </button>
                        )}
                        <button
                          onClick={() => deleteVideo(video.id, video.title)}
                          disabled={!!busy}
                          style={{ ...btnSm, backgroundColor: "#fff", color: "#c53030", border: "1px solid #fed7d7" }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {msg?.id === video.id && (
                      <div style={{ color: msg.ok ? "#48bb78" : "#e94560", fontSize: "0.72rem", marginTop: 4 }}>
                        {msg.text}
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

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
      <div style={{ color: "#718096", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a1a2e", marginTop: 4 }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const [bg, fg, icon] =
    p === "youtube"
      ? ["#ff000015", "#ff0000", "▶"]
      : p === "tiktok"
      ? ["#1a1a2e15", "#1a1a2e", "♪"]
      : ["#0f346015", "#0f3460", "●"];
  return (
    <span
      style={{
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: 6,
        backgroundColor: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.85rem",
      }}
      title={platform}
    >
      {icon}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["#dd6b20", "#f6ad5522"],
    approved: ["#2f855a", "#48bb7822"],
    rejected: ["#c53030", "#e9456022"],
  };
  const [color, bg] = map[status] ?? ["#a0aec0", "#a0aec022"];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: "0.72rem",
        fontWeight: 700,
        color,
        backgroundColor: bg,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 20px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  padding: "14px 16px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
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
  padding: "12px 16px",
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
const refreshBtn: React.CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.8rem",
  backgroundColor: "#fff",
  color: "#4a5568",
};
const btnSm: React.CSSProperties = {
  padding: "5px 12px",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
};
const input: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.875rem",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};
const inputSm: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 5,
  fontSize: "0.78rem",
  boxSizing: "border-box",
  outline: "none",
  width: "100%",
};
const emptyBox: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  padding: 40,
  textAlign: "center",
  color: "#718096",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};
