import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { JoinRequest } from "@/types";
import { ApplicantsList } from "../ApplicantsList";

const mockNavigate = vi.fn();
const mockGetServiceRequests = vi.fn();
const mockUpdateRequestStatus = vi.fn();
const mockGetUserById = vi.fn();
const mockGetUserBadges = vi.fn();
const mockGetUserRatings = vi.fn();

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
  getImageUrl: (path?: string) => (path ? `https://cdn.example.test/${path}` : undefined),
  joinRequestsApi: {
    getServiceRequests: (...args: any[]) => mockGetServiceRequests(...args),
    updateRequestStatus: (...args: any[]) => mockUpdateRequestStatus(...args),
  },
  usersApi: {
    getUserById: (...args: any[]) => mockGetUserById(...args),
    getUserBadges: (...args: any[]) => mockGetUserBadges(...args),
  },
  ratingsApi: {
    getUserRatings: (...args: any[]) => mockGetUserRatings(...args),
  },
}));

vi.mock("../BadgeDisplay", () => ({
  CustomBadge: ({ badge }: any) => <span>{badge.name}</span>,
}));

const pendingRequest: JoinRequest = {
  _id: "request-1",
  service_id: "service-1",
  user_id: "applicant-1",
  message: "I can help on Saturday",
  status: "pending",
  created_at: "2026-05-01T12:00:00Z",
  updated_at: "2026-05-01T12:00:00Z",
  user: {
    id: "applicant-1",
    username: "alice",
    full_name: "Alice User",
    profile_picture: "alice.jpg",
  },
};

const approvedRequest: JoinRequest = {
  _id: "request-2",
  service_id: "service-1",
  user_id: "applicant-2",
  message: "Happy to support",
  status: "approved",
  admin_message: "Already approved",
  created_at: "2026-05-02T12:00:00Z",
  updated_at: "2026-05-02T12:00:00Z",
  user: {
    id: "applicant-2",
    username: "bob",
    full_name: "Bob User",
    profile_picture: "bob.jpg",
  },
};

function renderApplicants(props: Partial<Parameters<typeof ApplicantsList>[0]> = {}) {
  return render(
    <Theme>
      <MemoryRouter>
        <ApplicantsList serviceId="service-1" {...props} />
      </MemoryRouter>
    </Theme>,
  );
}

describe("ApplicantsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServiceRequests.mockResolvedValue({
      data: {
        requests: [pendingRequest, approvedRequest],
      },
    });
    mockGetUserById.mockImplementation((userId: string) =>
      Promise.resolve({
        data:
          userId === "applicant-1"
            ? {
                _id: "applicant-1",
                username: "alice",
                full_name: "Alice User",
                profile_picture: "alice.jpg",
              }
            : {
                _id: "applicant-2",
                username: "bob",
                full_name: "Bob User",
                profile_picture: "bob.jpg",
              },
      }),
    );
    mockGetUserBadges.mockResolvedValue({
      data: {
        badges: [
          {
            key: "helper",
            name: "Helper",
            description: "Completed helpful work",
            earned: true,
          },
        ],
        total_count: 1,
      },
    });
    mockGetUserRatings.mockResolvedValue({
      data: { total: 2, average_score: 4.5 },
    });
    mockUpdateRequestStatus.mockImplementation(
      (requestId: string, payload: { status: JoinRequest["status"]; admin_message?: string }) =>
        Promise.resolve({
          data: {
            ...pendingRequest,
            _id: requestId,
            status: payload.status,
            admin_message: payload.admin_message,
          },
        }),
    );
  });

  it("loads applicants and approves a pending request with an admin message", async () => {
    const user = userEvent.setup();
    const onRequestUpdate = vi.fn();
    renderApplicants({ onRequestUpdate });

    expect(screen.getByText("Loading applicants...")).toBeInTheDocument();
    expect(await screen.findByText("Applicants History")).toBeInTheDocument();
    expect(screen.getByText("1 Pending")).toBeInTheDocument();
    expect(screen.getByText("Alice User")).toBeInTheDocument();
    expect(screen.getByText("Bob User")).toBeInTheDocument();

    await screen.findAllByText("Helper");
    await user.type(
      screen.getByPlaceholderText("Add a message for the applicant..."),
      "Looks good",
    );
    await user.click(screen.getByRole("button", { name: /Approve Request/ }));

    await waitFor(() => {
      expect(mockUpdateRequestStatus).toHaveBeenCalledWith("request-1", {
        status: "approved",
        admin_message: "Looks good",
      });
    });
    await waitFor(() => expect(onRequestUpdate).toHaveBeenCalled());
    expect(mockGetServiceRequests).toHaveBeenCalledWith("service-1");
  });

  it("shows a server error when rejecting a request fails", async () => {
    const user = userEvent.setup();
    mockUpdateRequestStatus.mockRejectedValue({
      response: { data: { detail: "Cannot reject this request" } },
    });

    renderApplicants();
    await screen.findByText("Alice User");
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(await screen.findByText(/Cannot reject this request/)).toBeInTheDocument();
  });

  it("can disable approval until the provider creates a matching need", async () => {
    renderApplicants({ disableApprove: true });

    await screen.findByText("Alice User");

    expect(screen.getByRole("button", { name: /Approve Request/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Approve Request/ })).toHaveAttribute(
      "title",
      "Create a Need before you can give help",
    );
  });

  it("shows an empty state when there are no applications", async () => {
    mockGetServiceRequests.mockResolvedValue({
      data: { requests: [] },
    });

    renderApplicants();

    expect(await screen.findByText("No applications yet.")).toBeInTheDocument();
  });

  it("navigates to an applicant profile from the applicant name", async () => {
    const user = userEvent.setup();
    renderApplicants();

    await user.click(await screen.findByText("Alice User"));

    expect(mockNavigate).toHaveBeenCalledWith("/user/applicant-1");
  });
});
