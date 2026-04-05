import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { GuestOnlyRoute } from "../GuestOnlyRoute";

const mockUseUser = vi.fn();
vi.mock("@/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

function renderRoute(user: any, isLoading = false, redirectTo?: string) {
  mockUseUser.mockReturnValue({ user, isLoading });
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/profile" element={<div>Profile Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route
          path="/register"
          element={
            <GuestOnlyRoute redirectTo={redirectTo}>
              <div>Register Form</div>
            </GuestOnlyRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GuestOnlyRoute", () => {
  it("shows loading while auth is resolving", () => {
    renderRoute(undefined, true);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders children for a guest (unauthenticated) user", () => {
    renderRoute(undefined, false);
    expect(screen.getByText("Register Form")).toBeInTheDocument();
  });

  it("redirects authenticated user to /profile by default", () => {
    renderRoute({ _id: "u1", username: "alice", role: "user" });
    expect(screen.queryByText("Register Form")).not.toBeInTheDocument();
    expect(screen.getByText("Profile Page")).toBeInTheDocument();
  });

  it("redirects authenticated user to custom redirectTo path", () => {
    renderRoute({ _id: "u1", username: "alice", role: "user" }, false, "/dashboard");
    expect(screen.queryByText("Register Form")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
