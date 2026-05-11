import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import type { Notification } from "@/types";
import { NotificationBell } from "../NotificationBell";

const mockNavigate = vi.fn();
const mockGetNotifications = vi.fn();
const mockMarkAsRead = vi.fn();
const mockMarkAllAsRead = vi.fn();
const mockDeleteNotification = vi.fn();
const mockCancelReader = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    user: { _id: "user-1", username: "current" },
  }),
}));

vi.mock("@/services/api", () => ({
  getApiBaseUrl: () => "http://api.example.test",
  notificationsApi: {
    getNotifications: (...args: any[]) => mockGetNotifications(...args),
    markAsRead: (...args: any[]) => mockMarkAsRead(...args),
    markAllAsRead: (...args: any[]) => mockMarkAllAsRead(...args),
    deleteNotification: (...args: any[]) => mockDeleteNotification(...args),
  },
}));

const notifications: Notification[] = [
  {
    _id: "notification-1",
    user_id: "user-1",
    type: "join_request_received",
    title: "New service request",
    body: "Alice applied to your offer",
    related_id: "service-1",
    related_type: "service",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    _id: "notification-2",
    user_id: "user-1",
    type: "new_message",
    title: "New chat message",
    body: "Bob sent a message",
    related_id: "room-1",
    related_type: "chat_room",
    is_read: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

function renderBell() {
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
          <NotificationBell />
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("access_token", "token");
    const encoder = new TextEncoder();
    let readCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        body: {
          getReader: () => ({
            read: vi.fn().mockImplementation(() => {
              readCount += 1;
              if (readCount === 1) {
                return Promise.resolve({
                  value: encoder.encode("data: 12\n\n"),
                  done: false,
                });
              }
              return new Promise(() => {});
            }),
            cancel: mockCancelReader,
          }),
        },
      }),
    );
    mockGetNotifications.mockResolvedValue({
      data: {
        notifications,
        total: 2,
        page: 1,
        limit: 20,
        unread_count: 1,
      },
    });
    mockMarkAsRead.mockResolvedValue({});
    mockMarkAllAsRead.mockResolvedValue({});
    mockDeleteNotification.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("streams unread count, opens the list, and handles notification actions", async () => {
    const user = userEvent.setup();
    const { unmount } = renderBell();

    expect(await screen.findByText("9+")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));

    expect(await screen.findByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("New service request")).toBeInTheDocument();
    expect(screen.getByText("Alice applied to your offer")).toBeInTheDocument();
    expect(screen.getByText("New chat message")).toBeInTheDocument();
    expect(screen.getByText("2m ago")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();

    await user.click(screen.getByText("Mark all read"));
    await waitFor(() => expect(mockMarkAllAsRead).toHaveBeenCalled());

    const deleteIcons = document.querySelectorAll(".lucide-x");
    fireEvent.click(deleteIcons[deleteIcons.length - 1]);
    await waitFor(() =>
      expect(mockDeleteNotification).toHaveBeenCalledWith("notification-2"),
    );

    await user.click(screen.getByText("New service request"));
    await waitFor(() => expect(mockMarkAsRead).toHaveBeenCalledWith("notification-1"));
    expect(mockNavigate).toHaveBeenCalledWith("/service/service-1");

    unmount();
    expect(mockCancelReader).toHaveBeenCalled();
  });

  it("shows the empty state when no notifications are returned", async () => {
    const user = userEvent.setup();
    mockGetNotifications.mockResolvedValue({
      data: { notifications: [], total: 0, page: 1, limit: 20, unread_count: 0 },
    });
    renderBell();

    await user.click(screen.getByRole("button"));

    expect(await screen.findByText("No notifications yet")).toBeInTheDocument();
  });
});
