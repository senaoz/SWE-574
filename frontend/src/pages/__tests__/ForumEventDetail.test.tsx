import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Community, ForumEvent } from "@/types";
import { ForumEventDetail } from "../ForumEventDetail";

const mockNavigate = vi.fn();
const mockGetEvent = vi.fn();
const mockGetEventAttendees = vi.fn();
const mockAttendEvent = vi.fn();
const mockUnattendEvent = vi.fn();
const mockPinEvent = vi.fn();
const mockUpdateEvent = vi.fn();
const mockDeleteEvent = vi.fn();
const mockUpvoteEvent = vi.fn();
const mockGetComments = vi.fn();
const mockCreateComment = vi.fn();
const mockUpvoteComment = vi.fn();
const mockGetCommunity = vi.fn();

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
    currentUserId: "author-1",
    user: { _id: "author-1", role: "admin" },
  }),
}));

vi.mock("@/services/api", () => ({
  getImageUrl: (path?: string) => (path ? `https://cdn.example.test/${path}` : undefined),
  uploadApi: {
    uploadForumEventImage: vi.fn(),
  },
  forumApi: {
    getEvent: (...args: any[]) => mockGetEvent(...args),
    getEventAttendees: (...args: any[]) => mockGetEventAttendees(...args),
    attendEvent: (...args: any[]) => mockAttendEvent(...args),
    unattendEvent: (...args: any[]) => mockUnattendEvent(...args),
    pinEvent: (...args: any[]) => mockPinEvent(...args),
    updateEvent: (...args: any[]) => mockUpdateEvent(...args),
    deleteEvent: (...args: any[]) => mockDeleteEvent(...args),
    upvoteEvent: (...args: any[]) => mockUpvoteEvent(...args),
    getComments: (...args: any[]) => mockGetComments(...args),
    createComment: (...args: any[]) => mockCreateComment(...args),
    upvoteComment: (...args: any[]) => mockUpvoteComment(...args),
  },
  communityApi: {
    getCommunity: (...args: any[]) => mockGetCommunity(...args),
  },
}));

vi.mock("@/components/ui/ClickableTag", () => ({
  ClickableTag: ({ tag }: any) => (
    <span>{typeof tag === "string" ? tag : tag.label}</span>
  ),
}));

vi.mock("@/components/ui/UpvoteButton", () => ({
  UpvoteButton: ({ count, onUpvote }: any) => (
    <button type="button" onClick={onUpvote}>
      Upvote {count}
    </button>
  ),
}));

vi.mock("@/components/ui/CommentSection", () => ({
  CommentSection: ({ placeholder, emptyMessage, postComment }: any) => (
    <div>
      <span>{placeholder}</span>
      <span>{emptyMessage}</span>
      <button type="button" onClick={() => postComment?.("Nice event", [])}>
        Post comment
      </button>
    </div>
  ),
}));

