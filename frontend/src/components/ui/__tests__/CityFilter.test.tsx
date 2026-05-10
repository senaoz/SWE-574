import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { CityFilter } from "../CityFilter";

function renderFilter(props: Parameters<typeof CityFilter>[0]) {
  return render(
    <Theme>
      <CityFilter {...props} />
    </Theme>,
  );
}

describe("CityFilter", () => {
  it("renders a trigger element", () => {
    renderFilter({ selectedCity: "all", onCityChange: vi.fn() });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("accepts a className prop without crashing", () => {
    const { container } = renderFilter({
      selectedCity: "Istanbul",
      onCityChange: vi.fn(),
      className: "custom-class",
    });
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
