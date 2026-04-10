import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EEIFS Camp",
  description: "Plateforme des camps d'été EEIFS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: '#FFF8F2' }}>
        <Navbar />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
