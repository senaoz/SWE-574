import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { BottomNav } from "../BottomNav";

const mockUseUser = vi.fn();

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/components/forms/OfferNeedForm", () => ({
  OfferNeedForm: (props: any) => (
    <div data-testid="offer-need-form">
      <span data-testid="service-type">{props.serviceType}</span>
      <button onClick={props.onSuccess}>Save service</button>
      <button onClick={props.onClose}>Close form</button>
    </div>
  ),
}));

function renderBottomNav(initialPath = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<BottomNav />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing for guests", () => {
    mockUseUser.mockReturnValue({ user: undefined });

    renderBottomNav();

    expect(screen.queryByLabelText("Create Offer or Need")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders primary mobile navigation for authenticated users", () => {
    mockUseUser.mockReturnValue({ user: { _id: "u1", username: "alice" } });

    renderBottomNav("/forum/discussion/123");

    expect(screen.getByLabelText("Create Offer or Need")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Common" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Common" }).className).toContain(
      "text-lime-500",
    );
  });

  it("opens create dialog with need selected by default and can switch to offer", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({ user: { _id: "u1", username: "alice" } });

    renderBottomNav();
    await user.click(screen.getByLabelText("Create Offer or Need"));

    expect(screen.getByText("Need a Service")).toBeInTheDocument();
    expect(screen.getByTestId("service-type")).toHaveTextContent("need");

    await user.click(screen.getByText("Offer a Service"));

    expect(screen.getByTestId("service-type")).toHaveTextContent("offer");
  });

  it("closes the create dialog when the embedded form succeeds", async () => {
    const user = userEvent.setup();
    mockUseUser.mockReturnValue({ user: { _id: "u1", username: "alice" } });

    renderBottomNav();
    await user.click(screen.getByLabelText("Create Offer or Need"));
    expect(screen.getByTestId("offer-need-form")).toBeInTheDocument();

    await user.click(screen.getByText("Save service"));

    expect(screen.queryByTestId("offer-need-form")).not.toBeInTheDocument();
  });
});
