import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Railway Detection System — Command Center",
  description: "Real-time AI-powered railway safety monitoring platform with object detection, live analytics, and instant alerts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
