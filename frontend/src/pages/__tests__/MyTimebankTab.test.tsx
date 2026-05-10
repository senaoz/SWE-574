import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Theme } from "@radix-ui/themes";
import type { TimeBankResponse } from "@/types";
import { MyTimebankTab } from "../MyTimebankTab";

function renderTab(props: {
  timebankData: TimeBankResponse | null;
  timebankLoading: boolean;
}) {
  return render(
    <Theme>
      <MemoryRouter>
        <MyTimebankTab {...props} />
      </MemoryRouter>
    </Theme>,
  );
}

describe("MyTimebankTab", () => {
  it("shows loading and empty transaction states", () => {
    renderTab({ timebankData: null, timebankLoading: true });
    expect(screen.getByText("Loading transaction logs...")).toBeInTheDocument();
  });

  it("renders transaction logs and offer/need totals", () => {
    const timebankData: TimeBankResponse = {
      balance: 3,
      max_balance: 10,
      can_earn: true,
      requires_need_creation: false,
      effective_max_balance: 10,
      effective_min_balance: -5,
      transactions: [
        {
          id: "tb-1",
          user_id: "user-1",
          amount: 2,
          description: "Piano lesson completed",
          service_id: "service-1",
          created_at: new Date().toISOString(),
        },
        {
          id: "tb-2",
          user_id: "user-1",
          amount: -1.5,
          description: "Garden help received",
          created_at: new Date().toISOString(),
        },
      ],
    };

    renderTab({ timebankData, timebankLoading: false });

    expect(
      screen.getByRole("heading", { name: /Offer \/ Need/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Piano lesson completed" })).toHaveAttribute(
      "href",
      "/service/service-1",
    );
    expect(screen.getByText("Garden help received")).toBeInTheDocument();
    expect(screen.getByText("+2.0 hours")).toBeInTheDocument();
    expect(screen.getByText("-1.5 hours")).toBeInTheDocument();
  });

  it("shows an empty message when there are no logs", () => {
    renderTab({
      timebankLoading: false,
      timebankData: {
        balance: 0,
        max_balance: 10,
        can_earn: true,
        effective_max_balance: 10,
        effective_min_balance: -5,
        transactions: [],
      },
    });

    expect(
      screen.getByText(/No TimeBank transactions yet/),
    ).toBeInTheDocument();
  });
});
