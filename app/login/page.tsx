"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div style={page}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={logo}>CASHTOROID</div>
          <div style={{ color: "#a0aec0", fontSize: "0.875rem", marginTop: 6 }}>
            Content Rewards Platform
          </div>
        </div>

        <div style={card}>
          <h2 style={heading}>Sign In</h2>
          <p style={subText}>Welcome back! Sign in to your account</p>

          {justRegistered && (
            <div style={successBox}>
              Account created! You can now sign in.
            </div>
          )}

          {error && <div style={errBox}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                style={input}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={lbl}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={input}
              />
            </div>

            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <Link
                href="/reset-password"
                style={{ color: "#718096", fontSize: "0.8rem", textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...submitBtn,
                backgroundColor: loading ? "#a0aec0" : "#e94560",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              color: "#718096",
              fontSize: "0.875rem",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{ color: "#e94560", fontWeight: 600, textDecoration: "none" }}
            >
              Register
            </Link>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "#4a5568",
            fontSize: "0.75rem",
          }}
        >
          Cashtoroid &copy; Content Rewards Platform
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
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
const successBox: React.CSSProperties = {
  backgroundColor: "#f0fff4",
  border: "1px solid #9ae6b4",
  borderRadius: 6,
  padding: "10px 14px",
  marginBottom: 18,
  color: "#276749",
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
  transition: "background 0.15s",
};
