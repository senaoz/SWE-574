import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DashboardFilterBar,
  DashboardFilters,
  defaultDashboardFilters,
} from "../DashboardFilterBar";

vi.mock("@/constants/turkishCities", () => ({
  getCityOptions: () => [
    { value: "istanbul", label: "Istanbul" },
    { value: "ankara", label: "Ankara" },
  ],
}));

function renderBar(
  filters: DashboardFilters = defaultDashboardFilters,
  onFiltersChange = vi.fn(),
) {
  return render(
    <DashboardFilterBar
      filters={filters}
      onFiltersChange={onFiltersChange}
      availableTags={[
        { entityId: "Q1", label: "cooking", description: "" },
        { entityId: "Q2", label: "music", description: "" },
      ]}
      hasLocation={false}
    />,
  );
}

describe("DashboardFilterBar", () => {
  it("renders filter pills", () => {
    renderBar();
    expect(screen.getByText("For you")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
    // Default status is "active" so the pill shows "Active" (the label), not "Status"
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("Sort")).toBeInTheDocument();
  });

  it("does not show Clear all button when filters are default", () => {
    renderBar();
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("shows Clear all button when a non-default filter is active", () => {
    renderBar({ ...defaultDashboardFilters, serviceType: "offer" });
    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("calls onFiltersChange with defaults when Clear all is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderBar({ ...defaultDashboardFilters, serviceType: "offer" }, onChange);
    await user.click(screen.getByText("Clear all"));
    expect(onChange).toHaveBeenCalledWith(defaultDashboardFilters);
  });

  it("toggles forYouOnly when For you is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderBar(defaultDashboardFilters, onChange);
    await user.click(screen.getByText("For you"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ forYouOnly: true }),
    );
  });

  it("shows active pill label when serviceType is set to offer", () => {
    renderBar({ ...defaultDashboardFilters, serviceType: "offer" });
    expect(screen.getByText("Offers")).toBeInTheDocument();
  });

  it("shows active city label when city filter is set", () => {
    renderBar({ ...defaultDashboardFilters, city: "istanbul" });
    expect(screen.getByText("Istanbul")).toBeInTheDocument();
  });

  it("shows active status label when status is changed", () => {
    renderBar({ ...defaultDashboardFilters, status: "completed" });
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows tag count in pill label when multiple tags selected", () => {
    renderBar({
      ...defaultDashboardFilters,
      selectedTags: ["Q1", "Q2"],
    });
    expect(screen.getByText("2 tags")).toBeInTheDocument();
  });

  it("shows single tag label when one tag selected", () => {
    renderBar({
      ...defaultDashboardFilters,
      selectedTags: ["Q1"],
    });
    expect(screen.getByText("cooking")).toBeInTheDocument();
  });

  it("shows location required message when distance filter active but no location", async () => {
    const user = userEvent.setup();
    renderBar();
    // Open the Distance popover
    await user.click(screen.getByText("Distance"));
    expect(
      screen.getByText("Enable location to use distance filter"),
    ).toBeInTheDocument();
  });
});