vi.mock("@/components/forms/MarkdownEditor", () => ({
  MarkdownEditor: ({ value, onChange }: any) => (
    <textarea
      aria-label="Description *"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/components/forms/TagAutocomplete", () => ({
  TagAutocomplete: ({ tags }: any) => (
    <div>Editing tags: {tags.map((tag: any) => tag.label).join(", ")}</div>
  ),
}));

vi.mock("@/components/ui/MapLocationPicker", () => ({
  MapLocationPicker: ({ value, onChange }: any) => (
    <button
      type="button"
      onClick={() =>
        onChange({ latitude: 41.01, longitude: 29.02, address: "Moda" })
      }
    >
      Location picker {value.address}
    </button>
  ),
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({ open, title, onConfirm }: any) =>
    open ? (
      <div>
        <span>{title}</span>
        <button type="button" onClick={onConfirm}>
          Confirm delete
        </button>
      </div>
    ) : null,
}));

const community: Community = {
  _id: "community-1",
  name: "Music Neighbors",
  slug: "music-neighbors",
  description: "Local music group",
  rules: [],
  founder_id: "author-1",
  tags: [],
  member_count: 4,
  post_count: 2,
  is_pinned: false,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  user_membership: "founder",
};

const event: ForumEvent = {
  _id: "event-1",
  user_id: "author-1",
  title: "Neighborhood Jam",
  description: "Bring your **instrument** and join.",
  event_at: "2026-06-01T15:30:00Z",
  location: "Kadikoy",
  latitude: 40.99,
  longitude: 29.03,
  is_remote: false,
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  service_id: "service-1",
  service: {
    id: "service-1",
    title: "Guitar lessons",
    service_type: "offer",
  },
  created_at: "2026-05-02T00:00:00Z",
  updated_at: "2026-05-02T00:00:00Z",
  user: {
    id: "author-1",
    username: "owner",
    full_name: "Owner User",
    profile_picture: "owner.jpg",
  },
  comment_count: 1,
  attendee_ids: [],
  attendee_count: 2,
  upvote_count: 3,
  user_upvoted: false,
  image_urls: ["event-photo.jpg"],
  banner_image_url: "banner.jpg",
  community_id: "community-1",
  is_pinned: false,
};

function renderDetail() {
  return render(
    <Theme>
      <MemoryRouter initialEntries={["/forum/events/event-1"]}>
        <Routes>
          <Route path="/forum/events/:id" element={<ForumEventDetail />} />
        </Routes>
      </MemoryRouter>
    </Theme>,
  );
}

describe("ForumEventDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEvent.mockResolvedValue({ data: event });
    mockGetEventAttendees.mockResolvedValue({
      data: [
        { _id: "attendee-1", username: "alice", full_name: "Alice User" },
        { _id: "attendee-2", username: "bob", full_name: "Bob User" },
      ],
    });
    mockAttendEvent.mockResolvedValue({
      data: { ...event, attendee_ids: ["author-1"], attendee_count: 3 },
    });
    mockUnattendEvent.mockResolvedValue({ data: event });
    mockPinEvent.mockResolvedValue({ data: { ...event, is_pinned: true } });
    mockUpdateEvent.mockResolvedValue({
      data: { ...event, title: "Updated event" },
    });
    mockDeleteEvent.mockResolvedValue({});
    mockUpvoteEvent.mockResolvedValue({ data: { count: 4, upvoted: true } });
    mockGetComments.mockResolvedValue({ data: { comments: [] } });
    mockCreateComment.mockResolvedValue({ data: {} });
    mockUpvoteComment.mockResolvedValue({ data: {} });
    mockGetCommunity.mockResolvedValue({ data: community });
  });

  it("loads event details and handles moderation, attendance, and navigation", async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Neighborhood Jam" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to Forum")).toBeInTheDocument();
    expect(screen.getByText(/Owner User/)).toBeInTheDocument();
    expect(screen.getByText("Kadikoy")).toBeInTheDocument();
    expect(screen.getByText("Guitar lessons")).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByText("Attendees (2)")).toBeInTheDocument();
    expect(screen.getByLabelText("View Alice User profile")).toBeInTheDocument();
    expect(screen.getByText("Related Community")).toBeInTheDocument();
    expect(screen.getByText("Music Neighbors")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pin/ }));
    expect(mockPinEvent).toHaveBeenCalledWith("event-1", true);
    expect(await screen.findByText("Pinned by moderator")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Attend/ }));
    await waitFor(() => expect(mockAttendEvent).toHaveBeenCalledWith("event-1"));
    expect(await screen.findByText(/Attending/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Upvote 3/ }));
    expect(mockUpvoteEvent).toHaveBeenCalledWith("event-1");

    await user.click(screen.getByText("Music Neighbors"));
    expect(mockNavigate).toHaveBeenCalledWith("/forum/communities/community-1");
  });

  it("updates and deletes the event", async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "Neighborhood Jam" });

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    const titleInput = screen.getByDisplayValue("Neighborhood Jam");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated event");
    await user.click(screen.getByText(/Location picker/));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith(
        "event-1",
        expect.objectContaining({
          title: "Updated event",
          description: "Bring your **instrument** and join.",
          location: "Moda",
          latitude: 41.01,
          longitude: 29.02,
          is_remote: false,
          tags: event.tags,
          banner_image_url: "banner.jpg",
          image_urls: ["event-photo.jpg"],
        }),
      );
    });
    expect(
      await screen.findByRole("heading", { name: "Updated event" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Delete/ }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(mockDeleteEvent).toHaveBeenCalledWith("event-1");
    expect(mockNavigate).toHaveBeenCalledWith("/forum?tab=events");
  });

  it("shows a not found state when the event cannot be loaded", async () => {
    mockGetEvent.mockRejectedValue(new Error("missing"));

    renderDetail();

    expect(await screen.findByText("Event not found.")).toBeInTheDocument();
  });
});
