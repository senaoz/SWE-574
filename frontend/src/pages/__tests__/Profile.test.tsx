import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { Profile } from "../Profile";

// ─── API mocks ────────────────────────────────────────────────────────────────
const mockGetTimeBank = vi.fn();
const mockUpdateProfile = vi.fn();
const mockGetUserCommunities = vi.fn();
const mockGetUserRatings = vi.fn();
const mockGetUserRatingsDetailed = vi.fn();
const mockGetServices = vi.fn();
const mockGetMyRequests = vi.fn();
const mockGetMyTransactions = vi.fn();

vi.mock("@/services/api", () => ({
  usersApi: {
    getTimeBank: () => mockGetTimeBank(),
    updateProfile: (...a: any[]) => mockUpdateProfile(...a),
    getUserCommunities: () => mockGetUserCommunities(),
  },
  ratingsApi: {
    getUserRatings: () => mockGetUserRatings(),
    getUserRatingsDetailed: () => mockGetUserRatingsDetailed(),
  },
  uploadApi: {
    uploadProfilePicture: vi.fn(),
  },
  servicesApi: {
    getServices: (...a: any[]) => mockGetServices(...a),
  },
  joinRequestsApi: {
    getMyRequests: () => mockGetMyRequests(),
  },
  transactionsApi: {
    getMyTransactions: () => mockGetMyTransactions(),
  },
  getImageUrl: (p: string | null) => p ?? "",
}));

// Stable reference — avoids infinite loop in useEffect([user]) in Profile.tsx
const MOCK_USER = {
  _id: "u1",
  username: "alice",
  full_name: "Alice Smith",
  email: "alice@example.com",
  bio: "Hello world",
  role: "user",
  timebank_balance: 3.5,
  interests: ["cooking"],
  is_verified: false,
  profile_picture: null,
  social_links: {},
  badges: [],
  created_at: new Date().toISOString(),
};
const mockRefetchUser = vi.fn();

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    user: MOCK_USER,
    isLoading: false,
    refetchUser: mockRefetchUser,
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Heavy component mocks ────────────────────────────────────────────────────
vi.mock("@/pages/MyServices", () => ({
  MyServices: () => <div data-testid="my-services" />,
}));

vi.mock("@/pages/Chat", () => ({
  Chat: () => <div data-testid="chat" />,
}));

vi.mock("@/components/ui/ActivitySummarySection", () => ({
  ActivitySummarySection: () => <div data-testid="activity-summary" />,
}));

vi.mock("@/components/ui/InterestSelector", () => ({
  InterestSelector: () => <div data-testid="interest-selector" />,
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: { name: string }) => (
    <span data-testid="interest-chip">{name}</span>
  ),
}));

vi.mock("@/components/ui/MapLocationPicker", () => ({
  MapLocationPicker: () => <div data-testid="map-location-picker" />,
}));

vi.mock("@/components/ui/BadgeDisplay", () => ({
  BadgeDisplay: () => <div data-testid="badge-display" />,
}));

vi.mock("@/components/ui/RatingStars", () => ({
  RatingStars: () => <div data-testid="rating-stars" />,
}));

vi.mock("@/constants/profilePicturePresets", () => ({
  PROFILE_PICTURE_PRESETS: [
    { id: "p1", url: "/presets/p1.png", name: "Bee" },
  ],
}));

function renderProfile(path = "/profile") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Theme>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[path]}>
          <Profile />
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTimeBank.mockResolvedValue({ data: { balance: 3.5, transactions: [], requires_need_creation: false } });
    mockGetUserCommunities.mockResolvedValue({ data: { communities: [] } });
    mockGetUserRatings.mockResolvedValue({ data: { average: 4.5, count: 2 } });
    mockGetUserRatingsDetailed.mockResolvedValue({ data: { ratings: [] } });
    mockGetServices.mockResolvedValue({ data: { services: [], total: 0 } });
    mockGetMyRequests.mockResolvedValue({ data: { requests: [] } });
    mockGetMyTransactions.mockResolvedValue({ data: { transactions: [] } });
  });

  it("renders all 7 tab triggers", () => {
    renderProfile();
    expect(screen.getByRole("tab", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /activity/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /my services/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /my applications/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /timebank logs/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /saved items/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /chat/i })).toBeInTheDocument();
  });

  it("shows the user's full name", () => {
    renderProfile();
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("shows the user's username", () => {
    renderProfile();
    expect(screen.getByText("@alice")).toBeInTheDocument();
  });

  it("shows timebank balance strip", () => {
    renderProfile();
    expect(screen.getByText(/3\.5 hrs/i)).toBeInTheDocument();
  });

  it("shows bio text in profile tab", () => {
    renderProfile();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("shows interests chip in profile tab", () => {
    renderProfile();
    expect(screen.getByText("cooking")).toBeInTheDocument();
  });

  it("switches to My Services tab on click", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("tab", { name: /my services/i }));
    await waitFor(() => {
      expect(screen.getByTestId("my-services")).toBeInTheDocument();
    });
  });

  it("switches to Chat tab and renders Chat component", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("tab", { name: /chat/i }));
    await waitFor(() => {
      expect(screen.getByTestId("chat")).toBeInTheDocument();
    });
  });

  it("opens chat tab when URL includes ?tab=chat", () => {
    renderProfile("/profile?tab=chat");
    expect(screen.getByTestId("chat")).toBeInTheDocument();
  });

  it("shows Activity tab with ActivitySummarySection", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("tab", { name: /activity/i }));
    await waitFor(() => {
      expect(screen.getByTestId("activity-summary")).toBeInTheDocument();
    });
  });
});
