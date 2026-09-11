import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "../styles/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"]
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-worksans",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "Pide desde tu mesa",
  description: "Pedidos por código QR"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${workSans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
