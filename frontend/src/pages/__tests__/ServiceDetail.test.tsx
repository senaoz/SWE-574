import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import type { ForumEvent, Service, User } from "@/types";
import { ServiceDetail } from "../ServiceDetail";

const mockNavigate = vi.fn();
const mockGetService = vi.fn();
const mockGetUserById = vi.fn();
const mockGetTimeBank = vi.fn();
const mockGetPendingRequestForService = vi.fn();
const mockCancelRequest = vi.fn();
const mockGetLinkedEvents = vi.fn();
const mockGetPotentialMatches = vi.fn();
const mockGetServices = vi.fn();
const mockSaveService = vi.fn();
const mockUnsaveService = vi.fn();
const mockPinService = vi.fn();
const mockDeleteService = vi.fn();
const mockCreateChatRoom = vi.fn();
const mockUseSavedServiceIds = vi.fn();

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
    currentUserId: "admin-1",
    user: { _id: "admin-1", role: "admin" },
  }),
}));

vi.mock("@/hooks/useSavedServiceIds", () => ({
  useSavedServiceIds: () => mockUseSavedServiceIds(),
}));

vi.mock("@/services/api", () => ({
  getImageUrl: (path?: string) => (path ? `https://cdn.example.test/${path}` : undefined),
  servicesApi: {
    getService: (...args: any[]) => mockGetService(...args),
    getPotentialMatches: (...args: any[]) => mockGetPotentialMatches(...args),
    getServices: (...args: any[]) => mockGetServices(...args),
    saveService: (...args: any[]) => mockSaveService(...args),
    unsaveService: (...args: any[]) => mockUnsaveService(...args),
    pinService: (...args: any[]) => mockPinService(...args),
    deleteService: (...args: any[]) => mockDeleteService(...args),
  },
  usersApi: {
    getUserById: (...args: any[]) => mockGetUserById(...args),
    getTimeBank: (...args: any[]) => mockGetTimeBank(...args),
  },
  joinRequestsApi: {
    getPendingRequestForService: (...args: any[]) =>
      mockGetPendingRequestForService(...args),
    cancelRequest: (...args: any[]) => mockCancelRequest(...args),
  },
  forumApi: {
    getLinkedEvents: (...args: any[]) => mockGetLinkedEvents(...args),
  },
  commentsApi: {
    getServiceComments: vi.fn().mockResolvedValue({ data: { comments: [] } }),
    createComment: vi.fn().mockResolvedValue({ data: {} }),
  },
  chatApi: {
    createChatRoom: (...args: any[]) => mockCreateChatRoom(...args),
  },
}));

vi.mock("@/components/ui/ImageGallery", () => ({
  ImageGallery: ({ urls }: any) => <div>Image gallery: {urls.length}</div>,
}));

vi.mock("@/components/ui/ProviderProfileSummary", () => ({
  ProviderProfileSummary: ({ user }: any) => <div>Provider: {user.full_name}</div>,
}));

vi.mock("@/components/map/ServiceMap", () => ({
  ServiceMap: ({ services }: any) => <div>Service map: {services.length}</div>,
}));

vi.mock("@/components/ui/HandShakeModal", () => ({
  HandShakeModal: ({ service, disabled }: any) => (
    <button disabled={disabled}>Join {service.title}</button>
  ),
}));

vi.mock("@/components/ui/CommentSection", () => ({
  CommentSection: ({ title }: any) => <div>{title}</div>,
}));

vi.mock("@/components/ui/ParticipantAvatars", () => ({
  ParticipantAvatars: ({ participants }: any) => (
    <div>Participants: {participants.map((p: any) => p.full_name).join(", ")}</div>
  ),
}));

vi.mock("@/components/ui/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span>Status: {status}</span>,
}));

vi.mock("@/components/ui/ServiceStatusBar", () => ({
  ServiceStatusBar: ({ status }: any) => <div>Status bar: {status}</div>,
}));

vi.mock("@/components/ui/ClickableTag", () => ({
  ClickableTag: ({ tag }: any) => (
    <span>{typeof tag === "string" ? tag : tag.label}</span>
  ),
}));

vi.mock("@/components/ui/ReportDialog", () => ({
  ReportDialog: ({ open, reportedName }: any) =>
    open ? <div>Report service: {reportedName}</div> : null,
}));

vi.mock("@/components/forms/EditServiceDialog", () => ({
  EditServiceDialog: ({ open, service }: any) =>
    open ? <div>Edit service: {service.title}</div> : null,
}));

const provider: User = {
  _id: "owner-1",
  username: "owner",
  email: "owner@example.test",
  full_name: "Owner User",
  is_active: true,
  is_verified: true,
  role: "user",
  timebank_balance: 3,
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
};

