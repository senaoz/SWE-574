import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RatingStars, RatingForm } from "../RatingStars";

describe("RatingStars", () => {
  it("renders 5 stars", () => {
    const { container } = render(<RatingStars value={0} />);
    // Each star is a lucide Star SVG
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
  });

  it("calls onChange with clicked star number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<RatingStars value={0} onChange={onChange} />);
    const stars = container.querySelectorAll("svg");
    await user.click(stars[2]); // click 3rd star
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not call onChange when readonly", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <RatingStars value={3} onChange={onChange} readonly />,
    );
    const stars = container.querySelectorAll("svg");
    await user.click(stars[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fills stars up to the value prop", () => {
    const { container } = render(<RatingStars value={3} />);
    const stars = container.querySelectorAll("svg");
    // First 3 stars should have amber fill, last 2 should not
    const filledStars = Array.from(stars).filter((s) =>
      s.getAttribute("fill")?.includes("amber"),
    );
    expect(filledStars).toHaveLength(3);
  });
});

describe("RatingForm", () => {
  it("renders star selector and comment textarea", () => {
    render(<RatingForm onSubmit={vi.fn()} />);
    expect(screen.getByText("Rate this exchange")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("How was your experience?"),
    ).toBeInTheDocument();
  });

  it("submit button is disabled when no star is selected", () => {
    render(<RatingForm onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Submit Rating" })).toBeDisabled();
  });

  it("submit button is enabled after selecting a star", async () => {
    const user = userEvent.setup();
    const { container } = render(<RatingForm onSubmit={vi.fn()} />);
    const stars = container.querySelectorAll("svg");
    await user.click(stars[4]); // 5th star
    expect(
      screen.getByRole("button", { name: "Submit Rating" }),
    ).not.toBeDisabled();
  });

  it("calls onSubmit with score and comment", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<RatingForm onSubmit={onSubmit} />);

    const stars = container.querySelectorAll("svg");
    await user.click(stars[3]); // 4th star → score 4

    await user.type(
      screen.getByPlaceholderText("How was your experience?"),
      "Great service!",
    );
    await user.click(screen.getByRole("button", { name: "Submit Rating" }));

    expect(onSubmit).toHaveBeenCalledWith(4, "Great service!");
  });

  it("shows loading state while submitting", () => {
    render(<RatingForm onSubmit={vi.fn()} loading />);
    expect(screen.getByRole("button", { name: "Submitting..." })).toBeInTheDocument();
  });
});
