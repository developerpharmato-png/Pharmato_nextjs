import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import "leaflet/dist/leaflet.css"; // Temporarily disabled to unblock build
import GlobalFetchInterceptor from "./GlobalFetchInterceptor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pharmato",
  description: "Pharmato Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Leaflet CSS via CDN to avoid module resolution issues */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-o9U0V1gu0t7f3kUmV6RbsZMNwlg36sRq9iUpvS8+0XY="
          crossOrigin=""
        />
        {/* Custom favicon for dashboard */}
        <link rel="icon" type="image/png" href="/_next/static/media/Image%201.583fdd61.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >

        {/* <GlobalFetchInterceptor /> */}
        {children}
      </body>
    </html>
  );
}
