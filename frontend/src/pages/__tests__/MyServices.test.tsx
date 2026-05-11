import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { MyServices } from "../MyServices";

const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockGetSavedServices = vi.fn();
const mockUnsaveService = vi.fn();
const mockGetServices = vi.fn();
const mockGetService = vi.fn();
const mockUpdateService = vi.fn();
const mockDeleteService = vi.fn();
const mockCancelService = vi.fn();
const mockGetMyRequests = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockGetServiceTransactions = vi.fn();
const mockConfirmTransactionCompletion = vi.fn();
const mockCreateTransactionChatRoom = vi.fn();
const mockCreateChatRoom = vi.fn();
const mockCreateServiceGroupChatRoom = vi.fn();
const mockGetTimeBank = vi.fn();
const mockCreateRating = vi.fn();

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
  useUser: () => ({ currentUserId: "user-1" }),
}));

vi.mock("@/services/api", () => ({
  servicesApi: {
    getSavedServices: (...args: any[]) => mockGetSavedServices(...args),
    getServices: (...args: any[]) => mockGetServices(...args),
    getService: (...args: any[]) => mockGetService(...args),
    updateService: (...args: any[]) => mockUpdateService(...args),
    deleteService: (...args: any[]) => mockDeleteService(...args),
    cancelService: (...args: any[]) => mockCancelService(...args),
    unsaveService: (...args: any[]) => mockUnsaveService(...args),
  },
  joinRequestsApi: {
    getMyRequests: (...args: any[]) => mockGetMyRequests(...args),
  },
  transactionsApi: {
    updateTransaction: (...args: any[]) => mockUpdateTransaction(...args),
    getServiceTransactions: (...args: any[]) => mockGetServiceTransactions(...args),
    confirmTransactionCompletion: (...args: any[]) =>
      mockConfirmTransactionCompletion(...args),
  },
  chatApi: {
    createTransactionChatRoom: (...args: any[]) =>
      mockCreateTransactionChatRoom(...args),
    createChatRoom: (...args: any[]) => mockCreateChatRoom(...args),
    createServiceGroupChatRoom: (...args: any[]) =>
      mockCreateServiceGroupChatRoom(...args),
  },
  usersApi: {
    getTimeBank: (...args: any[]) => mockGetTimeBank(...args),
  },
  ratingsApi: {
    createRating: (...args: any[]) => mockCreateRating(...args),
  },
}));

vi.mock("../MyServicesTab", () => ({
  MyServicesTab: ({
    services,
    serviceTransactions,
    onSetServiceInProgress,
    onDeleteService,
    onCancelService,
    onStartChat,
    onCreateGroupChat,
    onCancelTransaction,
    onConfirmTransactionCompletion,
  }: any) => (
    <div>
      <span>Mock services tab {services.length}</span>
      <span>Mock txns {Object.keys(serviceTransactions).length}</span>
      <button type="button" onClick={() => onSetServiceInProgress("service-1")}>
        Set progress
      </button>
      <button type="button" onClick={() => onDeleteService("service-1")}>
        Delete service
      </button>
      <button type="button" onClick={() => onCancelService("service-1")}>
        Cancel service
      </button>
      <button type="button" onClick={() => onStartChat("txn-1")}>
        Start chat
      </button>
      <button type="button" onClick={() => onCreateGroupChat("service-1")}>
        Group chat
      </button>
      <button type="button" onClick={() => onCancelTransaction("txn-1")}>
        Cancel txn
      </button>
      <button
        type="button"
        onClick={() =>
          onConfirmTransactionCompletion("txn-1", {
            ratedUserId: "user-2",
            score: 5,
            comment: "Great exchange",
            tags: ["helpful"],
            image_urls: ["photo.jpg"],
          })
        }
      >
        Confirm txn
      </button>
    </div>
  ),
}));

vi.mock("../MyApplicationsTab", () => ({
  MyApplicationsTab: ({
    requests,
    services,
    onServiceClick,
    onConfirmTransactionCompletion,
  }: any) => (
    <div>
      <span>Mock applications {requests.length}</span>
      <span>Mock application services {services.length}</span>
      <button type="button" onClick={() => onServiceClick("service-2")}>
        Open application service
      </button>
      <button
        type="button"
        onClick={() =>
          onConfirmTransactionCompletion("txn-1", {
            ratedUserId: "user-2",
            score: 4,
            tags: [],
          })
        }
      >
        Confirm from applications
      </button>
    </div>
  ),
}));

vi.mock("../MyTimebankTab", () => ({
  MyTimebankTab: ({ timebankData }: any) => (
    <div>Mock timebank {timebankData?.transactions?.length ?? 0}</div>
  ),
}));

