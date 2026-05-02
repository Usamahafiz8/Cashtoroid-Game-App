import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cashtoroid — Content Rewards System",
  description: "Submit gameplay videos, earn views, get paid.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
