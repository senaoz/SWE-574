import React from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container max-w-none mx-auto px-10 pb-32 min-h-[calc(100dvh-4rem)]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
