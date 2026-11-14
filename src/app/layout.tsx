import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rent Deposit Escrow",
  description: "Deposit protection and escrow for rental tenancies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
