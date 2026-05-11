import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import type { ChatRoom, Message } from "@/types";
import { ChatRoomComponent } from "../ChatRoom";

const mockNavigate = vi.fn();
const mockGetRoomMessages = vi.fn();
const mockSendMessage = vi.fn();
const mockUpdateChatRoom = vi.fn();

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
  chatApi: {
    getRoomMessages: (...args: any[]) => mockGetRoomMessages(...args),
    sendMessage: (...args: any[]) => mockSendMessage(...args),
    updateChatRoom: (...args: any[]) => mockUpdateChatRoom(...args),
  },
}));

const room: ChatRoom = {
  _id: "room-1",
  name: "Neighborhood Crew",
  description: "Planning exchanges",
  is_active: true,
  participant_ids: ["user-1", "user-2", "user-3"],
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  participants: [
    { id: "user-1", username: "me", full_name: "Current User" },
    {
      id: "user-2",
      username: "alice",
      full_name: "Alice User",
      profile_picture: "alice.jpg",
    },
    { id: "user-3", username: "bob", full_name: "Bob User" },
  ],
  services: [
    { id: "service-1", title: "Guitar lessons" },
    { id: "service-2", title: "Bike repair" },
  ],
  transaction: {
    id: "txn-1",
    status: "in_progress",
    hours: 2,
  },
};

const messages: Message[] = [
  {
    _id: "message-2",
    room_id: "room-1",
    sender_id: "user-1",
    content: "Sounds good",
    message_type: "text",
    is_edited: false,
    is_deleted: false,
    created_at: "2026-05-02T11:05:00",
    updated_at: "2026-05-02T11:05:00",
  },
  {
    _id: "message-1",
    room_id: "room-1",
    sender_id: "user-2",
    content: "Can we meet tomorrow?",
    message_type: "text",
    is_edited: true,
    is_deleted: false,
    created_at: "2026-05-02T11:00:00",
    updated_at: "2026-05-02T11:01:00",
    sender: {
      id: "user-2",
      username: "alice",
      full_name: "Alice User",
      profile_picture: "alice.jpg",
    },
  },
];

function renderRoom(roomOverride: ChatRoom = room) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Theme>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ChatRoomComponent room={roomOverride} currentUserId="user-1" />
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("ChatRoomComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
    mockGetRoomMessages.mockResolvedValue({
      data: { messages },
    });
    mockSendMessage.mockResolvedValue({ data: {} });
    mockUpdateChatRoom.mockResolvedValue({ data: { ...room, name: "New crew name" } });
  });

  it("renders room metadata and sends a new message", async () => {
    const user = userEvent.setup();
    renderRoom();

    expect(await screen.findByText("Neighborhood Crew")).toBeInTheDocument();
    expect(screen.getByText("Planning exchanges")).toBeInTheDocument();
    expect(screen.getByText("3 participants")).toBeInTheDocument();
    expect(screen.getByText("Guitar lessons")).toBeInTheDocument();
    expect(screen.getByText("Bike repair")).toBeInTheDocument();
    expect(screen.getByText("2h transaction")).toBeInTheDocument();
    expect(screen.getByText("in_progress")).toBeInTheDocument();
    expect(screen.getByText("Can we meet tomorrow?")).toBeInTheDocument();
    expect(screen.getByText("Sounds good")).toBeInTheDocument();
    expect(screen.getByText("(edited)")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Type a message..."), "See you there");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(mockSendMessage).toHaveBeenCalledWith({
        room_id: "room-1",
        content: "See you there",
        message_type: "text",
      }),
    );
  });

  it("updates the room name and navigates from participant/message authors", async () => {
    const user = userEvent.setup();
    const { container } = renderRoom();
    await screen.findByText("Neighborhood Crew");

    await user.click(container.querySelectorAll("button")[0]);
    const nameInput = container.querySelector("input.text-sm") as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "New crew name{Enter}");

    await waitFor(() =>
      expect(mockUpdateChatRoom).toHaveBeenCalledWith("room-1", {
        name: "New crew name",
      }),
    );

    await user.click(screen.getByText("Alice User"));
    expect(mockNavigate).toHaveBeenCalledWith("/user/user-2");
  });

  it("shows loading and error states", async () => {
    mockGetRoomMessages.mockReturnValue(new Promise(() => {}));
    const { unmount } = renderRoom();
    expect(screen.getByText("Loading messages...")).toBeInTheDocument();
    unmount();

    mockGetRoomMessages.mockRejectedValue(new Error("down"));
    renderRoom();
    expect(await screen.findByText("Error loading messages")).toBeInTheDocument();
  });
});
