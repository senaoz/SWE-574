import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container max-w-none mx-auto px-10 py-4 min-h-[90vh]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
