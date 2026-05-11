import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { ServiceDetail } from "../ServiceDetail";

// ─── API mocks ────────────────────────────────────────────────────────────────
const mockGetService = vi.fn();
const mockGetUserById = vi.fn();
const mockGetPendingRequest = vi.fn();
const mockGetLinkedEvents = vi.fn();
const mockGetPotentialMatches = vi.fn();
const mockGetServices = vi.fn();
const mockGetTimeBank = vi.fn();

vi.mock("@/services/api", () => ({
  servicesApi: {
    getService: (...a: any[]) => mockGetService(...a),
    getPotentialMatches: (...a: any[]) => mockGetPotentialMatches(...a),
    getServices: (...a: any[]) => mockGetServices(...a),
    saveService: vi.fn(),
    unsaveService: vi.fn(),
    deleteService: vi.fn(),
    pinService: vi.fn(),
  },
  usersApi: {
    getUserById: (...a: any[]) => mockGetUserById(...a),
    getTimeBank: () => mockGetTimeBank(),
  },
  joinRequestsApi: {
    getPendingRequestForService: (...a: any[]) => mockGetPendingRequest(...a),
    cancelRequest: vi.fn(),
  },
  forumApi: {
    getLinkedEvents: (...a: any[]) => mockGetLinkedEvents(...a),
  },
  commentsApi: {
    getServiceComments: vi.fn().mockResolvedValue({ data: { comments: [] } }),
    createComment: vi.fn(),
  },
  chatApi: {
    createChatRoom: vi.fn(),
  },
  getImageUrl: (p: string | null) => p ?? "",
}));

// ServiceDetail uses useUser from @/App
vi.mock("@/App", () => ({
  useUser: () => ({
    currentUserId: "u1",
    user: { _id: "u1", role: "user" },
  }),
  useTheme: () => ({ appearance: "light", toggleAppearance: vi.fn() }),
}));

