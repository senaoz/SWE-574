import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import type { Service, ForumEvent } from "@/types";
import { Dashboard } from "../Dashboard";

const mockGetServices = vi.fn();
const mockGetRecommendedServices = vi.fn();
const mockGetEvents = vi.fn();
const mockGetTimeBank = vi.fn();
const mockSetSelectedCity = vi.fn();

const mockDefaultDashboardFilters = vi.hoisted(() => ({
  forYouOnly: false,
  serviceType: "all",
  status: "all",
  selectedTags: [],
  remoteFilter: "all",
  distance: "any",
  city: "all",
  sortBy: "default",
  dateFilter: "all",
}));

vi.mock("@/components/map/ServiceMap", () => ({
  defaultMapFilters: { serviceType: "all", distance: "any" },
  applyMapFilters: (services: Service[]) => services,
  ServiceMap: ({ services, events }: any) => (
    <div data-testid="dashboard-map">
      Dashboard map: {services.length} services, {events.length} events
    </div>
  ),
}));

vi.mock("@/components/ui/OfferListingCard", () => ({
  OfferListingCard: ({ service, isRecommended, recommendationReason }: any) => (
    <article>
      Card: {service.title}
      {isRecommended ? ` (${recommendationReason})` : ""}
    </article>
  ),
}));

vi.mock("@/components/ui/DashboardFilterBar", () => ({
  defaultDashboardFilters: mockDefaultDashboardFilters,
  DashboardFilterBar: ({ filters, availableTags }: any) => (
    <div>
      Filters city: {filters.city}
      <span>Available tags: {availableTags.map((tag: any) => tag.label).join(", ")}</span>
    </div>
  ),
}));

vi.mock("@/components/forms/OfferNeedForm", () => ({
  OfferNeedForm: ({ serviceType, onSuccess }: any) => (
    <button onClick={onSuccess}>Mock {serviceType} form</button>
  ),
}));

vi.mock("@/services/api", () => ({
  servicesApi: {
    getServices: (...args: any[]) => mockGetServices(...args),
    getRecommendedServices: (...args: any[]) => mockGetRecommendedServices(...args),
  },
  forumApi: {
    getEvents: (...args: any[]) => mockGetEvents(...args),
  },
  usersApi: {
    getTimeBank: (...args: any[]) => mockGetTimeBank(...args),
  },
}));

vi.mock("@/contexts/FilterContext", () => ({
  useFilters: () => ({
    searchQuery: "",
    selectedCity: "all",
    setSelectedCity: mockSetSelectedCity,
  }),
}));

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({ currentUserId: "user-1" }),
}));

const offerService: Service = {
  _id: "offer-1",
  user_id: "owner-1",
  title: "Piano lessons",
  description: "Music practice",
  category: "education",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  max_participants: 2,
  scheduling_type: "open",
};

const needService: Service = {
  ...offerService,
  _id: "need-1",
  title: "Bike repair help",
  tags: [{ label: "Repair", entityId: "Q131502", description: "repair" }],
  service_type: "need",
};

const forumEvent: ForumEvent = {
  _id: "event-1",
  user_id: "owner-1",
  title: "Community meetup",
  description: "Meet neighbors",
  event_at: "2026-05-11T10:00:00Z",
  is_remote: false,
  tags: [],
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

function renderDashboard(initialEntry = "/dashboard") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Dashboard />
        </MemoryRouter>
      </Theme>
    </QueryClientProvider>,
  );
}

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("access_token", "token");
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((onSuccess) =>
          onSuccess({ coords: { latitude: 41.01, longitude: 29.01 } }),
        ),
      },
    });
    mockGetServices.mockResolvedValue({ data: { services: [offerService, needService] } });
    mockGetEvents.mockResolvedValue({ data: { events: [forumEvent] } });
    mockGetTimeBank.mockResolvedValue({
      data: {
        balance: 11,
        transactions: [],
        max_balance: 10,
        can_earn: false,
        requires_need_creation: true,
        effective_max_balance: 10,
        effective_min_balance: -10,
      },
    });
    mockGetRecommendedServices.mockResolvedValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        recommendation_mode: "empty",
        show_profile_prompt: false,
      },
    });
  });

  it("loads services, filters, the timebank warning, and map data", async () => {
    renderDashboard();

    expect(screen.getByText("Loading services...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/2 services found/)).toBeInTheDocument();
    });
    expect(screen.getByText("Card: Piano lessons")).toBeInTheDocument();
    expect(screen.getByText("Card: Bike repair help")).toBeInTheDocument();
    expect(screen.getByText(/You've reached the 10-hour surplus limit/)).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-map")).toHaveTextContent(
      "Dashboard map: 2 services, 1 events",
    );
    expect(screen.getByText(/Available tags: Music, Repair/)).toBeInTheDocument();
  });

  it("filters displayed services by tag from the URL", async () => {
    renderDashboard("/dashboard?tag=Q638");

    await waitFor(() => {
      expect(screen.getByText(/1 services found/)).toBeInTheDocument();
    });

    expect(screen.getByText("Card: Piano lessons")).toBeInTheDocument();
    expect(screen.queryByText("Card: Bike repair help")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear tag" })).toBeInTheDocument();
  });

  it("renders personalized recommendations in For You mode", async () => {
    mockGetRecommendedServices.mockResolvedValue({
      data: {
        items: [
          {
            service: offerService,
            reason: "Matches your music interest",
            score: 0.95,
            matched_interests: ["Music"],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        recommendation_mode: "personalized",
        show_profile_prompt: true,
      },
    });

    renderDashboard("/dashboard?forYou=1");

    await waitFor(() => {
      expect(screen.getByText(/1 picks for you/)).toBeInTheDocument();
    });
    expect(
      screen.getByText("Card: Piano lessons (Matches your music interest)"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Add Interests in your profile/)).toBeInTheDocument();
  });
});
