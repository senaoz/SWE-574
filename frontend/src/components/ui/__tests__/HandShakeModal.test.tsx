import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Theme } from "@radix-ui/themes";
import type { Service } from "@/types";
import { HandShakeModal } from "../HandShakeModal";

const mockCreateJoinRequest = vi.fn();
const mockGetTimeBank = vi.fn();

vi.mock("@/services/api", () => ({
  joinRequestsApi: {
    createJoinRequest: (...args: any[]) => mockCreateJoinRequest(...args),
  },
  usersApi: {
    getTimeBank: (...args: any[]) => mockGetTimeBank(...args),
  },
}));

vi.mock("../../assets/handshakeIcon.png", () => ({
  default: "handshake.png",
}));

const service: Service = {
  _id: "service-1",
  user_id: "owner-1",
  title: "Piano lessons",
  description: "Learn piano",
  category: "education",
  tags: [],
  estimated_duration: 2,
  location: { latitude: 41.01, longitude: 29.01, address: "Kadikoy" },
  service_type: "offer",
  status: "active",
  created_at: "2026-05-01T00:00:00Z",
  updated_at: "2026-05-01T00:00:00Z",
  deadline: "2026-05-20T00:00:00Z",
  max_participants: 1,
};

function renderModal(overrides = {}) {
  return render(
    <Theme>
      <HandShakeModal service={service} {...overrides} />
    </Theme>,
  );
}

describe("HandShakeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTimeBank.mockResolvedValue({
      data: {
        balance: 3,
        effective_max_balance: 10,
        effective_min_balance: 0,
      },
    });
    mockCreateJoinRequest.mockResolvedValue({});
    vi.spyOn(console, "group").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "groupEnd").mockImplementation(() => undefined);
  });

  it("submits a join request with the optional message", async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn();
    renderModal({ onJoin });

    await user.click(screen.getByRole("button", { name: "Request Service" }));
    expect(await screen.findByText("Join This Offer")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Share your experience, availability, or any questions..."),
      "I am free this weekend.",
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mockCreateJoinRequest).toHaveBeenCalledWith({
        service_id: "service-1",
        message: "I am free this weekend.",
      });
    });
    expect(onJoin).toHaveBeenCalled();
    expect(screen.getByText("Request pending")).toBeInTheDocument();
  });

  it("shows API errors and disables duplicate submission", async () => {
    const user = userEvent.setup();
    mockCreateJoinRequest.mockRejectedValue({
      response: { data: { detail: "You already requested this service" } },
    });

    renderModal();

    await user.click(screen.getByRole("button", { name: "Request Service" }));
    await user.click(await screen.findByRole("button", { name: "Confirm" }));

    expect(
      await screen.findByText("You already requested this service"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("disables the trigger when the service is full or owned by the user", () => {
    const { rerender } = render(
      <Theme>
        <HandShakeModal service={service} disabled />
      </Theme>,
    );

    expect(screen.getByRole("button", { name: "Service is full" })).toBeDisabled();

    rerender(
      <Theme>
        <HandShakeModal service={service} isOwner />
      </Theme>,
    );

    expect(screen.getByRole("button", { name: "Request Service" })).toBeDisabled();
  });
});
