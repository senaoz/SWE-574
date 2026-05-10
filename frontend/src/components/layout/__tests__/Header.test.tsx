import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Theme } from "@radix-ui/themes";
import { Header } from "../Header";

const mockNavigate = vi.fn();
const mockToggleAppearance = vi.fn();
const mockSetSearchQuery = vi.fn();
const mockUseUser = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/App", () => ({
  useTheme: () => ({
    appearance: "light",
    toggleAppearance: mockToggleAppearance,
  }),
}));

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: () => ({
    setSearchQuery: mockSetSearchQuery,
  }),
}));

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/components/ui/ThemeSwitcher", () => ({
  ThemeSwitcher: ({ appearance, onToggle }: any) => (
    <button onClick={onToggle}>Theme: {appearance}</button>
  ),
}));

vi.mock("@/components/ui/SearchBar", () => ({
  SearchBar: ({ onSearchChange }: any) => (
    <input
      aria-label="Mock search"
      onChange={(event) => onSearchChange(event.currentTarget.value)}
    />
  ),
}));

vi.mock("../../auth/LoginForm", () => ({
  LoginForm: () => <div>Mock Login Form</div>,
}));

vi.mock("../../auth/RegisterForm", () => ({
  RegisterForm: ({ onSwitchToLogin }: any) => (
    <div>
      Mock Register Form
      <button onClick={onSwitchToLogin}>Back to login</button>
    </div>
  ),
}));

vi.mock("@/components/ui/NotificationBell", () => ({
  NotificationBell: () => <button>Notifications</button>,
}));

vi.mock("@/services/api", () => ({
  getImageUrl: (path: string) => `https://cdn.example.test/${path}`,
}));

function renderHeader() {
  return render(
    <Theme>
      <Header />
    </Theme>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({ user: undefined });
    window.history.replaceState({}, "", "/");
  });

  it("renders guest controls and opens the login dialog", async () => {
    const user = userEvent.setup();

    renderHeader();

    expect(screen.getByText("HIVE")).toBeInTheDocument();
    expect(screen.queryByLabelText("Mock search")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Theme: light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByText("Mock Login Form")).toBeInTheDocument();
  });

  it("opens login dialog automatically from the login query parameter", () => {
    window.history.replaceState({}, "", "/?login=true");

    renderHeader();

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("renders authenticated controls and forwards search text", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({
      user: {
        username: "alice",
        full_name: "Alice User",
        role: "user",
        timebank_balance: 4.5,
      },
    });

    renderHeader();

    expect(screen.getByLabelText("Mock search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4.5" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Mock search"), "garden");
    expect(mockSetSearchQuery).toHaveBeenLastCalledWith("garden");
  });

  it("navigates home from the brand and toggles theme", async () => {
    const user = userEvent.setup();

    renderHeader();

    await user.click(screen.getByText("HIVE"));
    expect(mockNavigate).toHaveBeenCalledWith("/");

    await user.click(screen.getByRole("button", { name: "Theme: light" }));
    expect(mockToggleAppearance).toHaveBeenCalledTimes(1);
  });
});
