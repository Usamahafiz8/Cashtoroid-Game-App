import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cashtoroid — API Reference",
  description: "Interactive REST API documentation for Cashtoroid.",
};

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
