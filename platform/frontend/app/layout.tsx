import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenBioDesign | AI Drug Discovery Workspace",
  description: "Production-grade AI-assisted research workspace for explainable protein binder design and drug discovery.",
};

export const viewport: Viewport = {
  themeColor: "#061126",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
