import type { Metadata } from "next";
import { Encode_Sans_Expanded } from "next/font/google";
import "./globals.css";
import FontLoader from "./components/FontLoader";
import SkipLink from "./components/SkipLink";

const encodeSansExpanded = Encode_Sans_Expanded({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  variable: "--font-encode-sans-expanded",
});

export const metadata: Metadata = {
  title: "iSynergies Inc. - We make IT possible",
  description: "iSynergies Inc. - We make IT possible",
  icons: {
    icon: "/IS.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth overflow-x-hidden">
      <body className={`${encodeSansExpanded.className} antialiased overflow-x-hidden m-0 p-0`}>
        <SkipLink />
        <FontLoader />
        {children}
      </body>
    </html>
  );
}
