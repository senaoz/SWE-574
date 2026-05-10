import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "../Layout";

vi.mock("../Header", () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

function renderLayout(children: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Layout>{children}</Layout>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Layout", () => {
  it("renders the Header", () => {
    renderLayout(<div>content</div>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders children inside main", () => {
    renderLayout(<p>Page Content</p>);
    expect(screen.getByText("Page Content")).toBeInTheDocument();
  });

  it("renders children inside a main element", () => {
    renderLayout(<span>child</span>);
    const main = document.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent("child");
  });
});
