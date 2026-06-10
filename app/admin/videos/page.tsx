"use client";
import { useEffect, useState } from "react";

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

export default function VideosPage() {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [flagReasons, setFlagReasons] = useState<Record<string, string>>({});
  const [manualViews, setManualViews] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    const url =
      statusFilter !== "all"
        ? `/api/admin/videos?status=${statusFilter}`
        : "/api/admin/videos";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.data ?? []);
        setLoading(false);
      });
  }, [statusFilter]);

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
      flash(videoId, "Status updated", true);
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

  async function setViews(videoId: string) {
    const views = parseInt(manualViews[videoId] ?? "");
    if (isNaN(views) || views < 0) return;
    setBusy(videoId + "-views");
    const res = await fetch("/api/admin/manual-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, views }),
    });
    const d = await res.json();
    if (d.success) {
      setVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, currentViews: views } : v))
      );
      setManualViews((prev) => ({ ...prev, [videoId]: "" }));
      flash(videoId, "Views updated", true);
    } else {
      flash(videoId, d.error ?? "Failed", false);
    }
    setBusy(null);
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Videos</h1>
      <p style={sub}>{videos.length} videos{statusFilter !== "all" ? ` (${statusFilter})` : ""}</p>

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
        <div style={{ color: "#718096" }}>Loading videos...</div>
      ) : videos.length === 0 ? (
        <div style={{ color: "#718096" }}>No videos found.</div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title / URL", "Platform", "User", "Views", "Status", "Actions"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {videos.map((video, i) => (
                <tr
                  key={video.id}
                  style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}
                >
                  <td style={{ ...td, maxWidth: 260 }}>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0f3460",
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                      }}
                    >
                      {video.title ?? video.url.slice(0, 50) + "…"}
                    </a>
                    {video.isFlagged && (
                      <div
                        style={{
                          color: "#e94560",
                          fontSize: "0.72rem",
                          marginTop: 3,
                        }}
                      >
                        ⚠ {video.flagReason}
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        backgroundColor: "#0f346015",
                        color: "#0f3460",
                        textTransform: "capitalize",
                      }}
                    >
                      {video.platform}
                    </span>
                  </td>
                  <td style={{ ...td, fontSize: "0.8rem" }}>
                    {video.user.username}
                  </td>
                  <td style={td}>{video.currentViews.toLocaleString()}</td>
                  <td style={td}>
                    <StatusBadge status={video.status} />
                  </td>
                  <td style={{ ...td, minWidth: 220 }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      {video.status !== "approved" && (
                        <button
                          onClick={() => updateStatus(video.id, "approved")}
                          disabled={busy === video.id + "-status"}
                          style={{ ...btnSm, backgroundColor: "#48bb78" }}
                        >
                          Approve
                        </button>
                      )}
                      {video.status !== "rejected" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input
                            placeholder="Flag reason"
                            value={flagReasons[video.id] ?? ""}
                            onChange={(e) =>
                              setFlagReasons((prev) => ({
                                ...prev,
                                [video.id]: e.target.value,
                              }))
                            }
                            style={{ ...inputSm, flex: 1 }}
                          />
                          <button
                            onClick={() =>
                              updateStatus(
                                video.id,
                                "rejected",
                                flagReasons[video.id]
                              )
                            }
                            disabled={busy === video.id + "-status"}
                            style={{ ...btnSm, backgroundColor: "#e94560" }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 4 }}>
                        <input
                          type="number"
                          placeholder="Set views"
                          value={manualViews[video.id] ?? ""}
                          onChange={(e) =>
                            setManualViews((prev) => ({
                              ...prev,
                              [video.id]: e.target.value,
                            }))
                          }
                          style={{ ...inputSm, width: 90 }}
                        />
                        <button
                          onClick={() => setViews(video.id)}
                          disabled={busy === video.id + "-views"}
                          style={{ ...btnSm, backgroundColor: "#718096" }}
                        >
                          Set Views
                        </button>
                      </div>
                      <button
                        onClick={() => deleteVideo(video.id, video.title)}
                        disabled={!!busy}
                        style={{ ...btnSm, backgroundColor: "#c53030" }}
                      >
                        Delete
                      </button>
                      {msg?.id === video.id && (
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
  padding: "4px 10px",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
};
const inputSm: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #e2e8f0",
  borderRadius: 5,
  fontSize: "0.75rem",
  boxSizing: "border-box",
  outline: "none",
};
