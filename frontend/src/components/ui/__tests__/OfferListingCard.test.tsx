import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Service } from "@/types";
import { OfferListingCard } from "../OfferListingCard";

const mockNavigate = vi.fn();
const mockGetUserById = vi.fn();
const mockGetUserBadges = vi.fn();
const mockGetUserRatings = vi.fn();
const mockSaveService = vi.fn();
const mockUnsaveService = vi.fn();
let saved = false;

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
  getImageUrl: (path?: string) => (path ? `https://cdn.example.test/${path}` : undefined),
  usersApi: {
    getUserById: (...args: any[]) => mockGetUserById(...args),
    getUserBadges: (...args: any[]) => mockGetUserBadges(...args),
  },
  ratingsApi: {
    getUserRatings: (...args: any[]) => mockGetUserRatings(...args),
  },
}));

vi.mock("@/hooks/useSavedServiceIds", () => ({
  useSavedServiceIds: () => ({
    currentUserId: "user-1",
    isSaved: () => saved,
    saveService: (...args: any[]) => mockSaveService(...args),
    unsaveService: (...args: any[]) => mockUnsaveService(...args),
    isSavingService: () => false,
    isUnsavingService: () => false,
  }),
}));

vi.mock("../ClickableTag", () => ({
  ClickableTag: ({ tag }: any) => (
    <span>{typeof tag === "string" ? tag : tag.label}</span>
  ),
}));

vi.mock("../StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span>Status: {status}</span>,
}));

vi.mock("../BadgeDisplay", () => ({
  CustomBadge: ({ badge }: any) => <span>Badge: {badge.name}</span>,
  getHighestPriorityBadge: (badges: any[]) => badges[0] ?? null,
}));

const service: Service = {
  _id: "service-1",
  user_id: "owner-1",
  title: "Piano lessons",
  description: "Learn piano from a neighbor.",
  category: "education",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  deadline: "2026-05-20T00:00:00Z",
  scheduling_type: "specific",
  specific_date: "2026-05-15T00:00:00Z",
  specific_time: "14:30",
  max_participants: 3,
  matched_user_ids: ["u2", "u3"],
  is_pinned: true,
  is_remote: true,
  image_urls: ["piano.jpg"],
};

function renderCard(overrides: Partial<React.ComponentProps<typeof OfferListingCard>> = {}) {
  return render(
    <Theme>
      <MemoryRouter>
        <OfferListingCard service={service} {...overrides} />
      </MemoryRouter>
    </Theme>,
  );
}

describe("OfferListingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saved = false;
    mockGetUserById.mockResolvedValue({
      data: { username: "owner", full_name: "Owner User" },
    });
    mockGetUserBadges.mockResolvedValue({
      data: {
        badges: [
          {
            key: "helper",
            name: "Helper",
            description: "Helpful member",
            icon: "star",
            earned: true,
          },
        ],
        earned_count: 1,
        total_count: 1,
      },
    });
    mockGetUserRatings.mockResolvedValue({
      data: { total: 4, average_score: 4.75 },
    });
    mockSaveService.mockResolvedValue(undefined);
    mockUnsaveService.mockResolvedValue(undefined);
  });

  it("renders service details, owner metadata, recommendation, and navigation", async () => {
    const user = userEvent.setup();
    renderCard({
      isRecommended: true,
      recommendationReason: "Matches your music interests",
    });

    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(screen.getByText("Piano lessons")).toBeInTheDocument();
    expect(screen.getByText("Matches your music interests")).toBeInTheDocument();
    expect(screen.getByText("1 spot left")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Piano lessons" })).toHaveAttribute(
      "src",
      "https://cdn.example.test/piano.jpg",
    );

    await waitFor(() => {
      expect(screen.getByText("Owner User")).toBeInTheDocument();
      expect(screen.getByText("4.8")).toBeInTheDocument();
      expect(screen.getByText("Badge: Helper")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Piano lessons"));
    expect(mockNavigate).toHaveBeenCalledWith("/service/service-1");
  });

  it("saves and unsaves without opening the detail page", async () => {
    const user = userEvent.setup();
    const { rerender } = renderCard();

    await user.click(screen.getByRole("button", { name: /Save/ }));
    expect(mockSaveService).toHaveBeenCalledWith("service-1");
    expect(mockNavigate).not.toHaveBeenCalled();

    saved = true;
    rerender(
      <Theme>
        <MemoryRouter>
          <OfferListingCard service={service} />
        </MemoryRouter>
      </Theme>,
    );

    await user.click(screen.getByRole("button", { name: /Saved/ }));
    expect(mockUnsaveService).toHaveBeenCalledWith("service-1");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
