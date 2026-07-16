import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
  display: "optional", // Never block render waiting for font
});

export const metadata: Metadata = {
  title: "AlphaLift — Gym Management Software",
  description:
    "AlphaLift is a powerful gym management platform to manage members, trainers, attendance, payments, workouts, and more.",
  keywords: ["gym management", "fitness software", "member tracking", "AlphaLift"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen" style={{ background: "var(--bg-base)" }} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
