import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EUinput - European Consumer Transparency Study",
  description: "Help shape the future of product transparency in Europe. Share your thoughts in a 3-minute voice conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

