import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { CustomToastProvider } from "@/components/ui/custom-toast"
import { Toaster } from 'sonner'
import { Analytics } from "@vercel/analytics/next"

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2DAY",
  description: "Your all in one productivity app.",
};

import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CustomToastProvider>
          {children}
          <Toaster position="top-right" />
          </CustomToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
