import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import { Chat } from "../Chat";

const mockUseUser = vi.fn();
const mockGetChatRoom = vi.fn();

vi.mock("@/App", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/services/api", () => ({
  chatApi: {
    getChatRoom: (...args: any[]) => mockGetChatRoom(...args),
  },
}));

vi.mock("@/components/ui/ChatRoomsList", () => ({
  ChatRoomsList: ({ onSelectRoom, selectedRoomId }: any) => (
    <div>
      <span>Selected room: {selectedRoomId ?? "none"}</span>
      <button
        onClick={() =>
          onSelectRoom({
            _id: "room-picked",
            name: "Picked room",
            is_active: true,
            participant_ids: ["user-1"],
            created_at: "2026-05-01T00:00:00Z",
            updated_at: "2026-05-01T00:00:00Z",
          })
        }
      >
        Pick room
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/ChatRoom", () => ({
  ChatRoomComponent: ({ room, currentUserId }: any) => (
    <div>
      Room {room.name} for {currentUserId}
    </div>
  ),
}));

function renderChat(initialEntry = "/profile?tab=chat") {
  return render(
    <Theme>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Chat />
      </MemoryRouter>
    </Theme>,
  );
}

describe("Chat page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({ currentUserId: "user-1" });
  });

  it("shows a loading state until the current user is known", () => {
    mockUseUser.mockReturnValue({ currentUserId: undefined });

    renderChat();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders the empty chat room prompt before a room is selected", () => {
    renderChat();

    expect(screen.getByText("Selected room: none")).toBeInTheDocument();
    expect(screen.getByText("Select a Chat Room")).toBeInTheDocument();
  });

  it("selects a room from the room list", async () => {
    const user = userEvent.setup();

    renderChat();
    await user.click(screen.getByRole("button", { name: "Pick room" }));

    expect(screen.getByText("Room Picked room for user-1")).toBeInTheDocument();
  });

  it("loads the room referenced by the URL parameter", async () => {
    mockGetChatRoom.mockResolvedValue({
      data: {
        _id: "room-url",
        name: "Fetched room",
        is_active: true,
        participant_ids: ["user-1"],
        created_at: "2026-05-01T00:00:00Z",
        updated_at: "2026-05-01T00:00:00Z",
      },
    });

    renderChat("/profile?tab=chat&room_id=room-url");

    await waitFor(() => {
      expect(screen.getByText("Room Fetched room for user-1")).toBeInTheDocument();
    });
    expect(mockGetChatRoom).toHaveBeenCalledWith("room-url");
  });
});
