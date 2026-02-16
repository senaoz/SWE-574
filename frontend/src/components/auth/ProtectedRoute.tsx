import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/services/api";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = "/" 
}: ProtectedRouteProps) {
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

  if (!currentUser) {
    return <Navigate to={fallbackPath} replace />;
  }

  // If no specific role is required, any authenticated user can access
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Role hierarchy: admin > moderator > user
  const roleHierarchy = { admin: 3, moderator: 2, user: 1 };
  const userLevel =
    roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  // User can access if their role level is >= required level
  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  // If user doesn't have required role, redirect
  return <Navigate to={fallbackPath} replace />;
}
