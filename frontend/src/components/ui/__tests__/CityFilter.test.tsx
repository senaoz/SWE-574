import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CityFilter } from "../CityFilter";

describe("CityFilter", () => {
  it("renders a trigger element", () => {
    render(<CityFilter selectedCity="all" onCityChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("accepts a className prop without crashing", () => {
    const { container } = render(
      <CityFilter selectedCity="Istanbul" onCityChange={vi.fn()} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
