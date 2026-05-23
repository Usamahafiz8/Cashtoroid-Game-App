"use client";

import { useState } from "react";

type Step = "email" | "otp" | "success";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("success");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.header}>
          <h1 style={s.title}>Cashtoroid</h1>
        </div>

        {step === "email" && (
          <>
            <h2 style={s.heading}>Forgot Password</h2>
            <p style={s.sub}>Enter your email and we'll send you a 6-digit OTP.</p>
            <form onSubmit={requestOtp} style={s.form}>
              <label style={s.label}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={s.input}
              />
              {error && <p style={s.error}>{error}</p>}
              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? "Sending OTP…" : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <h2 style={s.heading}>Enter OTP</h2>
            <p style={s.sub}>
              A 6-digit code was sent to <strong>{email}</strong>. It expires in 15 minutes.
            </p>
            <form onSubmit={resetPassword} style={s.form}>
              <label style={s.label}>OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                style={{ ...s.input, letterSpacing: "8px", fontSize: "1.4rem", textAlign: "center" }}
              />

              <label style={s.label}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                style={s.input}
              />

              <label style={s.label}>Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                required
                style={s.input}
              />

              {error && <p style={s.error}>{error}</p>}

              <button type="submit" disabled={loading} style={s.btn}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setOtp(""); }}
                style={s.ghost}
              >
                Didn't receive code? Go back
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div style={s.successBox}>
            <div style={s.checkmark}>✓</div>
            <h2 style={{ ...s.heading, color: "#166534" }}>Password Reset!</h2>
            <p style={s.sub}>Your password has been updated. You can now log in.</p>
            <a href="/" style={s.btn}>Back to Home</a>
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
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
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  header: {
    background: "linear-gradient(135deg, #0f3460, #e94560)",
    padding: "20px 32px",
  },
  title: {
    margin: 0,
    color: "#fff",
    fontSize: "1.3rem",
    fontWeight: 800,
    letterSpacing: "1px",
  },
  heading: {
    margin: "28px 32px 6px",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#0f3460",
  },
  sub: {
    margin: "0 32px 20px",
    color: "#6b7280",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    padding: "0 32px 32px",
    gap: "4px",
  },
  label: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#374151",
    marginTop: "14px",
  },
  input: {
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    fontSize: "1rem",
    outline: "none",
    marginTop: "4px",
  },
  btn: {
    marginTop: "22px",
    padding: "13px",
    background: "#e94560",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
    display: "block",
  },
  ghost: {
    marginTop: "10px",
    padding: "10px",
    background: "transparent",
    color: "#6b7280",
    border: "none",
    fontSize: "0.85rem",
    cursor: "pointer",
    textAlign: "center",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.85rem",
    margin: "8px 0 0",
    background: "#fef2f2",
    padding: "8px 12px",
    borderRadius: "6px",
  },
  successBox: {
    padding: "32px",
    textAlign: "center",
  },
  checkmark: {
    width: "60px",
    height: "60px",
    background: "#dcfce7",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
    color: "#16a34a",
    margin: "0 auto 16px",
  },
};
