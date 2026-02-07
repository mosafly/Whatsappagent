import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { AppLayoutWrapper } from "@/components/layout/AppLayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bobotcho WhatsApp",
  description: "Plateforme WhatsApp Marketing pour Bobotcho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} antialiased`}
      >
        <Providers>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
