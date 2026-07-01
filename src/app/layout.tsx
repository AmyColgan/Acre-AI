import type { Metadata } from "next";
import { Source_Serif_4, Archivo, Space_Mono } from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Acre · a private wealth practice, surveyed",
  description:
    "Acre reads your income, spending, goals and holdings the way a surveyor reads land: one plot, mapped honestly, so you always know exactly what you're standing on.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${archivo.variable} ${spaceMono.variable}`}
    >
      <body className="bg-ink text-parchment font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
