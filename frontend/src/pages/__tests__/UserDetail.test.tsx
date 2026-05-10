import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import type { Community, RatingDetailed, Service, User } from "@/types";
import { UserDetail } from "../UserDetail";

const mockNavigate = vi.fn();
const mockGetUserById = vi.fn();
const mockGetServices = vi.fn();
const mockGetUserRatings = vi.fn();
const mockGetUserRatingsDetailed = vi.fn();
const mockGetUserCommunities = vi.fn();

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
  useUser: () => ({ currentUserId: "viewer-1" }),
}));

vi.mock("@/services/api", () => ({
  getImageUrl: (path?: string) => (path ? `https://cdn.example.test/${path}` : undefined),
  usersApi: {
    getUserById: (...args: any[]) => mockGetUserById(...args),
    getUserCommunities: (...args: any[]) => mockGetUserCommunities(...args),
  },
  servicesApi: {
    getServices: (...args: any[]) => mockGetServices(...args),
  },
  ratingsApi: {
    getUserRatings: (...args: any[]) => mockGetUserRatings(...args),
    getUserRatingsDetailed: (...args: any[]) => mockGetUserRatingsDetailed(...args),
  },
}));

vi.mock("@/components/ui/ReportDialog", () => ({
  ReportDialog: ({ open, reportedName }: any) =>
    open ? <div>Report dialog for {reportedName}</div> : null,
}));

vi.mock("@/components/ui/OfferListingCard", () => ({
  OfferListingCard: ({ service }: any) => <article>Service card: {service.title}</article>,
}));

vi.mock("@/components/ui/BadgeDisplay", () => ({
  BadgeDisplay: ({ userId }: any) => <div>Badges for {userId}</div>,
}));

vi.mock("@/components/ui/RatingStars", () => ({
  RatingStars: ({ value }: any) => <span>Rating stars: {value}</span>,
}));

vi.mock("@/components/ui/ReviewCard", () => ({
  ReviewCard: ({ rating }: any) => <article>Review: {rating.comment}</article>,
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: any) => <span>{name}</span>,
}));

const viewedUser: User = {
  _id: "user-2",
  username: "alice",
  email: "alice@example.test",
  full_name: "Alice User",
  bio: "Neighborhood music mentor",
  location: "Kadikoy",
  profile_picture: "avatars/alice.png",
  social_links: { website: "https://alice.example.test" },
  interests: ["Music", "Gardening"],
  is_active: true,
  is_verified: true,
  role: "user",
  timebank_balance: 6,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

const offerService: Service = {
  _id: "offer-1",
  user_id: "user-2",
  title: "Piano lessons",
  description: "Music practice",
  category: "education",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "completed",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  max_participants: 1,
};

const needService: Service = {
  ...offerService,
  _id: "need-1",
  title: "Bike repair help",
  service_type: "need",
};

const rating: RatingDetailed = {
  _id: "rating-1",
  transaction_id: "tx-1",
  rater_id: "viewer-1",
  rated_user_id: "user-2",
  score: 5,
  comment: "Great exchange",
  created_at: "2026-05-02T00:00:00Z",
};

const community: Community = {
  _id: "community-1",
  name: "Kadikoy Helpers",
  slug: "kadikoy-helpers",
  description: "Neighbors helping neighbors.",
  rules: [],
  founder_id: "user-2",
  tags: [],
  member_count: 12,
  post_count: 3,
  is_pinned: false,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  is_mutual: true,
};

function renderUserDetail(initialEntry = "/user/user-2") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/user/:userId" element={<UserDetail />} />
          </Routes>
        </MemoryRouter>
      </Theme>
    </QueryClientProvider>,
  );
}

describe("UserDetail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserById.mockResolvedValue({ data: viewedUser });
    mockGetServices.mockResolvedValue({
      data: { services: [offerService, needService], total: 2 },
    });
    mockGetUserRatings.mockResolvedValue({
      data: { total: 2, average_score: 4.8 },
    });
    mockGetUserRatingsDetailed.mockResolvedValue({
      data: { ratings: [rating], total: 1 },
    });
    mockGetUserCommunities.mockResolvedValue({
      data: { communities: [community], total: 1, mutual_count: 1 },
    });
  });

  it("loads a public user profile with ratings, services, and communities", async () => {
    renderUserDetail();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Alice User")).toBeInTheDocument();
    });

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("Neighborhood music mentor")).toBeInTheDocument();
    expect(screen.getByText("4.8 (2 ratings)")).toBeInTheDocument();
    expect(screen.getByText("Review: Great exchange")).toBeInTheDocument();
    expect(screen.getByText("Service card: Piano lessons")).toBeInTheDocument();
    expect(screen.getByText("Service card: Bike repair help")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Kadikoy Helpers" })).toBeInTheDocument();
    expect(screen.getByText("Badges for user-2")).toBeInTheDocument();
  });

  it("opens the report dialog for another user", async () => {
    const user = userEvent.setup();

    renderUserDetail();
    await screen.findByText("Alice User");
    await user.click(screen.getByRole("button", { name: /Report User/ }));

    expect(screen.getByText("Report dialog for Alice User")).toBeInTheDocument();
  });

  it("shows not found state when the user request fails", async () => {
    mockGetUserById.mockRejectedValue(new Error("not found"));

    renderUserDetail();

    expect(await screen.findByText("User not found")).toBeInTheDocument();
  });
});
