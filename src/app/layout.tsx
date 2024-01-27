import NavBar from "@/components/NavBar";
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
  <html lang="en">
    <body className={inter.className} id="root">
      <div className="charcoal-bg text-white min-h-screen">
        <Title />
        <NavBar />
        {children}
      </div>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);

export default RootLayout;
