import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CommentSection } from "../CommentSection";

const mockGetServiceComments = vi.fn();
const mockCreateComment = vi.fn();
const mockGetService = vi.fn();

vi.mock("@/services/api", () => ({
  commentsApi: {
    getServiceComments: (...args: any[]) => mockGetServiceComments(...args),
    createComment: (...args: any[]) => mockCreateComment(...args),
  },
  servicesApi: {
    getService: (...args: any[]) => mockGetService(...args),
  },
  getImageUrl: (url: string) => url ?? "",
}));

const mockComment = {
  _id: "c1",
  content: "Great service!",
  user_id: "u1",
  service_id: "svc-1",
  created_at: "2026-01-01T00:00:00Z",
  user: { _id: "u1", username: "alice", full_name: "Alice Smith" },
};

function renderSection(serviceId = "svc-1") {
  return render(
    <MemoryRouter>
      <CommentSection serviceId={serviceId} />
    </MemoryRouter>,
  );
}

describe("CommentSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetService.mockResolvedValue({ data: { _id: "svc-1", user_id: "owner-1" } });
  });

  it("renders the comments heading", async () => {
    mockGetServiceComments.mockResolvedValue({ data: { comments: [] } });
    renderSection();
    expect(screen.getByText(/Comments & Ideas/)).toBeInTheDocument();
  });

  it("shows empty state when there are no comments", async () => {
    mockGetServiceComments.mockResolvedValue({ data: { comments: [] } });
    renderSection();
    await waitFor(() => {
      expect(
        screen.getByText("No comments yet. Be the first to share your thoughts!"),
      ).toBeInTheDocument();
    });
  });

  it("renders fetched comments", async () => {
    mockGetServiceComments.mockResolvedValue({
      data: { comments: [mockComment] },
    });
    renderSection();
    await waitFor(() => {
      expect(screen.getByText("Great service!")).toBeInTheDocument();
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });
  });

  it("post button is disabled when textarea is empty", async () => {
    mockGetServiceComments.mockResolvedValue({ data: { comments: [] } });
    renderSection();
    const button = screen.getByRole("button", { name: /Post Comment/i });
    expect(button).toBeDisabled();
  });

  it("calls createComment and shows new comment after submit", async () => {
    const user = userEvent.setup();
    mockGetServiceComments.mockResolvedValue({ data: { comments: [] } });
    mockCreateComment.mockResolvedValue({
      data: {
        _id: "c2",
        content: "Hello world",
        user_id: "u2",
        service_id: "svc-1",
        created_at: "2026-01-02T00:00:00Z",
        user: { _id: "u2", username: "bob", full_name: "Bob Jones" },
      },
    });
    renderSection();

    const textarea = screen.getByPlaceholderText(
      "Add a comment, idea, or share your experience...",
    );
    await user.type(textarea, "Hello world");

    await user.click(screen.getByRole("button", { name: /Post Comment/i }));

    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalledWith({
        content: "Hello world",
        service_id: "svc-1",
      });
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });
  });

  it("shows comment count in heading", async () => {
    mockGetServiceComments.mockResolvedValue({
      data: { comments: [mockComment] },
    });
    renderSection();
    await waitFor(() => {
      expect(screen.getByText(/Comments & Ideas \(1\)/)).toBeInTheDocument();
    });
  });
});
