import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { RatingDetailed } from "@/types";
import { ReviewCard } from "../ReviewCard";

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

vi.mock("@/components/ui/RatingStars", () => ({
  RatingStars: ({ value }: any) => <span>Score {value}</span>,
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: any) => <span>{name}</span>,
}));

vi.mock("@/components/ui/ConfirmCompletionModal", () => ({
  tagToLabel: (tag: string) => `Tag ${tag}`,
}));

vi.mock("@/components/ui/ImageGallery", () => ({
  ImageGallery: ({ urls, alt }: any) => (
    <div>{urls.map((url: string) => <img key={url} alt={alt} src={url} />)}</div>
  ),
}));

const rating: RatingDetailed = {
  _id: "rating-1",
  transaction_id: "transaction-1",
  rater_id: "user-1",
  rated_user_id: "user-2",
  score: 5,
  comment: "Careful and friendly help.",
  tags: ["reliable", "clear_communication"],
  image_urls: ["review-photo.jpg"],
  created_at: "2026-05-02T12:00:00Z",
  rater: {
    id: "user-1",
    username: "alice",
  },
  transaction: {
    id: "transaction-1",
    timebank_hours: 2,
  },
  service: {
    id: "service-1",
    title: "Fix Bike",
  },
};

function renderCard(cardRating: RatingDetailed) {
  return render(
    <Theme>
      <MemoryRouter>
        <ReviewCard rating={cardRating} />
      </MemoryRouter>
    </Theme>,
  );
}

describe("ReviewCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders review details and navigates to the related service", async () => {
    const user = userEvent.setup();
    renderCard(rating);

    expect(screen.getByText("Score 5")).toBeInTheDocument();
    expect(screen.getByText("May 2, 2026")).toBeInTheDocument();
    expect(screen.getByText("from @alice")).toBeInTheDocument();
    expect(screen.getByText("2 hour(s)")).toBeInTheDocument();
    expect(screen.getByText("Tag reliable")).toBeInTheDocument();
    expect(screen.getByText("Tag clear_communication")).toBeInTheDocument();
    expect(screen.getByText('"Careful and friendly help."')).toBeInTheDocument();
    expect(screen.getByAltText("Review photo")).toHaveAttribute("src", "review-photo.jpg");

    await user.click(screen.getByRole("button", { name: "Fix Bike" }));

    expect(mockNavigate).toHaveBeenCalledWith("/service/service-1");
  });

  it("renders anonymous text and a plain service title when no service id exists", () => {
    renderCard({
      ...rating,
      rater: undefined,
      service: { id: "", title: "General Support" },
      transaction: undefined,
      tags: [],
      image_urls: [],
      comment: undefined,
    });

    expect(screen.getByText("from Anonymous")).toBeInTheDocument();
    expect(screen.getByText("General Support")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "General Support" })).not.toBeInTheDocument();
  });

  it("renders nothing when the rating has no service title", () => {
    const { container } = renderCard({
      ...rating,
      service: undefined,
    });

    expect(container.querySelector(".rt-Card")).not.toBeInTheDocument();
  });
});
