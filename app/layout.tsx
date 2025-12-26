import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ConsoleDisabler } from "@/components/ConsoleDisabler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Helix - AI-Powered System Design Autopilot",
  description: "Generate scalable system designs, cost estimations, and boilerplate code from natural language prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ConsoleDisabler />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

