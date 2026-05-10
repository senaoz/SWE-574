import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Community, ForumDiscussion } from "@/types";
import { ForumDiscussionDetail } from "../ForumDiscussionDetail";

const mockNavigate = vi.fn();
const mockGetDiscussion = vi.fn();
const mockPinDiscussion = vi.fn();
const mockUpdateDiscussion = vi.fn();
const mockDeleteDiscussion = vi.fn();
const mockUpvoteDiscussion = vi.fn();
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
  forumApi: {
    getDiscussion: (...args: any[]) => mockGetDiscussion(...args),
    pinDiscussion: (...args: any[]) => mockPinDiscussion(...args),
    updateDiscussion: (...args: any[]) => mockUpdateDiscussion(...args),
    deleteDiscussion: (...args: any[]) => mockDeleteDiscussion(...args),
    upvoteDiscussion: (...args: any[]) => mockUpvoteDiscussion(...args),
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
      <button
        type="button"
        disabled={!postComment}
        onClick={() => postComment?.("Helpful note", [])}
      >
        Post comment
      </button>
    </div>
  ),
}));

vi.mock("@/components/forms/MarkdownEditor", () => ({
  MarkdownEditor: ({ value, onChange }: any) => (
    <textarea
      aria-label="Body *"
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

const discussion: ForumDiscussion = {
  _id: "discussion-1",
  user_id: "author-1",
  title: "Learning piano together",
  body: "Let us **practice** together.",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  created_at: "2026-05-02T00:00:00Z",
  updated_at: "2026-05-02T00:00:00Z",
  user: {
    id: "author-1",
    username: "owner",
    full_name: "Owner User",
    profile_picture: "owner.jpg",
  },
  comment_count: 1,
  upvote_count: 3,
  user_upvoted: false,
  image_urls: ["discussion.jpg"],
  community_id: "community-1",
  is_pinned: false,
};

function renderDetail() {
  return render(
    <Theme>
      <MemoryRouter initialEntries={["/forum/discussions/discussion-1"]}>
        <Routes>
          <Route path="/forum/discussions/:id" element={<ForumDiscussionDetail />} />
        </Routes>
      </MemoryRouter>
    </Theme>,
  );
}

describe("ForumDiscussionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDiscussion.mockResolvedValue({ data: discussion });
    mockPinDiscussion.mockResolvedValue({ data: { ...discussion, is_pinned: true } });
    mockUpdateDiscussion.mockResolvedValue({
      data: { ...discussion, title: "Updated discussion" },
    });
    mockDeleteDiscussion.mockResolvedValue({});
    mockUpvoteDiscussion.mockResolvedValue({ data: { count: 4, upvoted: true } });
    mockGetComments.mockResolvedValue({ data: { comments: [] } });
    mockCreateComment.mockResolvedValue({ data: {} });
    mockUpvoteComment.mockResolvedValue({ data: {} });
    mockGetCommunity.mockResolvedValue({ data: community });
  });

  it("loads a discussion and exposes moderation actions", async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Learning piano together" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to Forum")).toBeInTheDocument();
    expect(screen.getByText(/Owner User/)).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByText("Write a comment...")).toBeInTheDocument();
    expect(screen.getByText("Related Community")).toBeInTheDocument();
    expect(screen.getByText("Music Neighbors")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pin/ }));
    expect(mockPinDiscussion).toHaveBeenCalledWith("discussion-1", true);
    expect(await screen.findByText("Pinned by moderator")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Upvote 3/ }));
    expect(mockUpvoteDiscussion).toHaveBeenCalledWith("discussion-1");

    await user.click(screen.getByText("Music Neighbors"));
    expect(mockNavigate).toHaveBeenCalledWith("/forum/communities/community-1");
  });

  it("updates and deletes the discussion", async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "Learning piano together" });

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    await user.clear(screen.getByDisplayValue("Learning piano together"));
    await user.type(screen.getByDisplayValue(""), "Updated discussion");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateDiscussion).toHaveBeenCalledWith("discussion-1", {
        title: "Updated discussion",
        body: "Let us **practice** together.",
        tags: discussion.tags,
      });
    });
    expect(
      await screen.findByRole("heading", { name: "Updated discussion" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Delete/ }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(mockDeleteDiscussion).toHaveBeenCalledWith("discussion-1");
    expect(mockNavigate).toHaveBeenCalledWith("/forum?tab=discussions");
  });

  it("shows a not found state when the discussion cannot be loaded", async () => {
    mockGetDiscussion.mockRejectedValue(new Error("missing"));

    renderDetail();

    expect(await screen.findByText("Discussion not found.")).toBeInTheDocument();
  });
});
