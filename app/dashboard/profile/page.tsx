"use client";
import { useEffect, useState, FormEvent } from "react";

interface Profile {
  id: string;
  username: string;
  email: string;
  payoutInfo: string | null;
  isPaid: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [pForm, setPForm] = useState({ username: "", email: "", payoutInfo: "" });
  const [pSaving, setPSaving] = useState(false);
  const [pMsg, setPMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.data ?? null);
        if (d.data) {
          setPForm({
            username: d.data.username,
            email: d.data.email,
            payoutInfo: d.data.payoutInfo ?? "",
          });
        }
        setLoading(false);
      });
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setPMsg(null);
    setPSaving(true);

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: pForm.username || undefined,
        email: pForm.email || undefined,
        payoutInfo: pForm.payoutInfo || undefined,
      }),
    });
    const d = await res.json();
    setPSaving(false);

    if (d.success) {
      setProfile(d.data);
      setPMsg({ text: "Profile updated!", ok: true });
    } else {
      setPMsg({ text: d.error ?? "Update failed.", ok: false });
    }
    setTimeout(() => setPMsg(null), 3000);
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ text: "New passwords do not match.", ok: false });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ text: "Password must be at least 6 characters.", ok: false });
      return;
    }

    setPwSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }),
    });
    const d = await res.json();
    setPwSaving(false);

    if (d.success) {
      setPwMsg({ text: "Password changed successfully!", ok: true });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } else {
      setPwMsg({ text: d.error ?? "Failed to change password.", ok: false });
    }
    setTimeout(() => setPwMsg(null), 4000);
  }

  if (loading) return <div style={{ padding: 32, color: "#718096" }}>Loading…</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Profile Settings</h1>
      <p style={sub}>Manage your account information and security</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Profile info */}
        <div style={card}>
          <h3 style={cardTitle}>Account Info</h3>

          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, padding: "12px 16px", backgroundColor: "#f7f8fa", borderRadius: 8 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "#e94560",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#1a1a2e" }}>{profile.username}</div>
                <div style={{ color: "#718096", fontSize: "0.8rem" }}>{profile.email}</div>
                <div style={{ color: "#a0aec0", fontSize: "0.72rem", marginTop: 2 }}>
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={saveProfile}>
            <Field label="Username">
              <input
                value={pForm.username}
                onChange={(e) => setPForm((p) => ({ ...p, username: e.target.value }))}
                minLength={3}
                maxLength={20}
                required
                style={input}
              />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                value={pForm.email}
                onChange={(e) => setPForm((p) => ({ ...p, email: e.target.value }))}
                required
                style={input}
              />
            </Field>
            <Field label="Payout Info">
              <div style={{ color: "#a0aec0", fontSize: "0.72rem", marginBottom: 5 }}>
                PayPal email, crypto address, bank details, etc.
              </div>
              <textarea
                value={pForm.payoutInfo}
                onChange={(e) => setPForm((p) => ({ ...p, payoutInfo: e.target.value }))}
                rows={3}
                placeholder="e.g. paypal@example.com"
                style={{ ...input, resize: "vertical" }}
              />
            </Field>

            {pMsg && <MsgBox msg={pMsg} />}

            <button
              type="submit"
              disabled={pSaving}
              style={{ ...btn, backgroundColor: pSaving ? "#a0aec0" : "#0f3460", cursor: pSaving ? "not-allowed" : "pointer" }}
            >
              {pSaving ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={card}>
          <h3 style={cardTitle}>Change Password</h3>
          <p style={{ color: "#718096", fontSize: "0.875rem", marginBottom: 20 }}>
            Choose a strong password with at least 6 characters.
          </p>

          <form onSubmit={changePassword}>
            <Field label="Current Password">
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                required
                placeholder="Your current password"
                style={input}
              />
            </Field>
            <Field label="New Password">
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                style={input}
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                required
                placeholder="Repeat new password"
                style={input}
              />
            </Field>

            {pwMsg && <MsgBox msg={pwMsg} />}

            <button
              type="submit"
              disabled={pwSaving}
              style={{ ...btn, backgroundColor: pwSaving ? "#a0aec0" : "#e94560", cursor: pwSaving ? "not-allowed" : "pointer" }}
            >
              {pwSaving ? "Changing…" : "Change Password"}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: "12px 16px", backgroundColor: "#fffbeb", borderRadius: 8, border: "1px solid #fcd34d" }}>
            <div style={{ color: "#92400e", fontSize: "0.78rem" }}>
              <strong>Forgot your password?</strong> Sign out and use the{" "}
              <a href="/reset-password" style={{ color: "#e94560", textDecoration: "none" }}>
                Reset Password
              </a>{" "}
              flow on the login page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  );
}

function MsgBox({ msg }: { msg: { text: string; ok: boolean } }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 6,
        marginBottom: 12,
        fontSize: "0.875rem",
        color: msg.ok ? "#276749" : "#e94560",
        backgroundColor: msg.ok ? "#f0fff4" : "#fff5f5",
        border: `1px solid ${msg.ok ? "#9ae6b4" : "#fed7d7"}`,
      }}
    >
      {msg.text}
    </div>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 24px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const cardTitle: React.CSSProperties = { margin: "0 0 16px", color: "#1a1a2e", fontSize: "1rem", fontWeight: 600 };
const lbl: React.CSSProperties = { display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#4a5568", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" };
const input: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", boxSizing: "border-box", outline: "none", backgroundColor: "#fff" };
const btn: React.CSSProperties = { padding: "10px 24px", border: "none", borderRadius: 6, fontWeight: 700, color: "#fff", fontSize: "0.875rem" };
