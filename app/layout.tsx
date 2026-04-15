import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estoque App",
  description: "Gerenciamento de estoque integrado com Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
