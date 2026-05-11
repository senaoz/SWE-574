import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagAutocomplete } from "../TagAutocomplete";

const mockSearchWikidataEntities = vi.fn();

vi.mock("@/services/wikidata", () => ({
  searchWikidataEntities: (...args: any[]) => mockSearchWikidataEntities(...args),
}));

const gardeningTag = {
  label: "Gardening",
  entityId: "Q1",
  description: "Growing plants",
};

function renderAutocomplete(props: Partial<Parameters<typeof TagAutocomplete>[0]> = {}) {
  const onTagAdd = vi.fn();
  const onTagRemove = vi.fn();
  const view = render(
    <TagAutocomplete
      tags={[]}
      onTagAdd={onTagAdd}
      onTagRemove={onTagRemove}
      {...props}
    />,
  );

  return { ...view, onTagAdd, onTagRemove };
}

describe("TagAutocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchWikidataEntities.mockResolvedValue([gardeningTag]);
  });

  it("renders existing tags and removes a tag", async () => {
    const user = userEvent.setup();
    const { onTagRemove } = renderAutocomplete({
      tags: [gardeningTag],
    });

    expect(screen.getByText("Gardening")).toBeInTheDocument();
    expect(screen.getByText("(Q1)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove tag Gardening" }));
    expect(onTagRemove).toHaveBeenCalledWith(gardeningTag);
  });

  it("searches Wikidata and adds a selected suggestion", async () => {
    const user = userEvent.setup();
    const { onTagAdd } = renderAutocomplete();

    await user.type(
      screen.getByPlaceholderText("Search and add tags from WikiData..."),
      "garden",
    );

    await waitFor(() => {
      expect(mockSearchWikidataEntities).toHaveBeenLastCalledWith(
        "garden",
        "en",
        10,
        300,
      );
      expect(screen.getByRole("button", { name: /Gardening/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Gardening/i }));

    expect(onTagAdd).toHaveBeenCalledWith(gardeningTag);
    expect(
      screen.getByPlaceholderText("Search and add tags from WikiData..."),
    ).toHaveValue("");
  });

  it("filters duplicate suggestions by entityId or label", async () => {
    const user = userEvent.setup();
    mockSearchWikidataEntities.mockResolvedValue([
      gardeningTag,
      { label: "Cooking", entityId: "Q2" },
    ]);

    renderAutocomplete({
      tags: [{ label: "gardening", entityId: "other" }],
    });

    await user.type(
      screen.getByPlaceholderText("Search and add tags from WikiData..."),
      "g",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Cooking/i })).toBeInTheDocument();
      expect(screen.queryByText("(Q1)")).not.toBeInTheDocument();
    });
  });

  it("adds a manual tag with Enter when no suggestion is selected", async () => {
    const user = userEvent.setup();
    const { onTagAdd } = renderAutocomplete();

    const input = screen.getByPlaceholderText("Search and add tags from WikiData...");
    await user.type(input, "custom tag{Enter}");

    expect(onTagAdd).toHaveBeenCalledWith({ label: "custom tag", entityId: "" });
    expect(input).toHaveValue("");
  });

  it("does not add duplicate manual tags", async () => {
    const user = userEvent.setup();
    const { onTagAdd } = renderAutocomplete({
      tags: [{ label: "Gardening", entityId: "" }],
    });

    await user.type(
      screen.getByPlaceholderText("Search and add tags from WikiData..."),
      "gardening{Enter}",
    );

    expect(onTagAdd).not.toHaveBeenCalled();
  });

  it("uses arrow-key selection before adding a suggestion with Enter", async () => {
    const user = userEvent.setup();
    const cookingTag = { label: "Cooking", entityId: "Q2" };
    mockSearchWikidataEntities.mockResolvedValue([gardeningTag, cookingTag]);
    const { onTagAdd } = renderAutocomplete();

    const input = screen.getByPlaceholderText("Search and add tags from WikiData...");
    await user.type(input, "co");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Gardening/i })).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    expect(onTagAdd).toHaveBeenCalledWith(cookingTag);
  });

  it("disables input and shows helper text at max tags", () => {
    renderAutocomplete({
      tags: [gardeningTag],
      maxTags: 1,
      error: "Pick fewer tags",
    });

    expect(
      screen.getByPlaceholderText("Search and add tags from WikiData..."),
    ).toBeDisabled();
    expect(screen.getByText("Maximum 1 tags allowed")).toBeInTheDocument();
    expect(screen.getByText("Pick fewer tags")).toBeInTheDocument();
  });
});
