import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterestsStep } from "../InterestsStep";

const mockGetAvailableInterests = vi.fn();

vi.mock("@/services/api", () => ({
  usersApi: {
    getAvailableInterests: () => mockGetAvailableInterests(),
  },
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({
    name,
    selected,
    onClick,
  }: {
    name: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      data-testid={`chip-${name}`}
      data-selected={selected}
      onClick={onClick}
    >
      {name}
    </button>
  ),
}));

describe("InterestsStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAvailableInterests.mockResolvedValue({ data: ["cooking", "music", "sports"] });
  });

  it("shows loading state initially", () => {
    mockGetAvailableInterests.mockReturnValue(new Promise(() => {}));
    render(<InterestsStep selected={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders interests after loading", async () => {
    render(<InterestsStep selected={[]} onUpdate={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId("chip-cooking")).toBeInTheDocument();
      expect(screen.getByTestId("chip-music")).toBeInTheDocument();
      expect(screen.getByTestId("chip-sports")).toBeInTheDocument();
    });
  });

  it("renders heading", async () => {
    render(<InterestsStep selected={[]} onUpdate={vi.fn()} />);
    expect(screen.getByText(/what are you into/i)).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<InterestsStep selected={[]} onUpdate={vi.fn()} />);
    expect(screen.getByPlaceholderText(/search interests/i)).toBeInTheDocument();
  });

  it("calls onUpdate when an interest is clicked", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<InterestsStep selected={[]} onUpdate={onUpdate} />);
    await waitFor(() => screen.getByTestId("chip-cooking"));
    await user.click(screen.getByTestId("chip-cooking"));
    expect(onUpdate).toHaveBeenCalledWith(["cooking"]);
  });

  it("removes interest when clicked again (deselect)", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<InterestsStep selected={["cooking"]} onUpdate={onUpdate} />);
    await waitFor(() => screen.getByTestId("chip-cooking"));
    await user.click(screen.getByTestId("chip-cooking"));
    expect(onUpdate).toHaveBeenCalledWith([]);
  });

  it("filters interests based on search query", async () => {
    const user = userEvent.setup();
    render(<InterestsStep selected={[]} onUpdate={vi.fn()} />);
    await waitFor(() => screen.getByTestId("chip-cooking"));
    await user.type(screen.getByPlaceholderText(/search interests/i), "cook");
    expect(screen.getByTestId("chip-cooking")).toBeInTheDocument();
    expect(screen.queryByTestId("chip-music")).not.toBeInTheDocument();
  });

  it("shows empty state when no interests match search", async () => {
    const user = userEvent.setup();
    render(<InterestsStep selected={[]} onUpdate={vi.fn()} />);
    await waitFor(() => screen.getByTestId("chip-cooking"));
    await user.type(screen.getByPlaceholderText(/search interests/i), "xyz");
    expect(screen.getByText(/no interests match/i)).toBeInTheDocument();
  });

  it("shows selected count", async () => {
    render(<InterestsStep selected={["cooking", "music"]} onUpdate={vi.fn()} />);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });
});
