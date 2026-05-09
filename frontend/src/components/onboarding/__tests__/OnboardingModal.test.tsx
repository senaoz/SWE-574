import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OnboardingModal } from "../OnboardingModal";

const mockNavigate = vi.fn();
const mockUseUser = vi.fn();
const mockUpdateProfile = vi.fn();
const mockRefetchUser = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/services/api", () => ({
  usersApi: { updateProfile: (...args: any[]) => mockUpdateProfile(...args) },
}));

vi.mock("../steps/WelcomeStep", () => ({
  WelcomeStep: () => <div data-testid="welcome-step">Welcome</div>,
}));

vi.mock("../steps/InterestsStep", () => ({
  InterestsStep: ({ onUpdate }: { onUpdate: (i: string[]) => void }) => (
    <div data-testid="interests-step">
      <button onClick={() => onUpdate(["cooking"])}>Select Interest</button>
    </div>
  ),
}));

vi.mock("../steps/ProfileStep", () => ({
  ProfileStep: () => <div data-testid="profile-step">Profile</div>,
}));

vi.mock("../steps/CompleteStep", () => ({
  CompleteStep: () => <div data-testid="complete-step">Complete</div>,
}));

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OnboardingModal />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("OnboardingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUpdateProfile.mockResolvedValue({});
    mockRefetchUser.mockResolvedValue(undefined);
  });

  it("does not open modal while auth is loading", () => {
    mockUseUser.mockReturnValue({ user: null, isLoading: true, refetchUser: mockRefetchUser });
    renderModal();
    expect(screen.queryByTestId("welcome-step")).not.toBeInTheDocument();
  });

  it("does not open modal for user who already has interests", () => {
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: ["cooking"] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    expect(screen.queryByTestId("welcome-step")).not.toBeInTheDocument();
  });

  it("does not open modal when user previously dismissed it", () => {
    const userId = "u1";
    localStorage.setItem("onboarding_dismissed", userId);
    mockUseUser.mockReturnValue({
      user: { _id: userId, interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    expect(screen.queryByTestId("welcome-step")).not.toBeInTheDocument();
  });

  it("opens modal for new user with no interests", () => {
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    expect(screen.getByTestId("welcome-step")).toBeInTheDocument();
  });

  it("shows step 0 (WelcomeStep) initially", () => {
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    expect(screen.getByTestId("welcome-step")).toBeInTheDocument();
    expect(screen.queryByTestId("interests-step")).not.toBeInTheDocument();
  });

  it("shows 'Get started' button on step 0", () => {
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });

  it("shows Skip button on step 0", () => {
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
  });

  it("advances to InterestsStep on 'Get started' click", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    await user.click(screen.getByRole("button", { name: /get started/i }));
    await waitFor(() => {
      expect(screen.getByTestId("interests-step")).toBeInTheDocument();
    });
  });

  it("navigates to /dashboard and sets dismissed flag on Skip", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    await user.click(screen.getByRole("button", { name: /skip/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      expect(localStorage.getItem("onboarding_dismissed")).toBe("u1");
    });
  });

  it("shows Back button on steps 1 and 2", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    await user.click(screen.getByRole("button", { name: /get started/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    });
  });

  it("shows 'Get started', 'Skip', and no Back on step 0", () => {
    mockUseUser.mockReturnValue({
      user: { _id: "u1", interests: [] },
      isLoading: false,
      refetchUser: mockRefetchUser,
    });
    renderModal();
    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  });
});
