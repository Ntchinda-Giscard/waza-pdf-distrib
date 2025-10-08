import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "eBulletin",
  description: "logiciels de distribution des bulletin de paie",
  generator: "waza.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-custom-bg bg-cover bg-center">
        <Toaster /> {children}
      </body>
    </html>
  );
}
