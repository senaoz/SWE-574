import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Theme } from "@radix-ui/themes";
import type { JoinRequest, Service, Transaction } from "@/types";
import { MyApplicationsTab } from "../MyApplicationsTab";

const mockGetUserById = vi.fn();
const mockGetTransactionRatings = vi.fn();
const mockCreateRating = vi.fn();

vi.mock("@/services/api", () => ({
  usersApi: {
    getUserById: (...args: any[]) => mockGetUserById(...args),
  },
  ratingsApi: {
    getTransactionRatings: (...args: any[]) => mockGetTransactionRatings(...args),
    createRating: (...args: any[]) => mockCreateRating(...args),
  },
}));

vi.mock("@/components/ui/RatingStars", () => ({
  RatingStars: ({ value }: any) => <span>Stars: {value}</span>,
  RatingForm: ({ onSubmit, loading }: any) => (
    <button disabled={loading} onClick={() => onSubmit(4, "Nice provider")}>
      Submit quick rating
    </button>
  ),
}));

vi.mock("@/components/ui/ConfirmCompletionModal", () => ({
  tagToLabel: (tag: string) => tag,
  ConfirmCompletionModal: ({ open, onSubmit }: any) =>
    open ? (
      <button
        onClick={() =>
          onSubmit({ score: 5, comment: "Great help", tags: ["helpful"], image_urls: [] })
        }
      >
        Submit completion rating
      </button>
    ) : null,
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: any) => <span>{name}</span>,
}));

vi.mock("@/components/ui/ImageGallery", () => ({
  ImageGallery: ({ urls }: any) => <div>Rating images: {urls.length}</div>,
}));

const service: Service = {
  _id: "service-1",
  user_id: "provider-1",
  title: "Piano lessons",
  description: "Teach piano",
  category: "education",
  tags: [],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "in_progress",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  max_participants: 1,
  matched_user_ids: ["user-1"],
  receiver_confirmed_ids: [],
};

const request: JoinRequest = {
  _id: "request-1",
  service_id: "service-1",
  user_id: "user-1",
  status: "approved",
  message: "I would like to join.",
  admin_message: "Welcome aboard.",
  created_at: "2026-05-02T00:00:00Z",
  updated_at: "2026-05-02T00:00:00Z",
  service: { id: "service-1", title: "Piano lessons" },
};

const transaction: Transaction = {
  _id: "tx-1",
  service_id: "service-1",
  provider_id: "provider-1",
  requester_id: "user-1",
  timebank_hours: 2,
  status: "in_progress",
  description: "Piano session",
  provider_confirmed: true,
  requester_confirmed: false,
  created_at: "2026-05-03T00:00:00Z",
  updated_at: "2026-05-03T00:00:00Z",
};

function renderTab(
  overrides: Partial<React.ComponentProps<typeof MyApplicationsTab>> = {},
) {
  const props = {
    requests: [request],
    serviceTitles: {},
    services: [service],
    serviceTransactions: { "service-1": [transaction] },
    currentUserId: "user-1",
    onServiceClick: vi.fn(),
    onConfirmTransactionCompletion: vi.fn().mockResolvedValue(undefined),
    formatDate: (date: string) => date.slice(0, 10),
    ...overrides,
  };

  return {
    props,
    ...render(
      <Theme>
        <MyApplicationsTab {...props} />
      </Theme>,
    ),
  };
}

describe("MyApplicationsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserById.mockResolvedValue({
      data: { username: "provider", full_name: "Provider User" },
    });
    mockGetTransactionRatings.mockResolvedValue({ data: [] });
    mockCreateRating.mockResolvedValue({});
  });

  it("renders approved applications and confirms completion with a rating", async () => {
    const user = userEvent.setup();
    const { props } = renderTab();

    expect(await screen.findByText("by Provider User")).toBeInTheDocument();
    expect(screen.getByText("Piano lessons")).toBeInTheDocument();
    expect(screen.getByText('"I would like to join."')).toBeInTheDocument();
    expect(screen.getByText('"Welcome aboard."')).toBeInTheDocument();
    expect(screen.getByText("0/1 Confirmed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirm Completion/ }));
    await user.click(screen.getByRole("button", { name: "Submit completion rating" }));

    await waitFor(() => {
      expect(props.onConfirmTransactionCompletion).toHaveBeenCalledWith("tx-1", {
        ratedUserId: "provider-1",
        score: 5,
        comment: "Great help",
        tags: ["helpful"],
        image_urls: [],
      });
    });
  });

  it("shows a completed application with existing requester rating", async () => {
    mockGetTransactionRatings.mockResolvedValue({
      data: [
        {
          _id: "rating-1",
          transaction_id: "tx-1",
          rater_id: "user-1",
          rated_user_id: "provider-1",
          score: 5,
          comment: "Already rated",
          tags: ["helpful"],
          image_urls: ["rating.jpg"],
          created_at: "2026-05-04T00:00:00Z",
        },
      ],
    });

    renderTab({
      services: [
        {
          ...service,
          status: "completed",
          receiver_confirmed_ids: ["user-1"],
        },
      ],
      serviceTransactions: {
        "service-1": [
          {
            ...transaction,
            status: "completed",
            requester_confirmed: true,
          },
        ],
      },
    });

    expect(await screen.findByText("Your rating for the provider")).toBeInTheDocument();
    expect(screen.getByText("Stars: 5")).toBeInTheDocument();
    expect(screen.getByText('"Already rated"')).toBeInTheDocument();
    expect(screen.getByText("Rating images: 1")).toBeInTheDocument();
  });

  it("renders the empty application state", () => {
    renderTab({ requests: [] });

    expect(
      screen.getByText("You haven't applied to any services yet."),
    ).toBeInTheDocument();
  });
});
