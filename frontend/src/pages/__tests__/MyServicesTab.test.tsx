import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { Service, Transaction } from "@/types";
import { MyServicesTab } from "../MyServicesTab";

const mockNavigate = vi.fn();
const mockGetTransactionRatings = vi.fn();

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
  ratingsApi: {
    getTransactionRatings: (...args: any[]) => mockGetTransactionRatings(...args),
  },
}));

vi.mock("@/components/ui/ApplicantsList", () => ({
  ApplicantsList: ({ serviceId, disableApprove }: any) => (
    <div>
      Applicants for {serviceId}
      {disableApprove ? " disabled" : ""}
    </div>
  ),
}));

vi.mock("@/components/ui/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span>Status: {status}</span>,
}));

vi.mock("@/components/ui/RatingStars", () => ({
  RatingStars: ({ value }: any) => <span>Stars: {value}</span>,
}));

vi.mock("@/components/ui/ConfirmCompletionModal", () => ({
  tagToLabel: (tag: string) => tag,
  ConfirmCompletionModal: ({ open, onSubmit }: any) =>
    open ? (
      <button
        onClick={() =>
          onSubmit({ score: 5, comment: "Great work", tags: ["helpful"], image_urls: [] })
        }
      >
        Submit completion rating
      </button>
    ) : null,
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: any) => <span>{name}</span>,
}));

vi.mock("@/components/forms/EditServiceDialog", () => ({
  EditServiceDialog: ({ open, service, onSuccess }: any) =>
    open ? <button onClick={onSuccess}>Editing {service.title}</button> : null,
}));

vi.mock("@/components/ui/ImageGallery", () => ({
  ImageGallery: ({ urls }: any) => <div>Review images: {urls.length}</div>,
}));

const baseService: Service = {
  _id: "service-active",
  user_id: "user-1",
  title: "Piano lessons",
  description: "Teach piano",
  category: "education",
  tags: [{ label: "Music", entityId: "Q638", description: "music" }],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  max_participants: 2,
  matched_user_ids: ["requester-1"],
};

const inProgressService: Service = {
  ...baseService,
  _id: "service-progress",
  title: "Garden cleanup",
  status: "in_progress",
  matched_user_ids: [],
};

const completedService: Service = {
  ...baseService,
  _id: "service-completed",
  title: "Cooking lesson",
  status: "completed",
  matched_user_ids: [],
};

const transaction: Transaction = {
  _id: "tx-1",
  service_id: "service-progress",
  provider_id: "user-1",
  requester_id: "requester-1",
  timebank_hours: 2,
  status: "pending",
  description: "Garden work",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  requester: { id: "requester-1", username: "bob", full_name: "Bob User" },
};

function renderTab(overrides = {}) {
  const props = {
    services: [baseService, inProgressService, completedService],
    serviceTransactions: { "service-progress": [transaction] },
    currentUserId: "user-1",
    requiresNeedCreation: true,
    onSetServiceInProgress: vi.fn().mockResolvedValue(undefined),
    onDeleteService: vi.fn().mockResolvedValue(undefined),
    onCancelService: vi.fn().mockResolvedValue(undefined),
    onStartChat: vi.fn().mockResolvedValue(undefined),
    onCreateGroupChat: vi.fn().mockResolvedValue(undefined),
    onCancelTransaction: vi.fn().mockResolvedValue(undefined),
    onConfirmTransactionCompletion: vi.fn().mockResolvedValue(undefined),
    onRequestUpdate: vi.fn(),
    formatDate: (date: string) => date.slice(0, 10),
    ...overrides,
  };

  return {
    props,
    ...render(
      <Theme>
        <MemoryRouter>
          <MyServicesTab {...props} />
        </MemoryRouter>
      </Theme>,
    ),
  };
}

describe("MyServicesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactionRatings.mockResolvedValue({
      data: [
        {
          _id: "rating-1",
          transaction_id: "tx-1",
          rater_id: "user-1",
          rated_user_id: "requester-1",
          score: 5,
          comment: "Already rated",
          tags: ["helpful"],
          image_urls: ["rating.jpg"],
          created_at: "2026-05-02T00:00:00Z",
        },
      ],
    });
  });

  it("groups services by status and exposes owner actions", async () => {
    const user = userEvent.setup();
    const { props } = renderTab();

    expect(screen.getByText("Active Services")).toBeInTheDocument();
    expect(screen.getByText("In Progress Services")).toBeInTheDocument();
    expect(screen.getByText("Completed Services")).toBeInTheDocument();
    expect(screen.getByText("Offer: Piano lessons")).toBeInTheDocument();
    expect(screen.getByText("Applicants for service-active disabled")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Start Service/ }));
    expect(props.onSetServiceInProgress).toHaveBeenCalledWith("service-active");

    await user.click(screen.getByRole("button", { name: /Group Chat|Chat/ }));
    expect(props.onCreateGroupChat).toHaveBeenCalledWith("service-active");
  });

  it("searches services and shows empty search state", async () => {
    const user = userEvent.setup();
    renderTab();

    await user.type(
      screen.getByPlaceholderText("Search services by title, description or tag..."),
      "zzzz",
    );

    expect(screen.getByText("No services match your search.")).toBeInTheDocument();
    expect(screen.queryByText("Offer: Piano lessons")).not.toBeInTheDocument();
  });

  it("confirms a transaction with rating data", async () => {
    const user = userEvent.setup();
    const { props } = renderTab();

    await screen.findByText("Transaction confirmations");
    await user.click(screen.getByRole("button", { name: /Confirm Completion/ }));
    await user.click(screen.getByRole("button", { name: "Submit completion rating" }));

    await waitFor(() => {
      expect(props.onConfirmTransactionCompletion).toHaveBeenCalledWith("tx-1", {
        ratedUserId: "requester-1",
        score: 5,
        comment: "Great work",
        tags: ["helpful"],
        image_urls: [],
      });
    });
  });

  it("renders empty state when no services exist", () => {
    renderTab({ services: [] });

    expect(screen.getByText("You haven't created any services yet.")).toBeInTheDocument();
  });
});
