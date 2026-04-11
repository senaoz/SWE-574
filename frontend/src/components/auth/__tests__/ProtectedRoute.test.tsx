import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";

const mockUseUser = vi.fn();
vi.mock("@/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

function renderRoute(
  user: any,
  isLoading = false,
  requiredRole?: string,
  fallbackPath = "/",
) {
  mockUseUser.mockReturnValue({ user, isLoading });
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute
              requiredRole={requiredRole as any}
              fallbackPath={fallbackPath}
            >
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows loading spinner while auth is loading", () => {
    renderRoute(undefined, true);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to fallback when user is not authenticated", () => {
    renderRoute(undefined, false);
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders children for an authenticated user", () => {
    renderRoute({ _id: "u1", username: "alice", role: "user" });
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("redirects banned users even without a required role", () => {
    renderRoute({ _id: "u1", username: "bad", role: "banned" });
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("allows moderator to access a moderator-required route", () => {
    renderRoute({ _id: "u2", username: "mod", role: "moderator" }, false, "moderator");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("allows admin to access a moderator-required route (role hierarchy)", () => {
    renderRoute({ _id: "u3", username: "admin", role: "admin" }, false, "moderator");
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("blocks a plain user from accessing a moderator-required route", () => {
    renderRoute({ _id: "u4", username: "basic", role: "user" }, false, "moderator");
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to custom fallbackPath when specified", () => {
    mockUseUser.mockReturnValue({ user: undefined, isLoading: false });
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute fallbackPath="/login">
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
