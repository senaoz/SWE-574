import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Service, ForumEvent } from "@/types";
import { Home } from "../Home";

const mockNavigate = vi.fn();
const mockGetServices = vi.fn();
const mockGetEvents = vi.fn();
const mockSavedState = vi.fn();
const mockSaveService = vi.fn();
const mockUnsaveService = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/api", () => ({
  servicesApi: {
    getServices: (...args: any[]) => mockGetServices(...args),
  },
  forumApi: {
    getEvents: (...args: any[]) => mockGetEvents(...args),
  },
}));

vi.mock("@/components/map/ServiceMap", () => ({
  ServiceMap: ({ services, events }: any) => (
    <div data-testid="home-map">
      Map preview: {services.length} services, {events.length} events
    </div>
  ),
}));

vi.mock("@/hooks/useSavedServiceIds", () => ({
  useSavedServiceIds: () => mockSavedState(),
}));

const offerService: Service = {
  _id: "offer-1",
  user_id: "owner-1",
  title: "Piano lessons",
  description: "Learn piano basics",
  category: "education",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  max_participants: 2,
};

const needService: Service = {
  ...offerService,
  _id: "need-1",
  title: "Bike repair help",
  description: "Need help fixing a flat tire",
  service_type: "need",
};

const forumEvent: ForumEvent = {
  _id: "event-1",
  user_id: "owner-1",
  title: "Neighborhood meetup",
  description: "Meet nearby members",
  event_at: "2026-05-11T10:00:00Z",
  location: "Kadikoy",
  latitude: 41.01,
  longitude: 29.01,
  is_remote: false,
  tags: [],
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  comment_count: 0,
  attendee_ids: [],
  attendee_count: 0,
  upvote_count: 0,
  is_pinned: false,
};

function renderHome() {
  return render(
    <Theme>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </Theme>,
  );
}

describe("Home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServices.mockImplementation((filters: any) =>
      Promise.resolve({
        data: {
          services:
            filters?.service_type === "offer" ? [offerService] : [needService],
        },
      }),
    );
    mockGetEvents.mockResolvedValue({ data: { events: [forumEvent] } });
    mockSaveService.mockResolvedValue(undefined);
    mockUnsaveService.mockResolvedValue(undefined);
    mockSavedState.mockReturnValue({
      currentUserId: "user-1",
      isSaved: (service: Service | string) =>
        typeof service === "string" ? service === "need-1" : service._id === "need-1",
      saveService: mockSaveService,
      unsaveService: mockUnsaveService,
      isSavingService: () => false,
      isUnsavingService: () => false,
    });
  });

  it("loads recent offers, needs, events, and the map preview", async () => {
    renderHome();

    expect(screen.getByText("Loading recent offers...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Piano lessons")).toBeInTheDocument();
    });

    expect(screen.getByText("Bike repair help")).toBeInTheDocument();
    expect(screen.getByTestId("home-map")).toHaveTextContent(
      "Map preview: 2 services, 1 events",
    );
  });

  it("navigates from the primary calls to action", async () => {
    const user = userEvent.setup();

    renderHome();
    await user.click(screen.getByRole("button", { name: "See What's Happening" }));

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("saves and unsaves services from the activity lists", async () => {
    const user = userEvent.setup();

    renderHome();
    await screen.findByText("Piano lessons");

    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Saved" }));

    expect(mockSaveService).toHaveBeenCalledWith("offer-1");
    expect(mockUnsaveService).toHaveBeenCalledWith("need-1");
  });
});
