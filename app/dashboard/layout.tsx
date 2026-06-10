import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/get-auth-user";
import DashboardSidebar from "./DashboardSidebar";

export const metadata: Metadata = { title: "Dashboard — Cashtoroid" };

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <DashboardSidebar />
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
  );
}
