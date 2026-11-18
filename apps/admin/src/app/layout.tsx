import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vanij - Modern E-Commerce Platform",
    template: "%s | Vanij",
  },
  description: "Enterprise Multi-Tenant Headless Commerce Platform by Ninthwave Technologies.",
  icons: {
    icon: "/logo/vanij-icon.png",
    shortcut: "/logo/vanij-icon.png",
    apple: "/logo/vanij-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-zinc-50 text-zinc-900 selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
