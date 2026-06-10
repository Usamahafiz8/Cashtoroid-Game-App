import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/get-auth-user";
import AdminSidebar from "./AdminSidebar";
import SessionWrapper from "./SessionWrapper";

export const metadata: Metadata = { title: "Admin Panel — Cashtoroid" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <SessionWrapper>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <AdminSidebar />
        <main
          style={{
            flex: 1,
            backgroundColor: "#f7f8fa",
            overflowY: "auto",
            minHeight: "100vh",
          }}
        >
          {children}
        </main>
      </div>
    </SessionWrapper>
  );
}
