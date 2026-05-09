import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { Dashboard } from "../Dashboard";

// ─── API mocks ───────────────────────────────────────────────────────────────
const mockGetServices = vi.fn();
const mockGetRecommendedServices = vi.fn();
const mockGetTimeBank = vi.fn();
const mockGetEvents = vi.fn();

vi.mock("@/services/api", () => ({
  servicesApi: {
    getServices: (...a: any[]) => mockGetServices(...a),
    getRecommendedServices: (...a: any[]) => mockGetRecommendedServices(...a),
  },
  usersApi: {
    getTimeBank: () => mockGetTimeBank(),
  },
  forumApi: {
    getEvents: (...a: any[]) => mockGetEvents(...a),
  },
}));

// ─── Context / router mocks ───────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: () => ({
    searchQuery: "",
    selectedCity: "",
    setSelectedCity: vi.fn(),
  }),
}));

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({ currentUserId: "u1" }),
}));

vi.mock("@/utils/dashboardFilterSearchParams", () => ({
  getDashboardFiltersFromSearchParams: () => ({
    serviceType: "all",
    status: "all",
    selectedTags: [],
    city: "",
    remoteFilter: "all",
    distance: null,
    dateFilter: "all",
    sortBy: "newest",
    forYouOnly: false,
  }),
  setDashboardFiltersInSearchParams: (_params: any, next: any) => next,
}));

vi.mock("@/utils/serviceSort", () => ({
  sortDashboardServices: (list: any[]) => list,
}));

// ─── Heavy component mocks ────────────────────────────────────────────────────
vi.mock("@/components/map/ServiceMap", () => ({
  ServiceMap: () => <div data-testid="service-map" />,
  applyMapFilters: (list: any[]) => list,
  defaultMapFilters: { serviceType: "all", distance: null },
}));

vi.mock("@/components/ui/OfferListingCard", () => ({
  OfferListingCard: ({ service }: { service: { title: string } }) => (
    <div data-testid="service-card">{service.title}</div>
  ),
}));

vi.mock("@/components/ui/DashboardFilterBar", () => ({
  DashboardFilterBar: () => <div data-testid="filter-bar" />,
}));

vi.mock("@/components/forms/OfferNeedForm", () => ({
  OfferNeedForm: () => <div data-testid="offer-need-form" />,
}));

vi.mock("@/hooks/useSavedServiceIds", () => ({
  useSavedServiceIds: () => ({ savedServiceIds: [] }),
}));

// ─── Geolocation stub ─────────────────────────────────────────────────────────
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) =>
    success({ coords: { latitude: 41, longitude: 28 } }),
  ),
};
Object.defineProperty(navigator, "geolocation", {
  value: mockGeolocation,
  configurable: true,
});

function makeService(id: string, title: string) {
  return {
    _id: id,
    title,
    service_type: "offer",
    status: "open",
    is_remote: false,
    tags: [],
    location: { address: "Istanbul" },
    created_at: new Date().toISOString(),
    user_id: "u1",
  };
}

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Theme>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEvents.mockResolvedValue({ data: { events: [] } });
    mockGetTimeBank.mockResolvedValue({ data: { balance: 5, requires_need_creation: false } });
    mockGetRecommendedServices.mockResolvedValue({
      data: { items: [], total: 0, recommendation_mode: "empty" },
    });
  });

  it("shows loading state while fetching services", () => {
    mockGetServices.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/loading services/i)).toBeInTheDocument();
  });

  it("renders service count after services load", async () => {
    mockGetServices.mockResolvedValue({
      data: {
        services: [makeService("s1", "Fix my bike"), makeService("s2", "Cook dinner")],
      },
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/2 services found/i)).toBeInTheDocument();
    });
  });

  it("renders service cards for each loaded service", async () => {
    mockGetServices.mockResolvedValue({
      data: { services: [makeService("s1", "Fix my bike")] },
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("service-card")).toBeInTheDocument();
      expect(screen.getByText("Fix my bike")).toBeInTheDocument();
    });
  });

  it("shows empty state message when no services match", async () => {
    mockGetServices.mockResolvedValue({ data: { services: [] } });
    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByText(/no services found matching your criteria/i),
      ).toBeInTheDocument();
    });
  });

  it("renders DashboardFilterBar", async () => {
    mockGetServices.mockResolvedValue({ data: { services: [] } });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("filter-bar")).toBeInTheDocument();
    });
  });

  it("renders ServiceMap", async () => {
    mockGetServices.mockResolvedValue({ data: { services: [] } });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("service-map")).toBeInTheDocument();
    });
  });

  it("shows timebank warning when requires_need_creation", async () => {
    localStorage.setItem("access_token", "test-token");
    mockGetServices.mockResolvedValue({ data: { services: [] } });
    mockGetTimeBank.mockResolvedValue({
      data: { balance: 12, requires_need_creation: true },
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/10-hour surplus limit/i)).toBeInTheDocument();
    });
  });

  it("opens create dialog with Offer/Need options on + click", async () => {
    const user = userEvent.setup();
    mockGetServices.mockResolvedValue({ data: { services: [] } });
    renderDashboard();
    await waitFor(() => screen.getByTestId("filter-bar"));
    // The create dialog trigger is the PlusIcon button
    const plusBtn = screen.getAllByRole("button").find((b) =>
      b.querySelector("svg"),
    );
    expect(plusBtn).toBeDefined();
    await user.click(plusBtn!);
    expect(screen.getByText("Offer a Service")).toBeInTheDocument();
    expect(screen.getByText("Need a Service")).toBeInTheDocument();
  });

  it("renders 0 services found when services array is empty", async () => {
    mockGetServices.mockResolvedValue({ data: { services: [] } });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/0 services found/i)).toBeInTheDocument();
    });
  });
});
