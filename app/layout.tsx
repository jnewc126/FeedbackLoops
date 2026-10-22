import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "./site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: {
    default: "FeedbackLoops",
    template: "%s · FeedbackLoops",
  },
  description: "AI writes a caption for every photo. The community decides if it landed.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main"
           className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-30 focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      </body>
    </html>
  );
}
