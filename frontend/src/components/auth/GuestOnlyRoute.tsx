import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api";

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
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => usersApi.getProfile().then((res) => res.data),
    enabled: !!localStorage.getItem("access_token"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
