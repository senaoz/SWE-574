import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

interface GuestOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Renders children only when user is NOT logged in.
 * If user is logged in, redirects to redirectTo (default: /profile).
 */
export function GuestOnlyRoute({
  children,
  redirectTo = "/profile",
}: GuestOnlyRouteProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
