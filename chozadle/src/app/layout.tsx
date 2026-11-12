import type { Metadata } from "next";
import "./globals.css";

import localFont from 'next/font/local';

const redaction50 = localFont({
  src: '/font/Redaction50-Regular.ttf',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Chozadle",
  description: "Vos también la recalcada concha de tu madre, no puedo compartir foto con mi mejor amiga sin que me",
};

export default function RootLayout({ 
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
    <body className={`${redaction50.className} bg-black`}>
      {children}
    </body>
    </html>
  )
}
