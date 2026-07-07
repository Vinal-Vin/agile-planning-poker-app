import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Planning Poker 🃏",
  description:
    "Fun, real-time agile planning poker — create a room, share the link, estimate together.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-fuchsia-950 text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
