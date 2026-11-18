import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "거리 측정기",
  description: "Nominatim과 OpenStreetMap으로 출발지와 도착지 사이의 거리를 확인하세요."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