const participant: User = {
  ...provider,
  _id: "participant-1",
  username: "matched",
  full_name: "Matched User",
};

const service: Service = {
  _id: "service-1",
  user_id: "owner-1",
  title: "Piano lessons",
  description: "Learn **piano** with a neighbor.",
  category: "education",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  deadline: "2026-05-20T00:00:00Z",
  matched_user_ids: ["participant-1"],
  max_participants: 3,
  scheduling_type: "specific",
  specific_date: "2026-05-15T00:00:00Z",
  specific_time: "14:30",
  image_urls: ["uploads/piano.jpg"],
  is_pinned: false,
  is_saved: false,
};

const matchService: Service = {
  ...service,
  _id: "service-2",
  title: "Need guitar practice",
  service_type: "need",
  user_id: "owner-2",
  matched_user_ids: [],
};

const linkedEvent: ForumEvent = {
  _id: "event-1",
  user_id: "owner-1",
  title: "Music meetup",
  description: "Jam together.",
  event_at: "2026-05-18T12:00:00Z",
  is_remote: false,
  tags: [],
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  comment_count: 0,
  attendee_ids: [],
  attendee_count: 0,
  upvote_count: 0,
  is_pinned: false,
};

function renderServiceDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Theme>
        <MemoryRouter initialEntries={["/service/service-1"]}>
          <Routes>
            <Route path="/service/:id" element={<ServiceDetail />} />
          </Routes>
        </MemoryRouter>
      </Theme>
    </QueryClientProvider>,
  );
}

describe("ServiceDetail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSavedServiceIds.mockReturnValue({ savedServiceIds: [] });
    mockGetService.mockResolvedValue({ data: service });
    mockGetUserById.mockImplementation((id: string) =>
      Promise.resolve({ data: id === "participant-1" ? participant : provider }),
    );
    mockGetTimeBank.mockResolvedValue({
      data: { requires_need_creation: false, transactions: [] },
    });
    mockGetPendingRequestForService.mockRejectedValue({ response: { status: 404 } });
    mockGetLinkedEvents.mockResolvedValue({ data: { events: [linkedEvent] } });
    mockGetPotentialMatches.mockResolvedValue({
      data: { items: [{ service: matchService, relevance_score: 0.9, reason_label: "Matching tags" }] },
    });
    mockGetServices.mockResolvedValue({ data: { services: [service, matchService] } });
    mockSaveService.mockResolvedValue({});
    mockUnsaveService.mockResolvedValue({});
    mockPinService.mockResolvedValue({ data: { ...service, is_pinned: true } });
    mockDeleteService.mockResolvedValue({});
    mockCreateChatRoom.mockResolvedValue({ data: { _id: "room-1" } });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("loads service details, provider, participants, events, and recommendations", async () => {
    renderServiceDetail();

    expect(screen.getByText("Loading service details...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Piano lessons" })).toBeInTheDocument();
    });

    expect(screen.getByText("Provider: Owner User")).toBeInTheDocument();
    expect(screen.getByText("Participants: Matched User")).toBeInTheDocument();
    expect(screen.getByText("Image gallery: 1")).toBeInTheDocument();
    expect(screen.getByText("Music meetup")).toBeInTheDocument();
    expect(screen.getByText("Need guitar practice")).toBeInTheDocument();
    expect(screen.getByText("Comments & Ideas")).toBeInTheDocument();
  });

  it("pins, saves, reports, and starts chat for a service", async () => {
    const user = userEvent.setup();

    renderServiceDetail();
    await screen.findByRole("heading", { name: "Piano lessons" });

    await user.click(screen.getByRole("button", { name: /Pin/ }));
    expect(mockPinService).toHaveBeenCalledWith("service-1", true);

    await user.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() => {
      expect(mockSaveService).toHaveBeenCalledWith("service-1");
    });

    await user.click(screen.getByRole("button", { name: /Message/ }));
    expect(mockCreateChatRoom).toHaveBeenCalledWith({
      participant_ids: ["admin-1", "owner-1"],
      service_id: "service-1",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/profile?tab=chat&room_id=room-1");

    await user.click(screen.getByRole("button", { name: /Report/ }));
    expect(screen.getByText("Report service: Piano lessons")).toBeInTheDocument();
  });

  it("shows not found when the service cannot be loaded", async () => {
    mockGetService.mockRejectedValue(new Error("missing"));

    renderServiceDetail();

    expect(await screen.findByText("Service Not Found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Dashboard" })).toBeInTheDocument();
  });
});
