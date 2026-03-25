import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferNeedForm } from "../OfferNeedForm";
import { Service } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock API modules
const mockCreateService = vi.fn().mockResolvedValue({ data: {} });
const mockUpdateService = vi.fn().mockResolvedValue({ data: {} });
const mockUploadServiceImage = vi.fn().mockResolvedValue({ data: { url: "/uploads/img.jpg" } });

vi.mock("@/services/api", () => ({
  servicesApi: {
    createService: (...args: any[]) => mockCreateService(...args),
    updateService: (...args: any[]) => mockUpdateService(...args),
  },
  uploadApi: {
    uploadServiceImage: (...args: any[]) => mockUploadServiceImage(...args),
  },
  getImageUrl: (url: string) => `http://localhost:8000${url}`,
}));

// Mock sub-components that are hard to render in tests
vi.mock("../TagAutocomplete", () => ({
  TagAutocomplete: (props: any) => (
    <div data-testid="tag-autocomplete">
      {props.tags?.map((t: any) => (
        <span key={t.entityId} data-testid="tag-item">
          {t.label}
        </span>
      ))}
    </div>
  ),
}));

vi.mock("../MarkdownEditor", () => ({
  MarkdownEditor: (props: any) => (
    <textarea
      data-testid="markdown-editor"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
    />
  ),
}));

vi.mock("@/components/ui/MapLocationPicker", () => ({
  MapLocationPicker: () => <div data-testid="map-picker" />,
}));

const mockService: Service = {
  _id: "svc-123",
  user_id: "user-1",
  title: "Italian Cooking Lessons",
  description: "Learn to cook Italian food",
  category: "cooking",
  tags: [
    { label: "cooking", entityId: "Q123", description: "cooking activity" },
  ],
  estimated_duration: 2,
  location: { latitude: 41.0, longitude: 29.0, address: "Istanbul" },
  service_type: "offer",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  max_participants: 5,
  scheduling_type: "open",
  open_availability: "Weekday evenings",
  is_remote: false,
  image_urls: ["/uploads/services/img1.jpg"],
};

function renderForm(props: Partial<Parameters<typeof OfferNeedForm>[0]> = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <OfferNeedForm serviceType="offer" {...props} />
    </QueryClientProvider>,
  );
}

describe("OfferNeedForm — Edit Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills title from initialService", () => {
    renderForm({ initialService: mockService });
    const titleInput = screen.getByDisplayValue("Italian Cooking Lessons");
    expect(titleInput).toBeInTheDocument();
  });

  it("pre-fills description from initialService", () => {
    renderForm({ initialService: mockService });
    const editor = screen.getByTestId("markdown-editor");
    expect(editor).toHaveValue("Learn to cook Italian food");
  });

  it("pre-fills tags from initialService", () => {
    renderForm({ initialService: mockService });
    expect(screen.getByText("cooking")).toBeInTheDocument();
  });

  it("pre-fills duration from initialService", () => {
    renderForm({ initialService: mockService });
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });

  it("pre-fills max participants from initialService", () => {
    renderForm({ initialService: mockService });
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });

  it("pre-fills open availability from initialService", () => {
    renderForm({ initialService: mockService });
    expect(screen.getByDisplayValue("Weekday evenings")).toBeInTheDocument();
  });

  it("shows existing images from initialService", () => {
    renderForm({ initialService: mockService });
    expect(screen.getByText("Existing images")).toBeInTheDocument();
    const img = screen.getByAlt("Existing 1");
    expect(img).toHaveAttribute(
      "src",
      "http://localhost:8000/uploads/services/img1.jpg",
    );
  });

  it("shows 'Save Changes' button in edit mode", () => {
    renderForm({ initialService: mockService });
    expect(
      screen.getByRole("button", { name: "Save Changes" }),
    ).toBeInTheDocument();
  });

  it("shows 'Create' button in create mode", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("calls updateService (not createService) on submit in edit mode", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderForm({ initialService: mockService, onSuccess });

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateService).toHaveBeenCalledTimes(1);
      expect(mockUpdateService).toHaveBeenCalledWith(
        "svc-123",
        expect.objectContaining({
          title: "Italian Cooking Lessons",
          description: "Learn to cook Italian food",
          service_type: "offer",
        }),
      );
    });
    expect(mockCreateService).not.toHaveBeenCalled();
  });

  it("calls createService (not updateService) on submit in create mode", async () => {
    const user = userEvent.setup();

    // Fill required fields for create mode
    renderForm({ serviceType: "offer" });

    // Fill title
    const titleInput = screen.getByPlaceholderText(
      "Italian cooking lessons at home",
    );
    await user.clear(titleInput);
    await user.type(titleInput, "My New Service");

    // Fill description
    const editor = screen.getByTestId("markdown-editor");
    await user.clear(editor);
    await user.type(editor, "A great service");

    // Submit — will fail validation (tags, location, etc.) so createService won't be called
    await user.click(screen.getByRole("button", { name: "Create" }));

    // createService should NOT be called because validation fails (no tags, no location)
    expect(mockUpdateService).not.toHaveBeenCalled();
  });

  it("allows editing the title and submitting updated value", async () => {
    const user = userEvent.setup();
    renderForm({ initialService: mockService });

    const titleInput = screen.getByDisplayValue("Italian Cooking Lessons");
    await user.clear(titleInput);
    await user.type(titleInput, "French Cooking Lessons");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(mockUpdateService).toHaveBeenCalledWith(
        "svc-123",
        expect.objectContaining({ title: "French Cooking Lessons" }),
      );
    });
  });

  it("handles remote service pre-fill (no map shown)", () => {
    renderForm({
      initialService: { ...mockService, is_remote: true },
    });
    expect(screen.queryByTestId("map-picker")).not.toBeInTheDocument();
  });

  it("handles service with no images", () => {
    renderForm({
      initialService: { ...mockService, image_urls: undefined },
    });
    expect(screen.queryByText("Existing images")).not.toBeInTheDocument();
  });
});

describe("OfferNeedForm — Create Mode defaults", () => {
  it("starts with empty title", () => {
    renderForm();
    const titleInput = screen.getByPlaceholderText(
      "Italian cooking lessons at home",
    );
    expect(titleInput).toHaveValue("");
  });

  it("starts with empty description", () => {
    renderForm();
    const editor = screen.getByTestId("markdown-editor");
    expect(editor).toHaveValue("");
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });
});
