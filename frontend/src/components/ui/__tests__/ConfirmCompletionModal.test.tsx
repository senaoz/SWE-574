import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Theme } from "@radix-ui/themes";
import type { Transaction } from "@/types";
import { ConfirmCompletionModal } from "../ConfirmCompletionModal";

const mockUploadRatingImage = vi.fn();

vi.mock("@/services/api", () => ({
  uploadApi: {
    uploadRatingImage: (...args: any[]) => mockUploadRatingImage(...args),
  },
}));

vi.mock("../RatingStars", () => ({
  RatingStars: ({ value, onChange }: any) => (
    <button type="button" onClick={() => onChange?.(5)}>
      Rating {value}
    </button>
  ),
}));

vi.mock("../InterestChip", () => ({
  InterestChip: ({ name, selected, onClick }: any) => (
    <button type="button" aria-pressed={selected} onClick={onClick}>
      {name}
    </button>
  ),
}));

const transaction: Transaction = {
  _id: "tx-1",
  service_id: "service-1",
  provider_id: "provider-1",
  requester_id: "requester-1",
  timebank_hours: 2,
  status: "in_progress",
  description: "Piano help",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  service: { id: "service-1", title: "Piano lessons" },
  provider: { id: "provider-1", username: "owner", full_name: "Owner User" },
  requester: { id: "requester-1", username: "receiver", full_name: "Receiver User" },
};

function renderModal(overrides = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    transaction,
    currentUserId: "requester-1",
    onSubmit: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    props,
    ...render(
      <Theme>
        <ConfirmCompletionModal {...props} />
      </Theme>,
    ),
  };
}

describe("ConfirmCompletionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    mockUploadRatingImage.mockResolvedValue({ data: { url: "uploads/rating.jpg" } });
  });

  it("requires confirmation, rating, and feedback before submitting", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    expect(screen.getByText("Piano lessons")).toBeInTheDocument();
    expect(screen.getByText("Owner User")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm & Rate" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Rating 0" }));
    await user.click(screen.getByRole("button", { name: "Punctual" }));
    await user.type(
      screen.getByPlaceholderText("How was your experience?"),
      "Reliable and on time",
    );

    await user.click(screen.getByRole("button", { name: "Confirm & Rate" }));

    await waitFor(() => {
      expect(props.onSubmit).toHaveBeenCalledWith({
        score: 5,
        tags: ["punctual"],
        comment: "Reliable and on time",
        image_urls: undefined,
      });
    });
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uploads attached photos with the completion rating", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    const file = new File(["rating"], "rating.png", { type: "image/png" });

    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });

    expect(screen.getByAltText("Preview 1")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Rating 0" }));
    await user.click(screen.getByRole("button", { name: "Professional" }));
    await user.click(screen.getByRole("button", { name: "Confirm & Rate" }));

    await waitFor(() => {
      expect(mockUploadRatingImage).toHaveBeenCalledWith(file);
      expect(props.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ image_urls: ["uploads/rating.jpg"] }),
      );
    });
  });

  it("resets and closes from cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });
});
