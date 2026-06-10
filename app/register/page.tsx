"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        password: form.password,
      }),
    });
    const d = await res.json();
    setLoading(false);

    if (d.success) {
      router.push("/login?registered=1");
    } else {
      setError(d.message ?? d.error ?? "Registration failed.");
    }
  }

  return (
    <div style={page}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={logo}>CASHTOROID</div>
          <div style={{ color: "#a0aec0", fontSize: "0.875rem", marginTop: 6 }}>
            Create your account
          </div>
        </div>

        <div style={card}>
          <h2 style={heading}>Register</h2>
          <p style={subText}>Join the Cashtoroid rewards platform</p>

          {error && <div style={errBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <Field label="Username">
              <input
                value={form.username}
                onChange={set("username")}
                required
                minLength={3}
                maxLength={20}
                placeholder="e.g. gamer_pro99"
                style={input}
              />
            </Field>
            <Field label="Email Address">
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="you@example.com"
                style={input}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                placeholder="Min. 6 characters"
                style={input}
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                required
                placeholder="Repeat your password"
                style={input}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...submitBtn,
                backgroundColor: loading ? "#a0aec0" : "#e94560",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, color: "#718096", fontSize: "0.875rem" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#e94560", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: "#4a5568", fontSize: "0.75rem" }}>
          Cashtoroid &copy; Content Rewards Platform
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "system-ui, -apple-system, sans-serif",
  padding: 16,
};
const logo: React.CSSProperties = {
  color: "#e94560",
  fontWeight: 900,
  fontSize: "1.8rem",
  letterSpacing: "2px",
};
const card: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: "36px 32px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
};
const heading: React.CSSProperties = {
  margin: "0 0 4px",
  color: "#1a1a2e",
  fontSize: "1.25rem",
  fontWeight: 700,
};
const subText: React.CSSProperties = {
  margin: "0 0 24px",
  color: "#718096",
  fontSize: "0.875rem",
};
const errBox: React.CSSProperties = {
  backgroundColor: "#fff5f5",
  border: "1px solid #fed7d7",
  borderRadius: 6,
  padding: "10px 14px",
  marginBottom: 18,
  color: "#e94560",
  fontSize: "0.875rem",
};
const lbl: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "#4a5568",
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: "0.95rem",
  boxSizing: "border-box",
  outline: "none",
  backgroundColor: "#f7f8fa",
  color: "#1a1a2e",
};
const submitBtn: React.CSSProperties = {
  width: "100%",
  padding: 12,
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: "1rem",
  color: "#fff",
  marginTop: 8,
  transition: "background 0.15s",
};
