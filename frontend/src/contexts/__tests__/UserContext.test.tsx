import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider, useUser, AUTH_LOGOUT_EVENT } from "../UserContext";

const mockGetProfile = vi.fn();

vi.mock("@/services/api", () => ({
  usersApi: {
    getProfile: () => mockGetProfile(),
  },
}));

// A base64-encoded payload {"sub":"user-123"} — valid enough for atob parsing
const FAKE_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature";

function TestConsumer() {
  const { user, isLoading, currentUserId } = useUser();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.username : "no-user"}</div>
      <div data-testid="user-id">{currentUserId ?? "null"}</div>
    </div>
  );
}

function renderProvider() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <UserProvider>
        <TestConsumer />
      </UserProvider>
    </QueryClientProvider>,
  );
}

describe("UserProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows no user when no token in localStorage", () => {
    renderProvider();
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });

  it("does not call getProfile when no token is present", () => {
    renderProvider();
    expect(mockGetProfile).not.toHaveBeenCalled();
  });

  it("fetches profile when token is present in localStorage", async () => {
    localStorage.setItem("access_token", FAKE_TOKEN);
    mockGetProfile.mockResolvedValue({
      data: { _id: "user-123", username: "testuser" },
    });
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });
    expect(mockGetProfile).toHaveBeenCalledTimes(1);
  });

  it("parses currentUserId from JWT sub claim", async () => {
    localStorage.setItem("access_token", FAKE_TOKEN);
    mockGetProfile.mockResolvedValue({
      data: { _id: "user-123", username: "testuser" },
    });
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("user-123");
    });
  });

  it("sets user to undefined on auth-logout event", async () => {
    localStorage.setItem("access_token", FAKE_TOKEN);
    mockGetProfile.mockResolvedValue({
      data: { _id: "user-123", username: "testuser" },
    });
    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    });
  });

  it("shows loading while profile fetch is in-flight", () => {
    localStorage.setItem("access_token", FAKE_TOKEN);
    // Never resolves so loading state persists
    mockGetProfile.mockReturnValue(new Promise(() => {}));
    renderProvider();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});

describe("useUser hook", () => {
  it("throws when used outside UserProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useUser must be used within a UserProvider",
    );
    spy.mockRestore();
  });
});
