import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Dashboard } from "@/pages/Dashboard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Theme } from "@radix-ui/themes";
import { Home } from "@/pages/Home";
import { ServiceDetail } from "@/pages/ServiceDetail";
import { UserDetail } from "@/pages/UserDetail";
import { Profile } from "@/pages/Profile";
import { AdminPanel } from "@/pages/AdminPanel";
import { Forum } from "@/pages/Forum";
import { ForumDiscussionDetail } from "@/pages/ForumDiscussionDetail";
import { ForumEventDetail } from "@/pages/ForumEventDetail";
import { Layout } from "@/components/layout/Layout";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestOnlyRoute } from "@/components/auth/GuestOnlyRoute";
import { FilterProvider } from "@/contexts/FilterContext";
import { useState, createContext, useContext, useEffect } from "react";

// Create theme context
interface ThemeContextType {
  appearance: "dark" | "light" | "inherit";
  toggleAppearance: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Create user context
interface UserContextType {
  getCurrentUserId: () => string | null;
  currentUserId: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

function App() {
  const [appearance, setAppearance] = useState<"dark" | "light" | "inherit">(
    "light",
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      setAppearance(savedTheme as "dark" | "light" | "inherit");
    } else {
      setAppearance("light");
    }
  }, []);

  const toggleAppearance = () => {
    const newTheme = appearance === "dark" ? "light" : "dark";
    setAppearance(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  return (
    <UserContext.Provider value={{ getCurrentUserId, currentUserId }}>
      <ThemeContext.Provider value={{ appearance, toggleAppearance }}>
        <FilterProvider>
          <Theme accentColor="lime" radius="full" appearance={appearance}>
            <Router>
              <ScrollToTop />
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/register"
                    element={
                      <GuestOnlyRoute>
                        <RegisterForm />
                      </GuestOnlyRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute
                        requiredRole="user"
                        fallbackPath="/?login=true"
                      >
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service/:id"
                    element={
                      <ProtectedRoute
                        requiredRole="user"
                        fallbackPath="/?login=true"
                      >
                        <ServiceDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user/:userId"
                    element={
                      <ProtectedRoute
                        requiredRole="user"
                        fallbackPath="/?login=true"
                      >
                        <UserDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute
                        requiredRole="user"
                        fallbackPath="/?login=true"
                      >
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forum"
                    element={
                      <ProtectedRoute
                        requiredRole="user"
                        fallbackPath="/?login=true"
                      >
                        <Forum />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forum/discussions/:id"
                    element={
                      <ProtectedRoute
                        requiredRole="user"
                        fallbackPath="/?login=true"
                      >
                        <ForumDiscussionDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/forum/events/:id"
                    element={
                      <ProtectedRoute
                        requiredRole="user"
                        fallbackPath="/?login=true"
                      >
                        <ForumEventDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="moderator">
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </Router>
          </Theme>
        </FilterProvider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  );
}

export default App;
