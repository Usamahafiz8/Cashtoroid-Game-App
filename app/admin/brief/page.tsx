"use client";
import { useEffect, useState } from "react";

interface BriefSection {
  title: string;
  description: string;
}

interface BriefInstruction {
  step: number;
  heading: string;
  sections: BriefSection[];
}

interface BriefEarnings {
  likes: number;
  comments: number;
  views: number;
  total: number;
  currency: string;
}

interface Brief {
  projectTitle: string;
  titleDescription: string;
  descriptionTitle: string;
  description: string;
  instructionsTitle: string;
  instructions: BriefInstruction[];
  earnings: BriefEarnings;
  rules: string[];
  isActive: boolean;
}

const DEFAULT: Brief = {
  projectTitle: "",
  titleDescription: "",
  descriptionTitle: "",
  description: "",
  instructionsTitle: "",
  instructions: [],
  earnings: { likes: 0, comments: 0, views: 0, total: 0, currency: "USD" },
  rules: [],
  isActive: true,
};

export default function BriefPage() {
  const [data, setData] = useState<Brief>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/brief")
      .then((r) => r.json())
      .then((d) => {
        setData(d.data ? { ...DEFAULT, ...d.data } : DEFAULT);
        setLoading(false);
      });
  }, []);

  function set<K extends keyof Brief>(key: K, value: Brief[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function setEarnings<K extends keyof BriefEarnings>(key: K, value: BriefEarnings[K]) {
    setData((prev) => ({ ...prev, earnings: { ...prev.earnings, [key]: value } }));
  }

  function addInstruction() {
    setData((prev) => ({
      ...prev,
      instructions: [
        ...prev.instructions,
        { step: prev.instructions.length + 1, heading: "", sections: [{ title: "", description: "" }] },
      ],
    }));
  }

  function removeInstruction(idx: number) {
    setData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== idx).map((ins, i) => ({ ...ins, step: i + 1 })),
    }));
  }

  function updateInstruction(idx: number, heading: string) {
    setData((prev) => ({
      ...prev,
      instructions: prev.instructions.map((ins, i) => (i === idx ? { ...ins, heading } : ins)),
    }));
  }

  function addSection(insIdx: number) {
    setData((prev) => ({
      ...prev,
      instructions: prev.instructions.map((ins, i) =>
        i === insIdx ? { ...ins, sections: [...ins.sections, { title: "", description: "" }] } : ins
      ),
    }));
  }

  function removeSection(insIdx: number, secIdx: number) {
    setData((prev) => ({
      ...prev,
      instructions: prev.instructions.map((ins, i) =>
        i === insIdx ? { ...ins, sections: ins.sections.filter((_, j) => j !== secIdx) } : ins
      ),
    }));
  }

  function updateSection(insIdx: number, secIdx: number, field: keyof BriefSection, value: string) {
    setData((prev) => ({
      ...prev,
      instructions: prev.instructions.map((ins, i) =>
        i === insIdx
          ? { ...ins, sections: ins.sections.map((s, j) => (j === secIdx ? { ...s, [field]: value } : s)) }
          : ins
      ),
    }));
  }

  function addRule() {
    setData((prev) => ({ ...prev, rules: [...prev.rules, ""] }));
  }

  function removeRule(idx: number) {
    setData((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }));
  }

  function updateRule(idx: number, value: string) {
    setData((prev) => ({ ...prev, rules: prev.rules.map((r, i) => (i === idx ? value : r)) }));
  }

  async function save() {
    if (validationError) return;
    setSaving(true);
    const res = await fetch("/api/admin/brief", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    setSaving(false);
    setMsg({ text: d.success ? "Brief saved!" : (d.error ?? "Failed"), ok: d.success });
    setTimeout(() => setMsg(null), 4000);
  }

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading...</div>;

  const validationError = !data.projectTitle.trim() ? "Project title is required." : "";
  const total = data.earnings.likes + data.earnings.comments + data.earnings.views;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Brief & Guidelines</h1>
      <p style={sub}>Configure the Brief & Guidelines screen content shown to creators</p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "12px 16px", backgroundColor: data.isActive ? "#48bb7810" : "#f7f8fa", borderRadius: 8, border: `1px solid ${data.isActive ? "#48bb7840" : "#e2e8f0"}`, maxWidth: 720 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={data.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: data.isActive ? "#48bb78" : "#718096" }}>
            {data.isActive ? "Brief is ACTIVE" : "Brief is INACTIVE"}
          </span>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 720 }}>
        <div style={card}>
          <div style={sectionLabel}>Project Overview</div>

          <div style={fieldGroup}>
            <label style={lbl}>Project Title</label>
            <input value={data.projectTitle} onChange={(e) => set("projectTitle", e.target.value)} placeholder="e.g. What Posted Is" style={input} />
          </div>
          <div style={fieldGroup}>
            <label style={lbl}>Title Description</label>
            <textarea value={data.titleDescription} onChange={(e) => set("titleDescription", e.target.value)} rows={2} style={{ ...input, resize: "vertical" }} />
          </div>
          <div style={fieldGroup}>
            <label style={lbl}>Description Title</label>
            <input value={data.descriptionTitle} onChange={(e) => set("descriptionTitle", e.target.value)} placeholder="e.g. What Are You Looking For" style={input} />
          </div>
          <div style={fieldGroup}>
            <label style={lbl}>Description</label>
            <textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={4} style={{ ...input, resize: "vertical" }} />
          </div>
        </div>

        <div style={card}>
          <div style={sectionLabel}>Video Instructions</div>
          <div style={fieldGroup}>
            <label style={lbl}>Instructions Title</label>
            <input value={data.instructionsTitle} onChange={(e) => set("instructionsTitle", e.target.value)} placeholder="e.g. How to Make Your Video" style={input} />
          </div>

          {data.instructions.map((ins, insIdx) => (
            <div key={insIdx} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: "#0f3460", fontSize: "0.85rem" }}>Step {ins.step}</span>
                <button onClick={() => removeInstruction(insIdx)} style={removeBtn}>Remove step</button>
              </div>
              <div style={fieldGroup}>
                <label style={lbl}>Heading</label>
                <input value={ins.heading} onChange={(e) => updateInstruction(insIdx, e.target.value)} placeholder="e.g. The Hook" style={input} />
              </div>

              {ins.sections.map((sec, secIdx) => (
                <div key={secIdx} style={{ paddingLeft: 12, borderLeft: "2px solid #f0f0f0", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <input
                      value={sec.title}
                      onChange={(e) => updateSection(insIdx, secIdx, "title", e.target.value)}
                      placeholder="Section title (e.g. Visual, Script)"
                      style={{ ...input, flex: "0 0 220px" }}
                    />
                    <button onClick={() => removeSection(insIdx, secIdx)} style={removeBtn}>Remove</button>
                  </div>
                  <textarea
                    value={sec.description}
                    onChange={(e) => updateSection(insIdx, secIdx, "description", e.target.value)}
                    rows={2}
                    placeholder="Section description"
                    style={{ ...input, resize: "vertical" }}
                  />
                </div>
              ))}
              <button onClick={() => addSection(insIdx)} style={addBtn}>+ Add section</button>
            </div>
          ))}
          <button onClick={addInstruction} style={addBtn}>+ Add step</button>
        </div>

        <div style={card}>
          <div style={sectionLabel}>Earnings Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={fieldGroup}>
              <label style={lbl}>Per Like</label>
              <input type="number" min={0} step="0.01" value={data.earnings.likes} onChange={(e) => setEarnings("likes", Number(e.target.value))} style={input} />
            </div>
            <div style={fieldGroup}>
              <label style={lbl}>Per Comment</label>
              <input type="number" min={0} step="0.01" value={data.earnings.comments} onChange={(e) => setEarnings("comments", Number(e.target.value))} style={input} />
            </div>
            <div style={fieldGroup}>
              <label style={lbl}>Per View</label>
              <input type="number" min={0} step="0.01" value={data.earnings.views} onChange={(e) => setEarnings("views", Number(e.target.value))} style={input} />
            </div>
            <div style={fieldGroup}>
              <label style={lbl}>Currency</label>
              <input value={data.earnings.currency} onChange={(e) => setEarnings("currency", e.target.value)} style={input} />
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#718096" }}>
            Total earnings shown to creators:{" "}
            <strong style={{ color: "#0f3460" }}>
              {data.earnings.currency} {total.toLocaleString()}
            </strong>{" "}
            (sum of the three rates above)
          </div>
        </div>

        <div style={card}>
          <div style={sectionLabel}>Rules</div>
          {data.rules.map((rule, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={rule} onChange={(e) => updateRule(idx, e.target.value)} style={input} placeholder="e.g. Content must be in English" />
              <button onClick={() => removeRule(idx)} style={removeBtn}>Remove</button>
            </div>
          ))}
          <button onClick={addRule} style={addBtn}>+ Add rule</button>
        </div>

        {validationError && (
          <div style={{ color: "#e94560", fontSize: "0.8rem" }}>{validationError}</div>
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
            {saving ? "Saving…" : "Save Brief"}
          </button>
          {msg && (
            <span style={{ color: msg.ok ? "#48bb78" : "#e94560", fontSize: "0.875rem" }}>{msg.text}</span>
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
const sectionLabel: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#718096",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 14,
};
const addBtn: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px dashed #0f3460",
  borderRadius: 6,
  background: "transparent",
  color: "#0f3460",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};
const removeBtn: React.CSSProperties = {
  padding: "5px 10px",
  border: "1px solid #e94560",
  borderRadius: 6,
  background: "transparent",
  color: "#e94560",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
