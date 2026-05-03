import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpvoteButton } from "../UpvoteButton";

describe("UpvoteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the vote count", () => {
    render(<UpvoteButton count={7} />);
    expect(screen.getByRole("button")).toHaveTextContent("7");
  });

  it("calls onUpvote when clicked", async () => {
    const user = userEvent.setup();
    const onUpvote = vi.fn().mockResolvedValue({ upvote_count: 8, user_upvoted: true });
    render(<UpvoteButton count={7} onUpvote={onUpvote} />);
    await user.click(screen.getByRole("button"));
    expect(onUpvote).toHaveBeenCalledTimes(1);
  });

  it("shows optimistic count increase before server responds", async () => {
    const user = userEvent.setup();
    let resolve!: (v: any) => void;
    const onUpvote = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<UpvoteButton count={5} upvoted={false} onUpvote={onUpvote} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("6");
    resolve({ upvote_count: 6, user_upvoted: true });
  });

  it("rolls back count on API error", async () => {
    const user = userEvent.setup();
    const onUpvote = vi.fn().mockRejectedValue(new Error("Network error"));
    render(<UpvoteButton count={5} upvoted={false} onUpvote={onUpvote} />);
    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("5");
    });
  });

  it("shows login hint when showLoginHint is true", () => {
    render(<UpvoteButton count={0} showLoginHint />);
    expect(screen.getByText("Sign in to upvote")).toBeInTheDocument();
  });

  it("does not call onUpvote when disabled", async () => {
    const user = userEvent.setup();
    const onUpvote = vi.fn();
    render(<UpvoteButton count={3} onUpvote={onUpvote} disabled />);
    await user.click(screen.getByRole("button"));
    expect(onUpvote).not.toHaveBeenCalled();
  });
});
