import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Morph - The Ultimate Offline File Converter",
  description: "Morph is a cutting-edge offline file converter that empowers users to convert files directly in their browser without relying on any server-side processing. With a focus on privacy, speed, and user experience, Morph ensures that your files remain secure and your workflow remains uninterrupted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased w-screen`}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <body className="min-h-full flex flex-col w-screen">
          {children}
          <Toaster position="bottom-right" />
          <ServiceWorkerRegister />
        </body>
      </ThemeProvider>
    </html>
  );
}
