import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminPanel } from "../AdminPanel";

const mockNavigate = vi.fn();
const mockApiGet = vi.fn();
const mockApiPut = vi.fn();
const mockGetAllTimeBankTransactions = vi.fn();
const mockUpdateUserTimebank = vi.fn();
const mockGetReports = vi.fn();
const mockUpdateReport = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    user: {
      _id: "admin-1",
      username: "admin",
      role: "admin",
      is_active: true,
    },
  }),
}));

vi.mock("@/services/api", () => ({
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    put: (...args: any[]) => mockApiPut(...args),
  },
  usersApi: {
    getAllTimeBankTransactions: (...args: any[]) =>
      mockGetAllTimeBankTransactions(...args),
    updateUserTimebank: (...args: any[]) => mockUpdateUserTimebank(...args),
  },
  reportsApi: {
    getReports: (...args: any[]) => mockGetReports(...args),
    updateReport: (...args: any[]) => mockUpdateReport(...args),
  },
}));

vi.mock("@/components/ui/InterestChip", () => ({
  InterestChip: ({ name }: any) => <span>{name}</span>,
}));

vi.mock("@/components/ui/SettingsPanel", () => ({
  SettingsPanel: () => <div>Mock settings panel</div>,
}));

vi.mock("@radix-ui/react-icons", () => ({
  Pencil1Icon: () => <span>Edit icon</span>,
}));

vi.mock("@radix-ui/themes", () => {
  const passthrough =
    (Tag: keyof JSX.IntrinsicElements) =>
    ({ children, onClick, onChange, value, placeholder, disabled, type, ...props }: any) =>
      (
        <Tag
          onClick={onClick}
          onChange={onChange}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          type={type}
          data-testid={props["data-testid"]}
        >
          {children}
        </Tag>
      );

  const Text = passthrough("span");
  const Button = passthrough("button");
  const Card = passthrough("div");
  const Badge = passthrough("span");
  const Flex = passthrough("div");
  const Grid = passthrough("div");
  const Avatar = ({ fallback }: any) => <span>{fallback}</span>;

  return {
    Text,
    Button,
    Card,
    Badge,
    Flex,
    Grid,
    Avatar,
    TextField: { Root: passthrough("input") },
    Table: {
      Root: passthrough("table"),
      Header: passthrough("thead"),
      Body: passthrough("tbody"),
      Row: passthrough("tr"),
      ColumnHeaderCell: passthrough("th"),
      Cell: passthrough("td"),
    },
    Tabs: {
      Root: ({ children }: any) => <div>{children}</div>,
      List: passthrough("div"),
      Trigger: ({ children }: any) => <button type="button">{children}</button>,
      Content: ({ children }: any) => <div>{children}</div>,
    },
    Dialog: {
      Root: ({ children }: any) => <div>{children}</div>,
      Content: passthrough("div"),
      Title: passthrough("h2"),
      Close: ({ children }: any) => <>{children}</>,
    },
    Select: {
      Root: ({ children }: any) => <div>{children}</div>,
      Trigger: () => <button type="button">Select trigger</button>,
      Content: passthrough("div"),
      Item: ({ children }: any) => <div>{children}</div>,
    },
  };
});

const activeUser = {
  _id: "user-1",
  username: "alice",
  email: "alice@example.test",
  full_name: "Alice User",
  interests: ["music", "cycling"],
  role: "user",
  is_active: true,
  is_verified: true,
  timebank_balance: 4.5,
};

const bannedUser = {
  _id: "user-2",
  username: "blocked",
  email: "blocked@example.test",
  role: "banned",
  is_active: false,
  is_verified: false,
  timebank_balance: 0,
};

function renderAdminPanel() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminPanel />
    </QueryClientProvider>,
  );
}