vi.mock("../SavedServicesTab", () => ({
  SavedServicesTab: ({ services, onUnsave }: any) => (
    <div>
      <span>Mock saved {services.length}</span>
      <button type="button" onClick={() => onUnsave("saved-1")}>
        Unsave service
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  ConfirmDialog: ({ open, title, onConfirm }: any) =>
    open ? (
      <div>
        <span>{title}</span>
        <button type="button" onClick={onConfirm}>
          Confirm action
        </button>
      </div>
    ) : null,
}));

const providerService = {
  _id: "service-1",
  title: "Guitar lessons",
  status: "in_progress",
  user_id: "user-1",
};

const applicationService = {
  _id: "service-2",
  title: "Bike repair",
  status: "completed",
  user_id: "user-2",
};

const transaction = {
  _id: "txn-1",
  service_id: "service-1",
  provider_id: "user-1",
  requester_id: "user-2",
  timebank_hours: 2,
  status: "in_progress",
  description: "Guitar lesson exchange",
};

function renderMyServices(props: Parameters<typeof MyServices>[0] = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  vi.spyOn(queryClient, "invalidateQueries").mockImplementation((...args: any[]) => {
    mockInvalidateQueries(...args);
    return Promise.resolve();
  });

  return render(
    <Theme>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MyServices {...props} />
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>,
  );
}

describe("MyServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("alert", vi.fn());
    mockGetSavedServices.mockResolvedValue({
      data: { services: [{ _id: "saved-1", title: "Saved service" }] },
    });
    mockGetServices.mockResolvedValue({
      data: { services: [providerService] },
    });
    mockGetMyRequests.mockResolvedValue({
      data: {
        requests: [
          {
            _id: "request-1",
            service_id: "service-2",
            status: "approved",
          },
        ],
      },
    });
    mockGetService.mockImplementation((serviceId: string) =>
      Promise.resolve({
        data: serviceId === "service-2" ? applicationService : providerService,
      }),
    );
    mockGetServiceTransactions.mockResolvedValue({
      data: { transactions: [transaction] },
    });
    mockGetTimeBank.mockResolvedValue({
      data: {
        balance: 3,
        requires_need_creation: false,
        transactions: [{ id: "timebank-1" }],
      },
    });
    mockUpdateService.mockResolvedValue({ data: {} });
    mockDeleteService.mockResolvedValue({});
    mockCancelService.mockResolvedValue({});
    mockUpdateTransaction.mockResolvedValue({ data: {} });
    mockConfirmTransactionCompletion.mockResolvedValue({ data: {} });
    mockCreateRating.mockResolvedValue({ data: {} });
    mockCreateTransactionChatRoom.mockResolvedValue({
      data: { _id: "room-1" },
    });
    mockCreateChatRoom.mockResolvedValue({ data: { _id: "room-2" } });
    mockCreateServiceGroupChatRoom.mockResolvedValue({
      data: { _id: "group-room" },
    });
    mockUnsaveService.mockResolvedValue({});
  });

  it("loads dashboard data, reports counts, and handles service actions", async () => {
    const user = userEvent.setup();
    const onDataLoad = vi.fn();
    renderMyServices({ activeTab: "services", onDataLoad });

    expect(await screen.findByText("Mock services tab 1")).toBeInTheDocument();
    expect(screen.getByText("Mock txns 2")).toBeInTheDocument();
    await waitFor(() =>
      expect(onDataLoad).toHaveBeenCalledWith({
        requests: 1,
        transactions: 0,
        saved: 1,
        services: 1,
        timebank: 1,
        applications: 1,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Set progress" }));
    expect(screen.getByText("Set service to In Progress?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm action" }));
    await waitFor(() =>
      expect(mockUpdateService).toHaveBeenCalledWith("service-1", {
        status: "in_progress",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Cancel service" }));
    await user.click(screen.getByRole("button", { name: "Confirm action" }));
    await waitFor(() => expect(mockCancelService).toHaveBeenCalledWith("service-1"));

    await user.click(screen.getByRole("button", { name: "Cancel txn" }));
    await waitFor(() =>
      expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", {
        status: "cancelled",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Confirm txn" }));
    await waitFor(() =>
      expect(mockConfirmTransactionCompletion).toHaveBeenCalledWith("txn-1"),
    );
    expect(mockCreateRating).toHaveBeenCalledWith({
      transaction_id: "txn-1",
      rated_user_id: "user-2",
      score: 5,
      comment: "Great exchange",
      tags: ["helpful"],
      image_urls: ["photo.jpg"],
    });
  });

  it("navigates for application services and chat creation flows", async () => {
    const user = userEvent.setup();
    renderMyServices({ activeTab: "services" });
    await screen.findByText("Mock services tab 1");

    await user.click(screen.getByRole("button", { name: "Start chat" }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/profile?tab=chat&room_id=room-1"),
    );

    await user.click(screen.getByRole("button", { name: "Group chat" }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/profile?tab=chat&room_id=group-room",
      ),
    );
  });

  it("uses a fallback direct chat when transaction chat creation fails", async () => {
    const user = userEvent.setup();
    mockCreateTransactionChatRoom.mockRejectedValue(new Error("missing endpoint"));
    renderMyServices({ activeTab: "services" });
    await screen.findByText("Mock services tab 1");

    await user.click(screen.getByRole("button", { name: "Start chat" }));

    await waitFor(() =>
      expect(mockCreateChatRoom).toHaveBeenCalledWith({
        participant_ids: ["user-1", "user-2"],
        transaction_id: "txn-1",
        name: "Transaction Chat - Guitar lesson exchange",
        description: "Chat for transaction involving 2 hours",
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/profile?tab=chat&room_id=room-2");
  });

  it("renders managed tabs and unsaves saved services", async () => {
    const user = userEvent.setup();
    renderMyServices({ activeTab: "saved" });

    expect(await screen.findByText("Mock saved 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unsave service" }));

    await waitFor(() => expect(mockUnsaveService).toHaveBeenCalledWith("saved-1"));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["saved-services"],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["saved-service-ids"],
    });
  });

  it("opens an application service from the applications tab", async () => {
    const user = userEvent.setup();
    renderMyServices({ activeTab: "applications" });

    expect(await screen.findByText("Mock applications 1")).toBeInTheDocument();
    expect(screen.getByText("Mock application services 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open application service" }));

    expect(mockNavigate).toHaveBeenCalledWith("/service/service-2");
  });
});
