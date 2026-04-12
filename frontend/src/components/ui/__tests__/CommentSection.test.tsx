import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CommentSection, CommentItem } from "../CommentSection";

vi.mock("@/services/api", () => ({
  getImageUrl: (url: string) => url ?? "",
  uploadApi: {
    uploadCommentImage: vi.fn(),
  },
}));

const mockComment: CommentItem = {
  _id: "c1",
  content: "Great service!",
  user_id: "u1",
  created_at: "2026-01-01T00:00:00Z",
  user: { username: "alice", full_name: "Alice Smith" },
};

const mockFetchComments = vi.fn();
const mockPostComment = vi.fn();

function renderSection(overrides?: Partial<Parameters<typeof CommentSection>[0]>) {
  return render(
    <MemoryRouter>
      <CommentSection
        fetchComments={mockFetchComments}
        postComment={mockPostComment}
        title="Comments & Ideas"
        placeholder="Add a comment, idea, or share your experience..."
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe("CommentSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the comments heading", async () => {
    mockFetchComments.mockResolvedValue([]);
    renderSection();
    expect(screen.getByText(/Comments & Ideas/)).toBeInTheDocument();
  });

  it("shows empty state when there are no comments", async () => {
    mockFetchComments.mockResolvedValue([]);
    renderSection();
    await waitFor(() => {
      expect(
        screen.getByText("No comments yet. Be the first to share your thoughts!"),
      ).toBeInTheDocument();
    });
  });

  it("renders fetched comments", async () => {
    mockFetchComments.mockResolvedValue([mockComment]);
    renderSection();
    await waitFor(() => {
      expect(screen.getByText("Great service!")).toBeInTheDocument();
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });
  });

  it("post button is disabled when textarea is empty", async () => {
    mockFetchComments.mockResolvedValue([]);
    renderSection();
    const button = screen.getByRole("button", { name: /Post Comment/i });
    expect(button).toBeDisabled();
  });

  it("calls postComment and shows new comment after submit", async () => {
    const user = userEvent.setup();
    mockFetchComments.mockResolvedValue([]);
    const newComment: CommentItem = {
      _id: "c2",
      content: "Hello world",
      user_id: "u2",
      created_at: "2026-01-02T00:00:00Z",
      user: { username: "bob", full_name: "Bob Jones" },
    };
    mockPostComment.mockResolvedValue(newComment);

    renderSection();

    const textarea = screen.getByPlaceholderText(
      "Add a comment, idea, or share your experience...",
    );
    await user.type(textarea, "Hello world");
    await user.click(screen.getByRole("button", { name: /Post Comment/i }));

    await waitFor(() => {
      expect(mockPostComment).toHaveBeenCalledWith("Hello world", undefined);
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("shows comment count in heading", async () => {
    mockFetchComments.mockResolvedValue([mockComment]);
    renderSection();
    await waitFor(() => {
      expect(screen.getByText(/Comments & Ideas \(1\)/)).toBeInTheDocument();
    });
  });
});
