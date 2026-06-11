"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "⊞" },
  { href: "/dashboard/videos", label: "My Videos", icon: "▶" },
  { href: "/dashboard/tiktok", label: "TikTok", icon: "♪" },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: "📊" },
  { href: "/dashboard/challenge", label: "Brief & Rules", icon: "⚡" },
  { href: "/dashboard/cashout", label: "Cashout", icon: "💸" },
  { href: "/dashboard/profile", label: "Profile", icon: "⚙" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        backgroundColor: "#0f3460",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            color: "#e94560",
            fontWeight: 900,
            fontSize: "1rem",
            letterSpacing: "1.5px",
          }}
        >
          CASHTOROID
        </div>
        <div style={{ color: "#a0aec0", fontSize: "0.72rem", marginTop: 3 }}>
          Content Rewards
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "8px 0", flex: 1 }}>
        {NAV.map(({ href, label, icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                color: active ? "#fff" : "#93c5fd",
                textDecoration: "none",
                fontSize: "0.875rem",
                backgroundColor: active ? "rgba(233,69,96,0.2)" : "transparent",
                borderLeft: `3px solid ${active ? "#e94560" : "transparent"}`,
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: "0.85rem", width: 18, textAlign: "center" }}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {session?.user && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#e94560",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#fff",
                marginBottom: 6,
              }}
            >
              {(session.user.name ?? session.user.email ?? "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div
              style={{
                color: "#e2e8f0",
                fontSize: "0.8rem",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.user.name ?? session.user.email}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: 1 }}>
              Member
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "8px 12px",
            backgroundColor: "rgba(233,69,96,0.15)",
            border: "1px solid rgba(233,69,96,0.3)",
            borderRadius: 6,
            color: "#e94560",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
