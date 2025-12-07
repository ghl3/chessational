import Title from "@/components/Title";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chessational",
  description: "Improve your chess",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en" className="h-full">
    <body className={`min-h-full m-0 charcoal-bg ${inter.className}`} id="root">
      <div className="text-white min-h-screen flex flex-col">
        <Title />
        <main className="flex-1 w-full">{children}</main>
      </div>
      <Analytics />
      <SpeedInsights />
    </body>
  </html>
);
export default RootLayout;
