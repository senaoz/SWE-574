import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Community, CommunityPost } from "@/types";
import { CommunityPostDetail } from "../CommunityPostDetail";

const mockNavigate = vi.fn();
const mockGetCommunity = vi.fn();
const mockGetPost = vi.fn();
const mockPinPost = vi.fn();
const mockUpdatePost = vi.fn();
const mockDeletePost = vi.fn();
const mockUpvotePost = vi.fn();
const mockGetComments = vi.fn();
const mockCreateComment = vi.fn();
const mockUpvoteComment = vi.fn();

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
  communityApi: {
    getCommunity: (...args: any[]) => mockGetCommunity(...args),
    getPost: (...args: any[]) => mockGetPost(...args),
    pinPost: (...args: any[]) => mockPinPost(...args),
    updatePost: (...args: any[]) => mockUpdatePost(...args),
    deletePost: (...args: any[]) => mockDeletePost(...args),
    upvotePost: (...args: any[]) => mockUpvotePost(...args),
  },
  forumApi: {
    getComments: (...args: any[]) => mockGetComments(...args),
    createComment: (...args: any[]) => mockCreateComment(...args),
    upvoteComment: (...args: any[]) => mockUpvoteComment(...args),
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
        onClick={() => postComment?.("Nice post", [])}
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
  member_count: 5,
  post_count: 2,
  is_pinned: false,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  user_membership: "founder",
};

const post: CommunityPost = {
  _id: "post-1",
  community_id: "community-1",
  user_id: "author-1",
  title: "Piano meetup",
  body: "Welcome **neighbors** to the practice session.",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  post_type: "announcement",
  is_pinned: false,
  upvote_count: 3,
  user_upvoted: false,
  comment_count: 1,
  created_at: "2026-05-02T00:00:00Z",
  updated_at: "2026-05-02T00:00:00Z",
  user: {
    id: "author-1",
    username: "owner",
    full_name: "Owner User",
    profile_picture: "owner.jpg",
  },
};

function renderDetail() {
  return render(
    <Theme>
      <MemoryRouter initialEntries={["/forum/communities/community-1/posts/post-1"]}>
        <Routes>
          <Route
            path="/forum/communities/:id/posts/:postId"
            element={<CommunityPostDetail />}
          />
        </Routes>
      </MemoryRouter>
    </Theme>,
  );
}

describe("CommunityPostDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCommunity.mockResolvedValue({ data: community });
    mockGetPost.mockResolvedValue({ data: post });
    mockPinPost.mockResolvedValue({ data: { ...post, is_pinned: true } });
    mockUpdatePost.mockResolvedValue({
      data: { ...post, title: "Updated piano meetup" },
    });
    mockDeletePost.mockResolvedValue({});
    mockUpvotePost.mockResolvedValue({ data: { count: 4, upvoted: true } });
    mockGetComments.mockResolvedValue({ data: { comments: [] } });
    mockCreateComment.mockResolvedValue({ data: {} });
    mockUpvoteComment.mockResolvedValue({ data: {} });
  });

  it("loads a community post and exposes moderation actions", async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Piano meetup" })).toBeInTheDocument();
    expect(screen.getByText("Back to Music Neighbors")).toBeInTheDocument();
    expect(screen.getByText(/Owner User/)).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByText("Write a comment...")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pin/ }));
    expect(mockPinPost).toHaveBeenCalledWith("community-1", "post-1", true);
    expect(await screen.findByText("Pinned")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Upvote 3/ }));
    expect(mockUpvotePost).toHaveBeenCalledWith("community-1", "post-1");
  });

  it("updates and deletes the post", async () => {
    const user = userEvent.setup();
    renderDetail();
    await screen.findByRole("heading", { name: "Piano meetup" });

    await user.click(screen.getByRole("button", { name: /Edit/ }));
    await user.clear(screen.getByDisplayValue("Piano meetup"));
    await user.type(screen.getByDisplayValue(""), "Updated piano meetup");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdatePost).toHaveBeenCalledWith("community-1", "post-1", {
        title: "Updated piano meetup",
        body: "Welcome **neighbors** to the practice session.",
        tags: post.tags,
        post_type: "announcement",
      });
    });
    expect(await screen.findByRole("heading", { name: "Updated piano meetup" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Delete/ }));
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(mockDeletePost).toHaveBeenCalledWith("community-1", "post-1");
    expect(mockNavigate).toHaveBeenCalledWith("/forum/communities/community-1");
  });

  it("shows a not found state when the post cannot be loaded", async () => {
    mockGetPost.mockRejectedValue(new Error("missing"));

    renderDetail();

    expect(await screen.findByText("Post not found.")).toBeInTheDocument();
  });
});
