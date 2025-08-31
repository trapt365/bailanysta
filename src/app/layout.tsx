import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { TrpcProvider } from "@/providers/TrpcProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Bailanysta",
    template: "%s | Bailanysta"
  },
  description: "A social media platform for sharing thoughts and connecting with others",
  keywords: ["social", "media", "posts", "community", "sharing"],
};

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
        <TrpcProvider>
          <ErrorBoundary>
            <Layout>
              {children}
            </Layout>
          </ErrorBoundary>
        </TrpcProvider>
      </body>
    </html>
  );
}
