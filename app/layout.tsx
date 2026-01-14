import type { Metadata } from "next";
import { Encode_Sans_Expanded } from "next/font/google";
import "./globals.css";
import FontLoader from "./components/FontLoader";

const encodeSansExpanded = Encode_Sans_Expanded({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  variable: "--font-encode-sans-expanded",
});

export const metadata: Metadata = {
  title: "iSynergies Inc. - We make IT possible",
  description: "iSynergies Inc. - We make IT possible",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${encodeSansExpanded.className} antialiased`}>
        <FontLoader />
        {children}
      </body>
    </html>
  );
}
