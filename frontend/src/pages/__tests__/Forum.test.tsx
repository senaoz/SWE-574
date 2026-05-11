import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { Forum } from "../Forum";

// ─── API mocks ────────────────────────────────────────────────────────────────
const mockGetDiscussions = vi.fn();
const mockGetEvents = vi.fn();
const mockGetCommunities = vi.fn();

vi.mock("@/services/api", () => ({
  forumApi: {
    getDiscussions: (...a: any[]) => mockGetDiscussions(...a),
    getEvents: (...a: any[]) => mockGetEvents(...a),
    pinDiscussion: vi.fn(),
    pinEvent: vi.fn(),
    createDiscussion: vi.fn(),
    createEvent: vi.fn(),
  },
  communityApi: {
    getCommunities: (...a: any[]) => mockGetCommunities(...a),
    pinCommunity: vi.fn(),
    createCommunity: vi.fn(),
  },
  uploadApi: {
    uploadDiscussionImage: vi.fn(),
    uploadForumEventImage: vi.fn(),
    uploadCommunityImage: vi.fn(),
  },
  getImageUrl: (p: string) => p,
}));

// Forum uses useUser from @/App, not from @/contexts/UserContext
vi.mock("@/App", () => ({
  useUser: () => ({ currentUserId: "u1", user: { role: "user" } }),
  useTheme: () => ({ appearance: "light", toggleAppearance: vi.fn() }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/components/forms/TagAutocomplete", () => ({
  TagAutocomplete: () => <div data-testid="tag-autocomplete" />,
}));

vi.mock("@/components/forms/MarkdownEditor", () => ({
  MarkdownEditor: ({ placeholder, value, onChange }: any) => (
    <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("@/components/ui/MapLocationPicker", () => ({
  MapLocationPicker: () => <div data-testid="map-location-picker" />,
}));

vi.mock("@/components/ui/UpvoteButton", () => ({
  UpvoteButton: ({ count }: { count: number }) => (
    <button data-testid="upvote-btn">{count}</button>
  ),
}));

vi.mock("@/components/ui/ClickableTag", () => ({
  ClickableTag: ({ tag }: { tag: any }) => (
    <span data-testid="clickable-tag">
      {typeof tag === "string" ? tag : tag.label}
    </span>
  ),
}));

function makeDiscussion(id: string, title: string) {
  return {
    _id: id,
    title,
    body: "Some body text",
    created_at: new Date().toISOString(),
    upvote_count: 0,
    comment_count: 0,
    user_upvoted: false,
    tags: [],
    is_pinned: false,
    user: { _id: "u1", username: "alice", full_name: "Alice" },
  };
}

function makeEvent(id: string, title: string) {
  return {
    _id: id,
    title,
    description: "Event description",
    event_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    upvote_count: 0,
    comment_count: 0,
    attendee_count: 0,
    user_upvoted: false,
    tags: [],
    is_pinned: false,
    is_remote: false,
    user: { _id: "u1", username: "alice", full_name: "Alice" },
  };
}

function makeCommunity(id: string, name: string) {
  return {
    _id: id,
    name,
    description: "A community",
    member_count: 5,
    post_count: 3,
    tags: [],
    is_pinned: false,
    created_at: new Date().toISOString(),
    founder: { _id: "u1", username: "alice", full_name: "Alice" },
  };
}

function renderForum(path = "/forum?tab=events") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Theme>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[path]}>
          <Forum />
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("Forum", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDiscussions.mockResolvedValue({
      data: { discussions: [], total: 0 },
    });
    mockGetEvents.mockResolvedValue({
      data: { events: [], total: 0 },
    });
    mockGetCommunities.mockResolvedValue({
      data: { communities: [], total: 0 },
    });
  });

  it("renders the hero heading", async () => {
    renderForum();
    expect(screen.getByText(/people platform/i)).toBeInTheDocument();
  });

  it("renders global search bar", async () => {
    renderForum();
    expect(
      screen.getByPlaceholderText(/search discussions, events/i),
    ).toBeInTheDocument();
  });

  it("renders three tab triggers: Communities, Discussions, Events", async () => {
    renderForum();
    expect(screen.getByRole("tab", { name: /communities/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /discussions/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /events/i })).toBeInTheDocument();
  });

  it("shows loading state in events tab initially", () => {
    mockGetEvents.mockReturnValue(new Promise(() => {}));
    renderForum();
    expect(screen.getAllByText(/loading/i).length).toBeGreaterThan(0);
  });

  it("shows empty state in events tab when no events", async () => {
    renderForum();
    await waitFor(() => {
      expect(screen.getByText(/no events yet/i)).toBeInTheDocument();
    });
  });

  it("renders events after loading", async () => {
    mockGetEvents.mockResolvedValue({
      data: {
        events: [makeEvent("e1", "Coding Meetup"), makeEvent("e2", "Hike Day")],
        total: 2,
      },
    });
    renderForum();
    await waitFor(() => {
      expect(screen.getByText("Coding Meetup")).toBeInTheDocument();
      expect(screen.getByText("Hike Day")).toBeInTheDocument();
    });
  });

  it("shows empty state in discussions tab when no discussions", async () => {
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /discussions/i }));
    await waitFor(() => {
      expect(screen.getByText(/no discussions yet/i)).toBeInTheDocument();
    });
  });

  it("renders discussions after switching to discussions tab", async () => {
    mockGetDiscussions.mockResolvedValue({
      data: {
        discussions: [makeDiscussion("d1", "How do I start?")],
        total: 1,
      },
    });
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /discussions/i }));
    await waitFor(() => {
      expect(screen.getByText("How do I start?")).toBeInTheDocument();
    });
  });

  it("shows empty state in communities tab when no communities", async () => {
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /communities/i }));
    await waitFor(() => {
      expect(screen.getByText(/no communities yet/i)).toBeInTheDocument();
    });
  });

  it("renders communities after switching to communities tab", async () => {
    mockGetCommunities.mockResolvedValue({
      data: {
        communities: [makeCommunity("c1", "Gardening Club")],
        total: 1,
      },
    });
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /communities/i }));
    await waitFor(() => {
      expect(screen.getByText("Gardening Club")).toBeInTheDocument();
    });
  });

  it("shows 'See Communities' button that switches to communities tab", async () => {
    const user = userEvent.setup();
    renderForum();
    const btn = screen.getByRole("button", { name: /see communities/i });
    await user.click(btn);
    // Communities tab should now be active
    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /communities/i, selected: true } as any),
      ).toBeInTheDocument();
    });
  });

  it("shows New Discussion button in discussions tab", async () => {
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /discussions/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /new discussion/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows New Event button in events tab", async () => {
    renderForum();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /new event/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows New Community button in communities tab for logged in user", async () => {
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /communities/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /new community/i }),
      ).toBeInTheDocument();
    });
  });

  it("navigates to discussion detail on card click", async () => {
    mockGetDiscussions.mockResolvedValue({
      data: { discussions: [makeDiscussion("d1", "Click me")], total: 1 },
    });
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /discussions/i }));
    await waitFor(() => screen.getByText("Click me"));
    // Click the card (it navigates on click)
    await user.click(screen.getByText("Click me"));
    expect(mockNavigate).toHaveBeenCalledWith("/forum/discussions/d1");
  });

  it("displays sort buttons in discussions tab", async () => {
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole("tab", { name: /discussions/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /latest/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /most upvoted/i })).toBeInTheDocument();
    });
  });
});
