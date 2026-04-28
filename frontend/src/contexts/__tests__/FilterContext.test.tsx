import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterProvider, useFilters } from "../FilterContext";

function TestConsumer() {
  const { searchQuery, setSearchQuery, selectedCity, setSelectedCity } = useFilters();
  return (
    <div>
      <span data-testid="query">{searchQuery}</span>
      <span data-testid="city">{selectedCity}</span>
      <button onClick={() => setSearchQuery("piano")}>set query</button>
      <button onClick={() => setSelectedCity("Istanbul")}>set city</button>
    </div>
  );
}

describe("FilterContext", () => {
  it("provides default values", () => {
    render(
      <FilterProvider>
        <TestConsumer />
      </FilterProvider>,
    );
    expect(screen.getByTestId("query").textContent).toBe("");
    expect(screen.getByTestId("city").textContent).toBe("all");
  });

  it("updates searchQuery", async () => {
    const user = userEvent.setup();
    render(
      <FilterProvider>
        <TestConsumer />
      </FilterProvider>,
    );
    await user.click(screen.getByText("set query"));
    expect(screen.getByTestId("query").textContent).toBe("piano");
  });

  it("updates selectedCity", async () => {
    const user = userEvent.setup();
    render(
      <FilterProvider>
        <TestConsumer />
      </FilterProvider>,
    );
    await user.click(screen.getByText("set city"));
    expect(screen.getByTestId("city").textContent).toBe("Istanbul");
  });

  it("throws when useFilters is used outside FilterProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useFilters must be used within a FilterProvider",
    );
    spy.mockRestore();
  });
});
