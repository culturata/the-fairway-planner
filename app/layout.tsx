import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Fairway Planner - Golf Trip Management",
  description: "Plan and manage multi-day golf trips with your group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="grain-overlay"></div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
