"use client";
import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  isPaid: boolean;
  createdAt: string;
  videoCount: number;
  approvedVideoCount: number;
  totalViews: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.data ?? []);
        setLoading(false);
      });
  }, []);

  function flash(id: string, text: string, ok: boolean) {
    setMsg({ id, text, ok });
    setTimeout(() => setMsg(null), 2500);
  }

  async function changeRole(userId: string, role: string) {
    setBusy(userId + "-role");
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const d = await res.json();
    if (d.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      flash(userId, "Role updated", true);
    } else {
      flash(userId, d.error ?? "Failed", false);
    }
    setBusy(null);
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Delete user "${username}" and all their videos? This cannot be undone.`)) return;
    setBusy(userId + "-del");
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      flash(userId, d.error ?? "Failed to delete", false);
    }
    setBusy(null);
  }

  async function markPaid(userId: string) {
    setBusy(userId + "-paid");
    const res = await fetch("/api/admin/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const d = await res.json();
    if (d.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isPaid: true } : u))
      );
      flash(userId, "Marked as paid", true);
    } else {
      flash(userId, d.error ?? "Failed", false);
    }
    setBusy(null);
  }

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 32 }}>
      <h1 style={h1}>Users</h1>
      <p style={sub}>{users.length} total users registered</p>

      <input
        placeholder="Search by username or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...input, maxWidth: 360, marginBottom: 16 }}
      />

      {loading ? (
        <div style={{ color: "#718096" }}>Loading users...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#718096" }}>No users found.</div>
      ) : (
        <div style={tableWrap}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Username", "Email", "Role", "Videos (approved/total)", "Views", "Paid", "Actions"].map(
                  (h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr
                  key={user.id}
                  style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}
                >
                  <td style={td}>
                    <span style={{ fontWeight: 600, color: "#1a1a2e" }}>
                      {user.username}
                    </span>
                  </td>
                  <td style={{ ...td, color: "#718096", fontSize: "0.8rem" }}>
                    {user.email}
                  </td>
                  <td style={td}>
                    <RoleBadge role={user.role} />
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    {user.approvedVideoCount}/{user.videoCount}
                  </td>
                  <td style={td}>{user.totalViews.toLocaleString()}</td>
                  <td style={td}>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 12,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: user.isPaid ? "#48bb7822" : "#a0aec022",
                        color: user.isPaid ? "#48bb78" : "#a0aec0",
                      }}
                    >
                      {user.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        disabled={busy === user.id + "-role"}
                        style={selectSm}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                      {!user.isPaid && (
                        <button
                          onClick={() => markPaid(user.id)}
                          disabled={busy === user.id + "-paid"}
                          style={{ ...btnSm, backgroundColor: "#48bb78" }}
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id, user.username)}
                        disabled={busy === user.id + "-del"}
                        style={{ ...btnSm, backgroundColor: "#e94560" }}
                      >
                        Delete
                      </button>
                      {msg?.id === user.id && (
                        <span
                          style={{
                            color: msg.ok ? "#48bb78" : "#e94560",
                            fontSize: "0.75rem",
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

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: role === "admin" ? "#e9456022" : "#0f346015",
        color: role === "admin" ? "#e94560" : "#0f3460",
      }}
    >
      {role}
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
  verticalAlign: "middle",
};
const input: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "0.875rem",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};
const btnSm: React.CSSProperties = {
  padding: "4px 10px",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 600,
  color: "#fff",
  fontSize: "0.75rem",
};
const selectSm: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #e2e8f0",
  borderRadius: 5,
  fontSize: "0.75rem",
  backgroundColor: "#fff",
  cursor: "pointer",
};
