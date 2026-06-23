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

const DEFAULT: Challenge = {
  title: "",
  description: "",
  rules: "",
  guidelines: null,
  isActive: true,
  startDate: null,
  endDate: null,
};

// Local "YYYY-MM-DDTHH:mm" for now (used as the min for the datetime pickers).
function nowLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

// Convert a stored ISO datetime to the local "YYYY-MM-DDTHH:mm" the picker wants.
function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

// Convert a picked "YYYY-MM-DDTHH:mm" value to a full ISO string for the API.
function dateInputToISO(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function ChallengePage() {
  const [data, setData] = useState<Challenge>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/challenge")
      .then((r) => r.json())
      .then((d) => {
        const c = d.data ?? DEFAULT;
        // Store date-only strings in state so the date inputs are clean.
        setData({
          ...c,
          startDate: isoToDateInput(c.startDate) || null,
          endDate: isoToDateInput(c.endDate) || null,
        });
        setLoading(false);
      });
  }, []);

  function set<K extends keyof Challenge>(key: K, value: Challenge[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (validationError) return;
    setSaving(true);
    const payload = {
      ...data,
      startDate: dateInputToISO(data.startDate ?? ""),
      endDate: dateInputToISO(data.endDate ?? ""),
    };
    const res = await fetch("/api/admin/challenge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    setSaving(false);
    setMsg({ text: d.success ? "Challenge saved!" : (d.error ?? "Failed"), ok: d.success });
    setTimeout(() => setMsg(null), 4000);
  }

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading...</div>;

  const minNow = nowLocal();
  // Validation shown live and used to guard Save.
  const validationError = !data.title.trim()
    ? "Title is required."
    : data.startDate && data.startDate < minNow
    ? "Start date/time can't be in the past."
    : data.startDate && data.endDate && data.endDate < data.startDate
    ? "End date/time must be after the start."
    : "";

  const start = data.startDate ? new Date(data.startDate) : null;
  const end = data.endDate ? new Date(data.endDate) : null;
  const now = new Date();
  const isLive = data.isActive && (!start || start <= now) && (!end || end >= now);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Challenge</h1>
      <p style={sub}>Configure the challenge shown to all users</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "12px 16px", backgroundColor: data.isActive ? "#48bb7810" : "#f7f8fa", borderRadius: 8, border: `1px solid ${data.isActive ? "#48bb7840" : "#e2e8f0"}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={data.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: data.isActive ? "#48bb78" : "#718096" }}>
                {data.isActive ? "Challenge is ACTIVE" : "Challenge is INACTIVE"}
              </span>
            </label>
          </div>

          <div style={fieldGroup}>
            <label style={lbl}>Title</label>
            <input
              value={data.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. May 2025 Views Challenge"
              style={input}
            />
          </div>

          <div style={fieldGroup}>
            <label style={lbl}>Description</label>
            <textarea
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Describe the challenge..."
              style={{ ...input, resize: "vertical" }}
            />
          </div>

          <div style={fieldGroup}>
            <label style={lbl}>Rules</label>
            <textarea
              value={data.rules}
              onChange={(e) => set("rules", e.target.value)}
              rows={5}
              placeholder="List the challenge rules..."
              style={{ ...input, resize: "vertical" }}
            />
          </div>

          <div style={fieldGroup}>
            <label style={lbl}>Guidelines <span style={{ fontWeight: 400, textTransform: "none", color: "#a0aec0" }}>(optional)</span></label>
            <textarea
              value={data.guidelines ?? ""}
              onChange={(e) => set("guidelines", e.target.value || null)}
              rows={3}
              placeholder="Additional guidelines or tips..."
              style={{ ...input, resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div style={fieldGroup}>
              <label style={lbl}>Start Date <span style={{ fontWeight: 400, textTransform: "none", color: "#a0aec0" }}>(optional)</span></label>
              <input
                type="datetime-local"
                value={data.startDate ?? ""}
                min={minNow}
                onChange={(e) => {
                  const v = e.target.value || null;
                  setData((prev) => ({
                    ...prev,
                    startDate: v,
                    // Keep end after start: clear an end that's now before start.
                    endDate: prev.endDate && v && prev.endDate < v ? null : prev.endDate,
                  }));
                }}
                style={input}
              />
            </div>
            <div style={fieldGroup}>
              <label style={lbl}>End Date <span style={{ fontWeight: 400, textTransform: "none", color: "#a0aec0" }}>(optional)</span></label>
              <input
                type="datetime-local"
                value={data.endDate ?? ""}
                min={data.startDate ?? minNow}
                onChange={(e) => set("endDate", e.target.value || null)}
                style={input}
              />
            </div>
          </div>

          {validationError && (
            <div style={{ color: "#e94560", fontSize: "0.8rem", marginBottom: 14 }}>
              {validationError}
            </div>
          )}

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
              {saving ? "Saving…" : "Save Challenge"}
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
            Live Preview
          </h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span style={{ padding: "3px 12px", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600, color: isLive ? "#48bb78" : "#a0aec0", backgroundColor: isLive ? "#48bb7820" : "#a0aec020" }}>
              {isLive ? "● LIVE" : "○ Not Live"}
            </span>
            {data.isActive && !isLive && (
              <span style={{ padding: "3px 12px", borderRadius: 12, fontSize: "0.75rem", color: "#f6ad55", backgroundColor: "#f6ad5520" }}>
                Scheduled
              </span>
            )}
          </div>
          {data.title && (
            <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 8 }}>
              {data.title}
            </div>
          )}
          {data.description && (
            <div style={{ color: "#4a5568", fontSize: "0.875rem", marginBottom: 12, lineHeight: 1.5 }}>
              {data.description}
            </div>
          )}
          {(start || end) && (
            <div style={{ fontSize: "0.75rem", color: "#718096", marginTop: 12 }}>
              {start && <div>Starts: {start.toLocaleString()}</div>}
              {end && <div>Ends: {end.toLocaleString()}</div>}
            </div>
          )}
          {!data.title && !data.description && (
            <div style={{ color: "#a0aec0", fontSize: "0.875rem" }}>
              Start filling out the form to see a preview.
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
  padding: "10px 24px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.875rem",
};
