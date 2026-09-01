import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "Form — Personal growth, composed",
  description: "A premium design foundation for personal growth dashboards.",
};

const themeScript = `(function(){try{var s=localStorage.getItem('form-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var t=s==='system'?p:(s==='dark'||s==='light'?s:p);document.documentElement.dataset.theme=t}catch(e){}})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce=(await headers()).get("x-nonce")??undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}
