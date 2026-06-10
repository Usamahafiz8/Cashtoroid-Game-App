"use client";
import { useEffect, useState, FormEvent } from "react";

interface MyVideo {
  id: string;
  title: string | null;
  url: string;
  platform: string;
  currentViews: number;
  status: string;
  createdAt: string;
}

const PLATFORMS = ["youtube", "tiktok", "instagram"];

export default function VideosPage() {
  const [videos, setVideos] = useState<MyVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ url: "", platform: "youtube", title: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [filter, setFilter] = useState("all");

  function loadVideos() {
    setLoading(true);
    fetch("/api/videos/my-videos")
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.data ?? []);
        setLoading(false);
      });
  }

  useEffect(() => { loadVideos(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);

    const res = await fetch("/api/videos/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setSubmitting(false);

    if (d.success) {
      setSubmitMsg({ text: "Video submitted! It will appear below once pending review.", ok: true });
      setForm({ url: "", platform: "youtube", title: "" });
      loadVideos();
    } else {
      const detail = d.details?.[0] ?? d.message ?? d.error ?? "Submission failed.";
      setSubmitMsg({ text: detail, ok: false });
    }
  }

  const filtered = filter === "all" ? videos : videos.filter((v) => v.status === filter);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>My Videos</h1>
      <p style={sub}>Submit gameplay videos and track their performance</p>

      {/* Submit form */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={cardTitle}>Submit a New Video</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Video URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                required
                placeholder="https://www.youtube.com/watch?v=..."
                style={input}
              />
            </div>
            <div>
              <label style={lbl}>Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm((p) => ({ ...p, platform: e.target.value }))}
                style={{ ...input, cursor: "pointer" }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} style={{ textTransform: "capitalize" }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Title <span style={{ fontWeight: 400, textTransform: "none", color: "#a0aec0" }}>(optional)</span></label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="My awesome gameplay clip"
              style={input}
            />
          </div>

          {submitMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                marginBottom: 12,
                fontSize: "0.875rem",
                color: submitMsg.ok ? "#276749" : "#e94560",
                backgroundColor: submitMsg.ok ? "#f0fff4" : "#fff5f5",
                border: `1px solid ${submitMsg.ok ? "#9ae6b4" : "#fed7d7"}`,
              }}
            >
              {submitMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...btn,
              backgroundColor: submitting ? "#a0aec0" : "#e94560",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit Video"}
          </button>
        </form>
      </div>

      {/* Video list */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8rem",
              backgroundColor: filter === s ? "#0f3460" : "#e2e8f0",
              color: filter === s ? "#fff" : "#4a5568",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#718096" }}>Loading videos…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, color: "#a0aec0", textAlign: "center", padding: 40 }}>
          {filter === "all" ? "No videos submitted yet." : `No ${filter} videos.`}
        </div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title / URL", "Platform", "Views", "Status", "Submitted"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                  <td style={{ ...td, maxWidth: 300 }}>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#0f3460", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 }}
                    >
                      {v.title ?? v.url.slice(0, 50) + "…"}
                    </a>
                  </td>
                  <td style={td}>
                    <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: "0.72rem", fontWeight: 600, backgroundColor: "#0f346015", color: "#0f3460", textTransform: "capitalize" }}>
                      {v.platform}
                    </span>
                  </td>
                  <td style={td}>{v.currentViews.toLocaleString()}</td>
                  <td style={td}>
                    <StatusBadge status={v.status} />
                  </td>
                  <td style={{ ...td, color: "#718096", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                    {new Date(v.createdAt).toLocaleDateString()}
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
    <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600, color, backgroundColor: bg }}>
      {status}
    </span>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 24px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const cardTitle: React.CSSProperties = { margin: "0 0 16px", color: "#1a1a2e", fontSize: "1rem", fontWeight: 600 };
const lbl: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#4a5568", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" };
const input: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" };
const btn: React.CSSProperties = { padding: "10px 24px", border: "none", borderRadius: 6, fontWeight: 700, color: "#fff", fontSize: "0.875rem" };
const tableWrap: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "auto" };
const th: React.CSSProperties = { padding: "11px 16px", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#718096", backgroundColor: "#f7f8fa", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 16px", fontSize: "0.875rem", borderBottom: "1px solid #f0f0f0", verticalAlign: "middle" };