describe("AdminPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/users/") {
        return Promise.resolve({ data: [activeUser, bannedUser] });
      }
      if (url === "/transactions/admin/all") {
        return Promise.resolve({
          data: {
            total: 1,
            transactions: [
              {
                _id: "transaction-12345678",
                service_id: "service-12345678",
                service: { title: "Guitar lessons" },
                provider_id: "provider-12345678",
                provider: { full_name: "Provider User" },
                requester_id: "requester-12345678",
                requester: { username: "requester" },
                timebank_hours: 2,
                status: "completed",
                provider_confirmed: true,
                requester_confirmed: false,
                created_at: "2026-05-01T00:00:00Z",
              },
            ],
          },
        });
      }
      if (url === "/admin/analytics/service-participation") {
        return Promise.resolve({
          data: {
            summary: {
              total_services: 12,
              participation_rate: 75,
              avg_participants_per_service: 2.5,
              total_participants: 30,
            },
            max_participants_service: {
              id: "popular-service-12345678",
              title: "Most Popular Guitar Club",
              participants: 8,
              max_participants: 10,
            },
            join_requests: {
              total: 9,
              pending: 2,
              approved: 6,
              approval_rate: 66,
            },
          },
        });
      }
      if (url === "/admin/failed-transactions?page=1&limit=100") {
        return Promise.resolve({
          data: {
            total: 1,
            failed_transactions: [
              {
                id: "failed-12345678",
                user_id: "user-1",
                user: {
                  full_name: "Alice User",
                  email: "alice@example.test",
                },
                amount: -3,
                description: "Balance adjustment",
                reason: "insufficient_balance",
                user_balance_at_failure: 0.5,
                service_id: "service-87654321",
                service: { title: "Bike repair" },
                error_message: "Insufficient balance",
                created_at: "2026-05-02T00:00:00Z",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    mockApiPut.mockResolvedValue({ data: {} });
    mockGetAllTimeBankTransactions.mockResolvedValue({
      data: {
        total: 1,
        transactions: [
          {
            id: "timebank-12345678",
            user_id: "user-1",
            user: { username: "alice" },
            amount: 2,
            description: "Earned hours",
            service_id: "service-12345678",
            created_at: "2026-05-01T00:00:00Z",
          },
        ],
      },
    });
    mockUpdateUserTimebank.mockResolvedValue({ data: {} });
    mockGetReports.mockResolvedValue({
      data: {
        total: 1,
        reports: [
          {
            _id: "report-1",
            report_type: "user",
            reported_id: "reported-user",
            reported_by: "reporter-user",
            reason: "spam",
            description: "Repeated spam messages",
            status: "pending",
            created_at: "2026-05-03T00:00:00Z",
            updated_at: "2026-05-03T00:00:00Z",
            reported_details: { _id: "reported-user", username: "spammer" },
            reporter_details: { _id: "reporter-user", username: "reporter" },
          },
        ],
      },
    });
    mockUpdateReport.mockResolvedValue({ data: {} });
  });

  it("renders admin analytics, tables, settings, and handles admin actions", async () => {
    const user = userEvent.setup();
    renderAdminPanel();

    expect(await screen.findByText("Manage Users and Transactions")).toBeInTheDocument();
    expect(screen.getByText("Total Services")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Most Popular Guitar Club")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getAllByText("Alice User").length).toBeGreaterThan(0);
    expect(screen.getByText("music")).toBeInTheDocument();
    expect(screen.getAllByText("Guitar lessons").length).toBeGreaterThan(0);
    expect(screen.getByText("Failed TimeBank Transactions")).toBeInTheDocument();
    expect(screen.getByText("Insufficient Balance")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("spammer")).toBeInTheDocument();
    expect(screen.getByText("Mock settings panel")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Edit Role/ })[0]);
    expect(screen.getByText(/Updating role for:/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Update Role" }));
    await waitFor(() =>
      expect(mockApiPut).toHaveBeenCalledWith("/users/user-1/role", {
        role: "user",
      }),
    );

    await user.click(screen.getAllByRole("button", { name: "Edit Balance" })[0]);
    expect(screen.getByText("Update TimeBank Balance")).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("e.g. 5.0"));
    await user.type(screen.getByPlaceholderText("e.g. 5.0"), "6.5");
    await user.click(screen.getByRole("button", { name: "Update Balance" }));
    await waitFor(() =>
      expect(mockUpdateUserTimebank).toHaveBeenCalledWith("user-1", {
        balance: 6.5,
      }),
    );

    await user.click(screen.getByText("spammer"));
    expect(mockNavigate).toHaveBeenCalledWith("/user/reported-user");

    await user.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByText("Review Report")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Add notes..."), "Handled");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockUpdateReport).toHaveBeenCalledWith("report-1", {
        status: "resolved",
        resolution_notes: "Handled",
      }),
    );
  });

  it("shows the loading state while admin data is pending", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    mockGetAllTimeBankTransactions.mockReturnValue(new Promise(() => {}));
    mockGetReports.mockReturnValue(new Promise(() => {}));

    renderAdminPanel();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
