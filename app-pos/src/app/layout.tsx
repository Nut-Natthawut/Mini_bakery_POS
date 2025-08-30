import type { Metadata , Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
});

export const metadata: Metadata = {
  title: "Mini bakery POS",
  description: "ระบบจัดการร้านเบเกอรี่ขนาดเล็ก - Mini bakery Point of Sale System",
  keywords: "POS, bakery, management, ระบบร้านอาหาร, จัดการร้าน",
  authors: [{ name: "Mini bakery POS Team" }],
  
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
  
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${poppins.className}`}>
        {children}
      </body>
    </html>
  );
}
