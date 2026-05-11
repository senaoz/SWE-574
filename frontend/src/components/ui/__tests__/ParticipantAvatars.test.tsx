import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { User } from "@/types";
import { ParticipantAvatars } from "../ParticipantAvatars";

const mockNavigate = vi.fn();

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
}));

const participants: User[] = [
  {
    _id: "user-1",
    username: "alice",
    email: "alice@example.test",
    full_name: "Alice User",
    profile_picture: "alice.jpg",
    is_active: true,
    is_verified: true,
    role: "user",
    timebank_balance: 3,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
  {
    _id: "user-2",
    username: "bob",
    email: "bob@example.test",
    is_active: true,
    is_verified: false,
    role: "user",
    timebank_balance: 0,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
  {
    _id: "user-3",
    username: "carol",
    email: "carol@example.test",
    full_name: "Carol User",
    is_active: true,
    is_verified: false,
    role: "user",
    timebank_balance: 1,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
  },
];

function renderAvatars(maxVisible = 2) {
  return render(
    <Theme>
      <MemoryRouter>
        <ParticipantAvatars participants={participants} maxVisible={maxVisible} />
      </MemoryRouter>
    </Theme>,
  );
}

describe("ParticipantAvatars", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders visible participants and the remaining count", () => {
    const { container } = renderAvatars();

    expect(screen.getByRole("button", { name: "View Alice User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View bob" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View Carol User" })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".rt-AvatarRoot")).toHaveLength(3);
  });

  it("navigates to a participant profile when an avatar is clicked", async () => {
    const user = userEvent.setup();
    renderAvatars(3);

    await user.click(screen.getByRole("button", { name: "View Alice User" }));

    expect(mockNavigate).toHaveBeenCalledWith("/user/user-1");
  });
});
