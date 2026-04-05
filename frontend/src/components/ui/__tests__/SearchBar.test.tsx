import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SearchBar } from "../SearchBar";

const mockGetServices = vi.fn();

vi.mock("@/services/api", () => ({
  servicesApi: {
    getServices: (...args: any[]) => mockGetServices(...args),
  },
}));

vi.mock("@/components/ui/ClickableTag", () => ({
  ClickableTag: ({ tag }: any) => (
    <span data-testid="tag">{typeof tag === "string" ? tag : tag.label}</span>
  ),
}));

const mockService = {
  _id: "svc-1",
  title: "Piano Lessons",
  description: "Learn piano from a professional",
  service_type: "offer",
  tags: [{ entityId: "Q1", label: "music", description: "" }],
};

function renderBar(onSearchChange?: (q: string) => void) {
  return render(
    <MemoryRouter>
      <SearchBar onSearchChange={onSearchChange} />
    </MemoryRouter>,
  );
}

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the search input", () => {
    renderBar();
    expect(screen.getByPlaceholderText("Search services...")).toBeInTheDocument();
  });

  it("calls onSearchChange callback when typing", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    renderBar(onSearchChange);
    await user.type(screen.getByPlaceholderText("Search services..."), "piano");
    expect(onSearchChange).toHaveBeenLastCalledWith("piano");
  });

  it("shows clear button when text is entered", async () => {
    const user = userEvent.setup();
    renderBar();
    await user.type(screen.getByPlaceholderText("Search services..."), "piano");
    // Clear button (Cross2Icon) should appear
    const clearBtn = screen.getByRole("button");
    expect(clearBtn).toBeInTheDocument();
  });

  it("clears input when clear button is clicked", async () => {
    const user = userEvent.setup();
    renderBar();
    const input = screen.getByPlaceholderText("Search services...");
    await user.type(input, "piano");
    await user.click(screen.getByRole("button"));
    expect(input).toHaveValue("");
  });

  it("shows search results dropdown when token is present and API returns results", async () => {
    const user = userEvent.setup();
    localStorage.setItem("access_token", "fake-token");
    mockGetServices.mockResolvedValue({ data: { services: [mockService] } });

    renderBar();
    await user.type(screen.getByPlaceholderText("Search services..."), "piano");

    await waitFor(() => {
      expect(screen.getByText("Piano Lessons")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("does not trigger API search when no token is present", async () => {
    const user = userEvent.setup();
    // No token in localStorage
    renderBar();
    await user.type(screen.getByPlaceholderText("Search services..."), "piano");

    // The search handler returns early (no API call) when there is no token
    await waitFor(() => {
      expect(mockGetServices).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it("shows 'No services found' when API returns empty results", async () => {
    const user = userEvent.setup();
    localStorage.setItem("access_token", "fake-token");
    mockGetServices.mockResolvedValue({ data: { services: [] } });

    renderBar();
    await user.type(screen.getByPlaceholderText("Search services..."), "xyz");

    await waitFor(() => {
      expect(screen.getByText("No services found")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
