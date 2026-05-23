"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(data.data.message);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>Reset Password</h1>
      <p style={styles.subtitle}>Enter your new password below.</p>

      {status === "success" ? (
        <div style={styles.successBox}>
          <p style={{ margin: 0 }}>{message}</p>
          <a href="/" style={styles.link}>Back to home</a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            style={styles.input}
          />

          <label style={styles.label}>Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            required
            style={styles.input}
          />

          {status === "error" && (
            <p style={styles.errorText}>{message}</p>
          )}

          <button type="submit" disabled={status === "loading"} style={styles.button}>
            {status === "loading" ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={styles.page}>
      <Suspense fallback={<div style={styles.card}><p>Loading…</p></div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    fontFamily: "sans-serif",
    padding: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0f3460",
  },
  subtitle: {
    margin: "0 0 28px",
    color: "#6b7280",
    fontSize: "0.95rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#374151",
    marginTop: "12px",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "1rem",
    outline: "none",
  },
  button: {
    marginTop: "20px",
    padding: "12px",
    background: "#e94560",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  errorText: {
    color: "#dc2626",
    fontSize: "0.875rem",
    margin: "8px 0 0",
  },
  successBox: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "16px",
    color: "#166534",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  link: {
    color: "#0f3460",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
};
