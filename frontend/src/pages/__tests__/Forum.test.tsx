import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Community, ForumDiscussion, ForumEvent } from "@/types";
import { Forum } from "../Forum";

const mockNavigate = vi.fn();
const mockGetDiscussions = vi.fn();
const mockGetEvents = vi.fn();
const mockGetCommunities = vi.fn();
const mockPinDiscussion = vi.fn();
const mockPinEvent = vi.fn();
const mockPinCommunity = vi.fn();

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
  useUser: () => ({
    currentUserId: "admin-1",
    user: { _id: "admin-1", role: "admin" },
  }),
}));

vi.mock("@/services/api", () => ({
  getImageUrl: (path?: string) => (path ? `https://cdn.example.test/${path}` : undefined),
  uploadApi: {},
  forumApi: {
    getDiscussions: (...args: any[]) => mockGetDiscussions(...args),
    getEvents: (...args: any[]) => mockGetEvents(...args),
    pinDiscussion: (...args: any[]) => mockPinDiscussion(...args),
    pinEvent: (...args: any[]) => mockPinEvent(...args),
  },
  communityApi: {
    getCommunities: (...args: any[]) => mockGetCommunities(...args),
    pinCommunity: (...args: any[]) => mockPinCommunity(...args),
  },
}));

vi.mock("@/components/ui/UpvoteButton", () => ({
  UpvoteButton: ({ count }: any) => <span>Upvotes: {count}</span>,
}));

vi.mock("@/components/forms/TagAutocomplete", () => ({
  TagAutocomplete: () => <div>Mock tag autocomplete</div>,
}));

vi.mock("@/components/forms/MarkdownEditor", () => ({
  MarkdownEditor: () => <textarea aria-label="Mock markdown editor" />,
}));

vi.mock("@/components/ui/MapLocationPicker", () => ({
  MapLocationPicker: () => <div>Mock map picker</div>,
}));

vi.mock("@/components/ui/ClickableTag", () => ({
  ClickableTag: ({ tag }: any) => (
    <span>{typeof tag === "string" ? tag : tag.label}</span>
  ),
}));

const discussion: ForumDiscussion = {
  _id: "discussion-1",
  user_id: "user-1",
  title: "Skill swap ideas",
  body: "Let us trade useful skills.",
  tags: [{ label: "Community", entityId: "Q1", description: "" }],
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  user: { id: "user-1", username: "alice", full_name: "Alice User" },
  comment_count: 3,
  upvote_count: 7,
  user_upvoted: false,
  community_id: "community-1",
  is_pinned: false,
};

const event: ForumEvent = {
  _id: "event-1",
  user_id: "user-1",
  title: "Park cleanup",
  description: "Bring gloves and good energy.",
  event_at: "2026-05-12T10:00:00Z",
  location: "Kadikoy",
  is_remote: false,
  tags: [{ label: "Outdoors", entityId: "Q2", description: "" }],
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  user: { id: "user-1", username: "alice", full_name: "Alice User" },
  comment_count: 2,
  attendee_ids: ["user-2"],
  attendee_count: 1,
  upvote_count: 5,
  community_id: "community-1",
  is_pinned: true,
};

const community: Community = {
  _id: "community-1",
  name: "Kadikoy Helpers",
  slug: "kadikoy-helpers",
  description: "Neighbors helping neighbors.",
  rules: ["Be kind"],
  founder_id: "user-1",
  tags: [{ label: "Local", entityId: "Q3", description: "" }],
  member_count: 12,
  post_count: 4,
  is_pinned: false,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  founder: { id: "user-1", username: "alice", full_name: "Alice User" },
  user_membership: "member",
};

function renderForum(initialEntry = "/forum") {
  return render(
    <Theme>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Forum />
      </MemoryRouter>
    </Theme>,
  );
}

describe("Forum page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDiscussions.mockResolvedValue({
      data: { discussions: [discussion], total: 1, page: 1, limit: 20 },
    });
    mockGetEvents.mockResolvedValue({
      data: { events: [event], total: 1, page: 1, limit: 20 },
    });
    mockGetCommunities.mockResolvedValue({
      data: { communities: [community], total: 1, page: 1, limit: 20 },
    });
    mockPinDiscussion.mockResolvedValue({});
    mockPinEvent.mockResolvedValue({});
    mockPinCommunity.mockResolvedValue({});
  });

  it("loads discussions, events, and communities", async () => {
    renderForum();

    await waitFor(() => {
      expect(screen.getByText("Skill swap ideas")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("tab", { name: /Discussions \(1\)/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Events \(1\)/ })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Communities \(1\)/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(mockGetDiscussions).toHaveBeenCalledWith(
      expect.objectContaining({ sort_by: "created_at" }),
    );
  });

  it("switches to communities and navigates to a community", async () => {
    const user = userEvent.setup();

    renderForum();
    await screen.findByText("Skill swap ideas");

    await user.click(screen.getByRole("button", { name: "See Communities" }));
    await screen.findByText("Kadikoy Helpers");
    await user.click(screen.getByText("Kadikoy Helpers"));

    expect(mockNavigate).toHaveBeenCalledWith("/forum/communities/community-1");
  });

  it("lets moderators pin a discussion", async () => {
    const user = userEvent.setup();

    renderForum();
    await screen.findByText("Skill swap ideas");
    await user.click(screen.getByRole("button", { name: "Pin" }));

    expect(mockPinDiscussion).toHaveBeenCalledWith("discussion-1", true);
  });
});
