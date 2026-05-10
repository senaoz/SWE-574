import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { RatingDetailed, Transaction } from "@/types";
import { ActivitySummarySection } from "../ActivitySummarySection";

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

vi.mock("@/components/ui/StatusBadge", () => ({
  StatusBadge: ({ status }: any) => <span>Status: {status}</span>,
}));

vi.mock("@/components/ui/RatingStars", () => ({
  RatingStars: ({ value }: any) => <span>Stars: {value}</span>,
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name, selected }: any) => (
    <span>
      {name}
      {selected ? " selected" : ""}
    </span>
  ),
}));

vi.mock("@/components/ui/ImageGallery", () => ({
  ImageGallery: ({ urls }: any) => <div>Feedback photos: {urls.length}</div>,
}));

vi.mock("@/components/ui/ConfirmCompletionModal", () => ({
  tagToLabel: (tag: string) =>
    tag === "helpful" ? "Helpful" : tag === "reliable" ? "Reliable" : tag,
}));

const now = new Date().toISOString();

const transactions: Transaction[] = [
  {
    _id: "tx-given",
    service_id: "service-1",
    provider_id: "user-1",
    requester_id: "user-2",
    timebank_hours: 2,
    status: "completed",
    description: "Piano exchange",
    created_at: now,
    updated_at: now,
    completed_at: now,
    requester: { id: "user-2", username: "bob", full_name: "Bob User" },
    service: { id: "service-1", title: "Piano lessons" },
  },
  {
    _id: "tx-taken",
    service_id: "service-2",
    provider_id: "user-3",
    requester_id: "user-1",
    timebank_hours: 1.5,
    status: "completed",
    description: "Garden support",
    created_at: now,
    updated_at: now,
    completed_at: now,
    provider: { id: "user-3", username: "ada", full_name: "Ada User" },
    service: { id: "service-2", title: "Garden help" },
  },
  {
    _id: "tx-progress",
    service_id: "service-3",
    provider_id: "user-4",
    requester_id: "user-1",
    timebank_hours: 3,
    status: "in_progress",
    description: "Bike repair",
    created_at: now,
    updated_at: now,
    provider: { id: "user-4", username: "lee", full_name: "Lee User" },
    service: { id: "service-3", title: "Bike repair" },
  },
];

const ratings: RatingDetailed[] = [
  {
    _id: "rating-1",
    transaction_id: "tx-given",
    rater_id: "user-2",
    rated_user_id: "user-1",
    score: 5,
    comment: "Great teacher",
    tags: ["reliable"],
    image_urls: ["rating.jpg"],
    created_at: now,
    rater: { id: "user-2", username: "bob", full_name: "Bob User" },
    service: {
      id: "service-1",
      title: "Piano lessons",
      service_type: "offer",
      status: "completed",
    },
  },
  {
    _id: "rating-2",
    transaction_id: "tx-taken",
    rater_id: "user-1",
    rated_user_id: "user-3",
    score: 4,
    comment: "Very helpful",
    tags: ["helpful"],
    created_at: now,
    rater: { id: "user-1", username: "me", full_name: "Current User" },
    service: {
      id: "service-2",
      title: "Garden help",
      service_type: "need",
      status: "completed",
    },
  },
];

function renderSection(
  props: Partial<React.ComponentProps<typeof ActivitySummarySection>> = {},
) {
  return render(
    <Theme>
      <MemoryRouter>
        <ActivitySummarySection
          transactions={transactions}
          ratings={ratings}
          currentUserId="user-1"
          isLoading={false}
          {...props}
        />
      </MemoryRouter>
    </Theme>,
  );
}

describe("ActivitySummarySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading and empty activity states", () => {
    const { rerender } = render(
      <Theme>
        <MemoryRouter>
          <ActivitySummarySection
            transactions={[]}
            ratings={[]}
            currentUserId="user-1"
            isLoading
          />
        </MemoryRouter>
      </Theme>,
    );

    expect(screen.getByText("Loading activity...")).toBeInTheDocument();

    rerender(
      <Theme>
        <MemoryRouter>
          <ActivitySummarySection
            transactions={[]}
            ratings={[]}
            currentUserId="user-1"
            isLoading={false}
          />
        </MemoryRouter>
      </Theme>,
    );

    expect(screen.getByText("No activity yet")).toBeInTheDocument();
  });

  it("summarizes transactions, feedback, filters, and navigation links", async () => {
    const user = userEvent.setup();
    renderSection();

    expect(screen.getByText("Activity Summary")).toBeInTheDocument();
    expect(screen.getByText("Piano lessons")).toBeInTheDocument();
    expect(screen.getByText("Garden help")).toBeInTheDocument();
    expect(screen.getByText("Bike repair")).toBeInTheDocument();
    expect(screen.getByText('"Great teacher"')).toBeInTheDocument();
    expect(screen.getByText("Feedback photos: 1")).toBeInTheDocument();
    expect(screen.getByText("Stars: 5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Offer" }));
    expect(screen.getByText("Showing 1 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Garden help")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Clear type/ }));
    expect(screen.getByText("Garden help")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bob User" }));
    expect(mockNavigate).toHaveBeenCalledWith("/user/user-2");

    await user.click(screen.getByRole("button", { name: "Piano lessons" }));
    expect(mockNavigate).toHaveBeenCalledWith("/service/service-1");
  });
});
