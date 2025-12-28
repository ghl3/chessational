import GoogleAnalytics from "@/components/GoogleAnalytics";
import Title from "@/components/Title";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chessational",
  description: "Improve your chess",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className="h-full">
    <GoogleAnalytics />
    <body className={`h-full m-0 charcoal-bg ${inter.className}`} id="root">
      <Providers>
        <div className="text-white h-screen flex flex-col overflow-hidden">
          <Title />
          <main className="flex-1 w-full min-h-0">{children}</main>
        </div>
        <Analytics />
        <SpeedInsights />
      </Providers>
    </body>
  </html>
);
export default RootLayout;
