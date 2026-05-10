import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import type { Community, RatingDetailed } from "@/types";
import { Profile } from "../Profile";

const mockNavigate = vi.fn();
const mockRefetchUser = vi.fn();
const mockUpdateProfile = vi.fn();
const mockGetUserRatings = vi.fn();
const mockGetUserRatingsDetailed = vi.fn();
const mockGetUserCommunities = vi.fn();
const mockGetTimeBank = vi.fn();
const mockGetServices = vi.fn();
const mockGetMyRequests = vi.fn();
const mockGetMyTransactions = vi.fn();

const profileUser = vi.hoisted(() => ({
  _id: "user-1",
  username: "aysenur",
  email: "aysenur@example.test",
  full_name: "Aysenur Unal",
  bio: "Timebank organizer",
  location: "Kadikoy",
  profile_picture: "avatars/aysenur.png",
  social_links: { website: "https://aysenur.example.test" },
  interests: ["Music"],
  is_active: true,
  is_verified: true,
  role: "user",
  timebank_balance: 7.5,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    user: profileUser,
    isLoading: false,
    refetchUser: mockRefetchUser,
  }),
}));

vi.mock("@/services/api", () => ({
  getImageUrl: (path?: string) => (path ? `https://cdn.example.test/${path}` : undefined),
  usersApi: {
    updateProfile: (...args: any[]) => mockUpdateProfile(...args),
    getUserCommunities: (...args: any[]) => mockGetUserCommunities(...args),
    getTimeBank: (...args: any[]) => mockGetTimeBank(...args),
  },
  ratingsApi: {
    getUserRatings: (...args: any[]) => mockGetUserRatings(...args),
    getUserRatingsDetailed: (...args: any[]) => mockGetUserRatingsDetailed(...args),
  },
  uploadApi: {
    uploadProfilePicture: vi.fn(),
  },
  servicesApi: {
    getServices: (...args: any[]) => mockGetServices(...args),
  },
  joinRequestsApi: {
    getMyRequests: (...args: any[]) => mockGetMyRequests(...args),
  },
  transactionsApi: {
    getMyTransactions: (...args: any[]) => mockGetMyTransactions(...args),
  },
}));

vi.mock("@/components/ui/ActivitySummarySection", () => ({
  ActivitySummarySection: ({ transactions, ratings }: any) => (
    <div>
      Mock activity: {transactions.length} transactions, {ratings.length} ratings
    </div>
  ),
}));

vi.mock("../MyServices", () => ({
  MyServices: ({ activeTab }: any) => <div>Mock MyServices {activeTab}</div>,
}));

vi.mock("@/components/ui/BadgeDisplay", () => ({
  BadgeDisplay: () => <div>Mock badge display</div>,
}));

vi.mock("@/components/ui/RatingStars", () => ({
  RatingStars: ({ value }: any) => <span>Rating stars: {value}</span>,
}));

vi.mock("@/components/ui/InterestSelector", () => ({
  InterestSelector: ({ open, initialSelected, onSave }: any) =>
    open ? (
      <div>
        Interest selector open: {initialSelected.join(", ")}
        <button onClick={() => onSave(["Music", "Repair"])}>Save mock interests</button>
      </div>
    ) : null,
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: any) => <span>{name}</span>,
}));

vi.mock("@/components/ui/MapLocationPicker", () => ({
  MapLocationPicker: ({ onChange }: any) => (
    <button
      onClick={() =>
        onChange({ latitude: 41.01, longitude: 29.01, address: "Besiktas" })
      }
    >
      Mock location picker
    </button>
  ),
}));

vi.mock("../Chat", () => ({
  Chat: () => <div>Mock chat tab</div>,
}));

const community: Community = {
  _id: "community-1",
  name: "Kadikoy Helpers",
  slug: "kadikoy-helpers",
  description: "Neighbors helping neighbors.",
  rules: [],
  founder_id: "user-1",
  tags: [],
  member_count: 12,
  post_count: 3,
  is_pinned: false,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

const rating: RatingDetailed = {
  _id: "rating-1",
  transaction_id: "tx-1",
  rater_id: "user-2",
  rated_user_id: "user-1",
  score: 5,
  comment: "Great exchange",
  created_at: "2026-05-02T00:00:00Z",
};

function renderProfile(initialEntry = "/profile") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Profile />
        </MemoryRouter>
      </Theme>
    </QueryClientProvider>,
  );
}

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({});
    mockRefetchUser.mockResolvedValue({});
    mockGetUserRatings.mockResolvedValue({
      data: { total: 2, average_score: 4.6 },
    });
    mockGetUserRatingsDetailed.mockResolvedValue({
      data: { ratings: [rating], total: 1 },
    });
    mockGetUserCommunities.mockResolvedValue({
      data: { communities: [community], total: 1, mutual_count: 0 },
    });
    mockGetTimeBank.mockResolvedValue({
      data: {
        balance: 7.5,
        transactions: [{ id: "time-1" }],
        max_balance: 10,
        can_earn: true,
        effective_max_balance: 10,
        effective_min_balance: -10,
      },
    });
    mockGetServices.mockResolvedValue({ data: { services: [], total: 2 } });
    mockGetMyRequests.mockResolvedValue({ data: { requests: [], total: 1 } });
    mockGetMyTransactions.mockResolvedValue({
      data: { transactions: [{ _id: "tx-1" }], total: 1 },
    });
  });

  it("renders the profile summary with eager stats and communities", async () => {
    renderProfile();

    expect(screen.getByText("Aysenur Unal")).toBeInTheDocument();
    expect(screen.getByText("@aysenur")).toBeInTheDocument();
    expect(screen.getByText("7.5 hrs")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("4.6 (2 ratings)")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Open Kadikoy Helpers" })).toBeInTheDocument();
    expect(screen.getByText("Mock badge display")).toBeInTheDocument();
  });

  it("saves edited profile fields", async () => {
    const user = userEvent.setup();

    renderProfile();
    await user.click(screen.getByRole("button", { name: /Edit Profile/ }));

    const fullNameInput = screen.getByPlaceholderText("Full Name");
    await user.clear(fullNameInput);
    await user.type(fullNameInput, "Aysenur Updated");
    await user.click(screen.getByRole("button", { name: /Save Changes/ }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: "Aysenur Updated" }),
      );
    });
    expect(mockRefetchUser).toHaveBeenCalled();
  });

  it("opens interests from the URL parameter and saves selections", async () => {
    const user = userEvent.setup();

    renderProfile("/profile?interests=true");
    await screen.findByText(/Interest selector open: Music/);
    await user.click(screen.getByRole("button", { name: "Save mock interests" }));

    expect(mockUpdateProfile).toHaveBeenCalledWith({ interests: ["Music", "Repair"] });
    expect(mockRefetchUser).toHaveBeenCalled();
  });

  it("lazily renders visited tabs", async () => {
    const user = userEvent.setup();

    renderProfile();
    await user.click(screen.getByRole("tab", { name: /Chat/ }));
    expect(screen.getByText("Mock chat tab")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /My Services/ }));
    expect(screen.getByText("Mock MyServices services")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Activity/ }));
    expect(screen.getByText(/Mock activity/)).toBeInTheDocument();
  });
});
