import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Footer } from "../Footer";
import { Layout } from "../Layout";
import { ScrollToTop } from "../../ScrollToTop";

vi.mock("../Header", () => ({
  Header: () => <header>Mock Header</header>,
}));

describe("Layout and Footer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the header, main content, and footer copy", () => {
    render(
      <>
        <Layout>
          <section>Dashboard content</section>
        </Layout>
        <Footer />
      </>,
    );

    expect(screen.getByText("Mock Header")).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${new Date().getFullYear()} The Hive`)),
    ).toBeInTheDocument();
  });

  it("scrolls to top on route render", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", {
      value: scrollTo,
      writable: true,
    });
    Object.defineProperty(window.history, "scrollRestoration", {
      value: "auto",
      writable: true,
      configurable: true,
    });
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ScrollToTop />
      </MemoryRouter>,
    );

    expect(window.history.scrollRestoration).toBe("manual");
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
