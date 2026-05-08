import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InterestSelector } from "../InterestSelector";

vi.mock("@/services/api", () => ({
  usersApi: {
    getAvailableInterests: vi.fn(),
  },
}));

import { usersApi } from "@/services/api";

const INTERESTS = ["Cooking", "Music", "Photography", "Gardening"];

function renderSelector(overrides: Partial<Parameters<typeof InterestSelector>[0]> = {}) {
  return render(
    <InterestSelector
      open={true}
      onOpenChange={vi.fn()}
      initialSelected={[]}
      onSave={vi.fn()}
      {...overrides}
    />,
  );
}

describe("InterestSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usersApi.getAvailableInterests).mockResolvedValue({ data: INTERESTS } as any);
  });

  it("renders the dialog title", async () => {
    renderSelector();
    expect(screen.getByText("Pick your interests")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderSelector();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders interest chips after loading", async () => {
    renderSelector();
    await waitFor(() => {
      expect(screen.getByText("Cooking")).toBeInTheDocument();
      expect(screen.getByText("Music")).toBeInTheDocument();
    });
  });

  it("shows 0 selected initially", async () => {
    renderSelector();
    await waitFor(() => screen.getByText("Cooking"));
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });

  it("updates selected count when interest is toggled", async () => {
    const user = userEvent.setup();
    renderSelector();
    await waitFor(() => screen.getByText("Cooking"));
    await user.click(screen.getByText("Cooking"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("deselects an already-selected interest", async () => {
    const user = userEvent.setup();
    renderSelector({ initialSelected: ["Music"] });
    await waitFor(() => screen.getByText("Music"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    await user.click(screen.getByText("Music"));
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });

  it("filters interests by search input", async () => {
    const user = userEvent.setup();
    renderSelector();
    await waitFor(() => screen.getByText("Cooking"));
    await user.type(screen.getByPlaceholderText("Search interests..."), "photo");
    expect(screen.getByText("Photography")).toBeInTheDocument();
    expect(screen.queryByText("Cooking")).not.toBeInTheDocument();
  });

  it("shows no-match message when search finds nothing", async () => {
    const user = userEvent.setup();
    renderSelector();
    await waitFor(() => screen.getByText("Cooking"));
    await user.type(screen.getByPlaceholderText("Search interests..."), "zzz");
    expect(screen.getByText("No interests match your search")).toBeInTheDocument();
  });

  it("calls onSave with selected interests", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    renderSelector({ onSave });
    await waitFor(() => screen.getByText("Cooking"));
    await user.click(screen.getByText("Cooking"));
    await user.click(screen.getByRole("button", { name: "Save interests" }));
    expect(onSave).toHaveBeenCalledWith(["Cooking"]);
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderSelector({ onOpenChange });
    await waitFor(() => screen.getByText("Cooking"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render when open is false", () => {
    renderSelector({ open: false });
    expect(screen.queryByText("Pick your interests")).not.toBeInTheDocument();
  });
});
