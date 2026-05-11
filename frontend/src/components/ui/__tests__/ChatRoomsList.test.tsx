import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import type { ChatRoom } from "@/types";
import { ChatRoomsList } from "../ChatRoomsList";

const mockGetMyChatRooms = vi.fn();

vi.mock("@/App", () => ({
  useUser: () => ({ currentUserId: "user-1" }),
}));

vi.mock("@/services/api", () => ({
  chatApi: {
    getMyChatRooms: (...args: any[]) => mockGetMyChatRooms(...args),
  },
}));

vi.mock("../NewGroupChatDialog", () => ({
  NewGroupChatDialog: ({ open, onCreated }: any) =>
    open ? (
      <button
        onClick={() =>
          onCreated({
            _id: "room-new",
            name: "Created room",
            is_active: true,
            participant_ids: ["user-1"],
            created_at: "2026-05-01T00:00:00Z",
            updated_at: "2026-05-01T00:00:00Z",
          })
        }
      >
        Create mock chat
      </button>
    ) : null,
}));

const room: ChatRoom = {
  _id: "room-1",
  is_active: true,
  participant_ids: ["user-1", "user-2"],
  participants: [
    { id: "user-1", username: "me", full_name: "Current User" },
    { id: "user-2", username: "bob", full_name: "Bob Neighbor" },
  ],
  services: [
    { id: "service-1", title: "Piano lessons", description: "Music", category: "education" },
  ],
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  last_message_at: new Date().toISOString(),
};

function renderList(onSelectRoom = vi.fn(), selectedRoomId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    onSelectRoom,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Theme>
          <ChatRoomsList
            onSelectRoom={onSelectRoom}
            selectedRoomId={selectedRoomId}
          />
        </Theme>
      </QueryClientProvider>,
    ),
  };
}

describe("ChatRoomsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders chat rooms and selects a room", async () => {
    const user = userEvent.setup();
    const onSelectRoom = vi.fn();
    mockGetMyChatRooms.mockResolvedValue({ data: { rooms: [room], total: 1 } });

    renderList(onSelectRoom);

    await waitFor(() => {
      expect(screen.getByText("Chat Rooms")).toBeInTheDocument();
    });
    expect(screen.getByText("Chat with Bob Neighbor")).toBeInTheDocument();
    expect(screen.getByText("Piano lessons")).toBeInTheDocument();

    await user.click(screen.getByText("Chat with Bob Neighbor"));
    expect(onSelectRoom).toHaveBeenCalledWith(room);
  });

  it("opens the new chat dialog from the empty state", async () => {
    const user = userEvent.setup();
    const onSelectRoom = vi.fn();
    mockGetMyChatRooms.mockResolvedValue({ data: { rooms: [], total: 0 } });

    renderList(onSelectRoom);

    await screen.findByText("This space is feeling a little... empty");
    await user.click(screen.getByRole("button", { name: /New Chat/ }));
    await user.click(screen.getByRole("button", { name: "Create mock chat" }));

    expect(onSelectRoom).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "room-new", name: "Created room" }),
    );
  });

  it("shows an error state when rooms fail to load", async () => {
    mockGetMyChatRooms.mockRejectedValue(new Error("network"));

    renderList();

    expect(await screen.findByText("Error loading chat rooms")).toBeInTheDocument();
  });
});
