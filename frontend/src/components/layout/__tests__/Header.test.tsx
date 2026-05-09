import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { Header } from "../Header";

const mockNavigate = vi.fn();
const mockSetSearchQuery = vi.fn();
const mockToggleAppearance = vi.fn();
const mockUseUser = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/App", () => ({
  useTheme: () => ({ appearance: "light", toggleAppearance: mockToggleAppearance }),
}));

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: () => ({ setSearchQuery: mockSetSearchQuery }),
}));

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/services/api", () => ({
  getImageUrl: (path: string) => `http://localhost/${path}`,
}));

vi.mock("@/components/ui/NotificationBell", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock("@/components/ui/SearchBar", () => ({
  SearchBar: ({ onSearchChange }: { onSearchChange: (v: string) => void }) => (
    <input
      placeholder="Search"
      data-testid="search-bar"
      onChange={(e) => onSearchChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/ui/ThemeSwitcher", () => ({
  ThemeSwitcher: () => <button data-testid="theme-switcher" />,
}));

vi.mock("../auth/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

vi.mock("../auth/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form" />,
}));

function renderHeader(initialPath = "/") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Theme>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Header />
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("unauthenticated", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({ user: null });
    });

    it("renders HIVE brand", () => {
      renderHeader();
      expect(screen.getByText("HIVE")).toBeInTheDocument();
    });

    it("shows Login button when user is not logged in", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("does not show SearchBar when user is not logged in", () => {
      renderHeader();
      expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
    });

    it("navigates to home on HIVE brand click", async () => {
      const user = userEvent.setup();
      renderHeader();
      await user.click(screen.getByText("HIVE"));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("authenticated — regular user", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: {
          _id: "u1",
          username: "alice",
          full_name: "Alice",
          role: "user",
          timebank_balance: 5,
          profile_picture: null,
        },
      });
    });

    it("shows SearchBar when user is logged in", () => {
      renderHeader();
      expect(screen.getByTestId("search-bar")).toBeInTheDocument();
    });

    it("shows timebank balance", () => {
      renderHeader();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("shows NotificationBell", () => {
      renderHeader();
      expect(screen.getByTestId("notification-bell")).toBeInTheDocument();
    });

    it("shows Settings button (not Admin Panel) for regular user", () => {
      renderHeader();
      expect(screen.queryByLabelText("Admin Panel")).not.toBeInTheDocument();
    });

    it("navigates to profile on profile icon click", async () => {
      const user = userEvent.setup();
      renderHeader();
      const profileBtn = screen.getByRole("button", { name: /profile/i });
      await user.click(profileBtn);
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });

    it("navigates to dashboard on home icon click", async () => {
      const user = userEvent.setup();
      renderHeader();
      const dashboardBtn = screen.getByRole("button", { name: /dashboard/i });
      await user.click(dashboardBtn);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates to forum on commons icon click", async () => {
      const user = userEvent.setup();
      renderHeader();
      const commonsBtn = screen.getByRole("button", { name: /commons/i });
      await user.click(commonsBtn);
      expect(mockNavigate).toHaveBeenCalledWith("/forum");
    });
  });

  describe("authenticated — admin", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: {
          _id: "u2",
          username: "admin",
          full_name: "Admin",
          role: "admin",
          timebank_balance: 10,
          profile_picture: null,
        },
      });
    });

    it("shows Admin Panel button for admin", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: /admin panel/i })).toBeInTheDocument();
    });

    it("navigates to /admin on admin panel click", async () => {
      const user = userEvent.setup();
      renderHeader();
      await user.click(screen.getByRole("button", { name: /admin panel/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  describe("authenticated — moderator", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: {
          _id: "u3",
          username: "mod",
          role: "moderator",
          timebank_balance: 0,
          profile_picture: null,
        },
      });
    });

    it("shows Admin Panel button for moderator", () => {
      renderHeader();
      expect(screen.getByRole("button", { name: /admin panel/i })).toBeInTheDocument();
    });
  });
});
