import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "ArtEcho",
  description: "ArtEcho — Learn and create with AI",
  icons: {
    icon: "/i-11.png",
    shortcut: "/i-11.png",
    apple: "/i-11.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
