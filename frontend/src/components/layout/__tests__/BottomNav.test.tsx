import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BottomNav } from "../BottomNav";

const mockNavigate = vi.fn();
const mockUseUser = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/components/forms/OfferNeedForm", () => ({
  OfferNeedForm: ({ serviceType }: { serviceType: string }) => (
    <div data-testid="offer-need-form" data-service-type={serviceType} />
  ),
}));

function renderNav(path = "/dashboard") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <BottomNav />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when user is not authenticated", () => {
    mockUseUser.mockReturnValue({ user: null });
    const { container } = renderNav();
    expect(container.firstChild).toBeNull();
  });

  describe("authenticated", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: { _id: "u1", username: "alice", role: "user" },
      });
    });

    it("renders Map nav button", () => {
      renderNav();
      expect(screen.getByRole("button", { name: /map/i })).toBeInTheDocument();
    });

    it("renders Chat nav button", () => {
      renderNav();
      expect(screen.getByRole("button", { name: /chat/i })).toBeInTheDocument();
    });

    it("renders Common nav button", () => {
      renderNav();
      expect(screen.getByRole("button", { name: /common/i })).toBeInTheDocument();
    });

    it("renders Profile nav button", () => {
      renderNav();
      expect(screen.getByRole("button", { name: /^profile$/i })).toBeInTheDocument();
    });

    it("renders FAB create button", () => {
      renderNav();
      expect(
        screen.getByRole("button", { name: /create offer or need/i }),
      ).toBeInTheDocument();
    });

    it("navigates to /dashboard on Map click", async () => {
      const user = userEvent.setup();
      renderNav();
      await user.click(screen.getByRole("button", { name: /map/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    it("navigates to /profile?tab=chat on Chat click", async () => {
      const user = userEvent.setup();
      renderNav();
      await user.click(screen.getByRole("button", { name: /chat/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/profile?tab=chat");
    });

    it("navigates to /forum on Common click", async () => {
      const user = userEvent.setup();
      renderNav();
      await user.click(screen.getByRole("button", { name: /common/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/forum");
    });

    it("navigates to /profile on Profile click", async () => {
      const user = userEvent.setup();
      renderNav();
      await user.click(screen.getByRole("button", { name: /^profile$/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });

    it("opens create dialog on FAB click", async () => {
      const user = userEvent.setup();
      renderNav();
      await user.click(
        screen.getByRole("button", { name: /create offer or need/i }),
      );
      expect(screen.getByTestId("offer-need-form")).toBeInTheDocument();
    });

    it("shows Offer a Service and Need a Service options in dialog", async () => {
      const user = userEvent.setup();
      renderNav();
      await user.click(
        screen.getByRole("button", { name: /create offer or need/i }),
      );
      expect(screen.getByText("Offer a Service")).toBeInTheDocument();
      expect(screen.getByText("Need a Service")).toBeInTheDocument();
    });
  });
});
