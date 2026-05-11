import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { User } from "@/types";
import { ProviderProfileSummary } from "../ProviderProfileSummary";

const mockNavigate = vi.fn();
const mockGetUserBadges = vi.fn();
const mockGetUserRatings = vi.fn();

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
    getUserBadges: (...args: any[]) => mockGetUserBadges(...args),
  },
  ratingsApi: {
    getUserRatings: (...args: any[]) => mockGetUserRatings(...args),
  },
}));

vi.mock("../BadgeDisplay", () => ({
  CustomBadge: ({ badge }: any) => <span>{badge.name}</span>,
  getHighestPriorityBadge: (badges: any[]) => badges[0] ?? null,
}));

const user: User = {
  _id: "user-2",
  username: "alice",
  email: "alice@example.test",
  full_name: "Alice User",
  bio: "Neighborhood music mentor",
  profile_picture: "avatars/alice.png",
  is_active: true,
  is_verified: true,
  role: "user",
  timebank_balance: 4,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

describe("ProviderProfileSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserBadges.mockResolvedValue({
      data: {
        badges: [
          {
            key: "helper",
            name: "Helpful Neighbor",
            description: "Helpful",
            icon: "star",
            earned: true,
          },
        ],
        earned_count: 1,
        total_count: 3,
      },
    });
    mockGetUserRatings.mockResolvedValue({
      data: { total: 2, average_score: 4.5 },
    });
  });

  it("shows user profile, badge, rating, and verified status", async () => {
    render(
      <Theme>
        <MemoryRouter>
          <ProviderProfileSummary user={user} />
        </MemoryRouter>
      </Theme>,
    );

    expect(screen.getByText("Alice User")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("Neighborhood music mentor")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Helpful Neighbor")).toBeInTheDocument();
    });
    expect(screen.getByText("4.5 (2 ratings)")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("navigates to the public user detail page when clicked", async () => {
    const clicker = userEvent.setup();
    const { container } = render(
      <Theme>
        <MemoryRouter>
          <ProviderProfileSummary user={user} />
        </MemoryRouter>
      </Theme>,
    );

    const clickableCard = screen
      .getByText("Alice User")
      .closest(".cursor-pointer");

    await clicker.click(clickableCard as Element);

    expect(mockNavigate).toHaveBeenCalledWith("/user/user-2");
  });
});
