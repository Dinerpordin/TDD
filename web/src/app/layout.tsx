import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Media pipeline · BD Tech",
  description:
    "Multi-tenant news pipeline: Postgres, Drizzle, review queue, routing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        <header className="border-b border-zinc-200 bg-white/80 px-6 py-3 text-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <Link className="font-semibold tracking-tight" href="/">
              Media pipeline
            </Link>
            <Link
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              href="/review"
            >
              Review
            </Link>
          </nav>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