vi.mock("@/hooks/useSavedServiceIds", () => ({
  useSavedServiceIds: () => ({ savedServiceIds: [] }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Heavy component mocks ────────────────────────────────────────────────────
vi.mock("@/components/map/ServiceMap", () => ({
  ServiceMap: () => <div data-testid="service-map" />,
  applyMapFilters: (list: any[]) => list,
  defaultMapFilters: {},
}));

vi.mock("@/components/ui/ImageGallery", () => ({
  ImageGallery: () => <div data-testid="image-gallery" />,
}));

vi.mock("@/components/ui/ProviderProfileSummary", () => ({
  ProviderProfileSummary: ({ user }: { user?: { full_name: string } }) => (
    <div data-testid="provider-summary">{user?.full_name}</div>
  ),
}));

vi.mock("@/components/ui/HandShakeModal", () => ({
  HandShakeModal: () => <div data-testid="handshake-modal" />,
}));

vi.mock("@/components/ui/CommentSection", () => ({
  CommentSection: () => <div data-testid="comment-section" />,
  CommentItem: () => <div />,
}));

vi.mock("@/components/ui/ParticipantAvatars", () => ({
  ParticipantAvatars: () => <div data-testid="participant-avatars" />,
}));

vi.mock("@/components/ui/StatusBadge", () => ({
  StatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

vi.mock("@/components/ui/ServiceStatusBar", () => ({
  ServiceStatusBar: () => <div data-testid="service-status-bar" />,
}));

vi.mock("@/components/ui/ReportDialog", () => ({
  ReportDialog: () => <div data-testid="report-dialog" />,
}));

vi.mock("@/components/forms/EditServiceDialog", () => ({
  EditServiceDialog: () => <div data-testid="edit-service-dialog" />,
}));

vi.mock("@radix-ui/themes", async () => {
  const actual = await vi.importActual<typeof import("@radix-ui/themes")>("@radix-ui/themes");
  return {
    ...actual,
    Tooltip: ({ children, content }: { children: React.ReactElement; content: string }) =>
      React.cloneElement(children, { "aria-label": content }),
  };
});

import React from "react";

function makeService(overrides = {}) {
  return {
    _id: "svc1",
    title: "Fix my bicycle",
    description: "I need help fixing the brakes on my bike.",
    service_type: "need",
    status: "open",
    is_remote: false,
    is_pinned: false,
    duration: 2,
    max_participants: 1,
    tags: [],
    location: { address: "Istanbul, Turkey", coordinates: [28.97, 41.01] },
    user_id: "u2",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    matched_user_ids: [],
    ...overrides,
  };
}

function makeProvider(overrides = {}) {
  return {
    _id: "u2",
    username: "bob",
    full_name: "Bob Jones",
    email: "bob@example.com",
    bio: "I fix things",
    role: "user",
    is_active: true,
    is_verified: false,
    timebank_balance: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function renderDetail(serviceId = "svc1") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Theme>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/services/${serviceId}`]}>
          <Routes>
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("ServiceDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLinkedEvents.mockResolvedValue({ data: { events: [] } });
    mockGetPotentialMatches.mockResolvedValue({ data: { items: [], total: 0 } });
    mockGetServices.mockResolvedValue({ data: { services: [] } });
    mockGetTimeBank.mockResolvedValue({ data: { balance: 2 } });
    mockGetPendingRequest.mockRejectedValue({ response: { status: 404 } });
  });

  it("shows loading state initially", () => {
    mockGetService.mockReturnValue(new Promise(() => {}));
    renderDetail();
    expect(screen.getByText(/loading service details/i)).toBeInTheDocument();
  });

  it("shows 'Service Not Found' when API returns error", async () => {
    mockGetService.mockRejectedValue(new Error("Not found"));
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText(/service not found/i)).toBeInTheDocument();
    });
  });

  it("shows 'Back to Dashboard' button when service not found", async () => {
    mockGetService.mockRejectedValue(new Error("Not found"));
    renderDetail();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /back to dashboard/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders service title when loaded", async () => {
    mockGetService.mockResolvedValue({ data: makeService() });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText("Fix my bicycle")).toBeInTheDocument();
    });
  });

  it("renders service description when loaded", async () => {
    mockGetService.mockResolvedValue({ data: makeService() });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => {
      expect(
        screen.getByText(/I need help fixing the brakes/i),
      ).toBeInTheDocument();
    });
  });

  it("renders provider summary section", async () => {
    mockGetService.mockResolvedValue({ data: makeService() });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("provider-summary")).toBeInTheDocument();
    });
  });

  it("renders back/arrow button to navigate back", async () => {
    mockGetService.mockResolvedValue({ data: makeService() });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => screen.getByText("Fix my bicycle"));
    const backBtn = screen.getByRole("button", { name: /back/i });
    expect(backBtn).toBeInTheDocument();
  });

  it("navigates back when back button is clicked", async () => {
    const user = userEvent.setup();
    mockGetService.mockResolvedValue({ data: makeService() });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => screen.getByText("Fix my bicycle"));
    const backBtn = screen.getByRole("button", { name: /back/i });
    await user.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("shows status badge", async () => {
    mockGetService.mockResolvedValue({ data: makeService({ status: "open" }) });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("status-badge")).toHaveTextContent("open");
    });
  });

  it("renders comment section", async () => {
    mockGetService.mockResolvedValue({ data: makeService() });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("comment-section")).toBeInTheDocument();
    });
  });

  it("shows own service without a Join button (user is provider)", async () => {
    // user_id matches currentUserId ("u1")
    mockGetService.mockResolvedValue({ data: makeService({ user_id: "u1" }) });
    mockGetUserById.mockResolvedValue({ data: makeProvider({ _id: "u1" }) });
    renderDetail();
    await waitFor(() => screen.getByText("Fix my bicycle"));
    expect(screen.queryByRole("button", { name: /join/i })).not.toBeInTheDocument();
  });

  it("shows service map for non-remote service", async () => {
    mockGetService.mockResolvedValue({ data: makeService({ is_remote: false }) });
    mockGetUserById.mockResolvedValue({ data: makeProvider() });
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId("service-map")).toBeInTheDocument();
    });
  });
});
