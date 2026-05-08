import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { usersApi } from "@/services/api";

const AUTH_LOGOUT_EVENT = "auth-logout";

export interface UserContextType {
  getCurrentUserId: () => string | null;
  currentUserId: string | null;
  user: User | undefined;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => void;
  setAuthToken: (present: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

function getCurrentUserIdFromStorage(): string | null {
  const token = localStorage.getItem("access_token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() =>
    !!localStorage.getItem("access_token")
  );

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => usersApi.getProfile().then((res) => res.data),
    enabled: hasToken,
    retry: false,
  });

  useEffect(() => {
    const handleLogout = () => setHasToken(false);
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
  }, []);

  const refetchUser = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    queryClient.invalidateQueries({ queryKey: ["timebank"] });
  }, [queryClient]);

  const setAuthToken = useCallback((present: boolean) => {
    setHasToken(present);
  }, []);

  const getCurrentUserId = useCallback(getCurrentUserIdFromStorage, []);
  const currentUserId = user?._id ?? getCurrentUserIdFromStorage();

  const value: UserContextType = {
    getCurrentUserId,
    currentUserId,
    user: hasToken ? user : undefined,
    isLoading: hasToken && isLoading,
    error: hasToken ? (error as Error | null) : null,
    refetchUser,
    setAuthToken,
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export { UserContext };
export { AUTH_LOGOUT_EVENT };
