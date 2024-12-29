import Title from "@/components/Title";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

// For details on the layout of this app, see:
// https://nextjs.org/docs/app/building-your-application/routing

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chessational",
  description: "Improve your chess",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className="h-full">
    <body
      className={`min-h-full m-0 charcoal-bg ${inter.className} overflow-x-auto`}
      id="root"
    >
      <div className="text-white min-h-screen flex flex-col overflow-x-auto">
        <Title />
        <main className="flex-1 flex overflow-x-auto">{children}</main>
      </div>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);
export default RootLayout;
