import type { Metadata } from "next";
import { Libre_Franklin, Cormorant, Mulish } from "next/font/google";
import "./globals.css";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-heading",
});

const cormorant = Cormorant({
  subsets: ["latin"],
  variable: "--font-subheading",
});

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Career Agent - AI Job Search Automation",
  description:
    "Automate your job search with AI-powered browser sessions that find and apply to jobs across LinkedIn, Indeed, and Glassdoor.",
  keywords: [
    "job search",
    "career",
    "automation",
    "AI",
    "browser automation",
    "linkedin",
    "indeed",
    "glassdoor",
  ],
  authors: [{ name: "James Volpe" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${libreFranklin.variable} ${cormorant.variable} ${mulish.variable} font-body antialiased`}
      >
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
