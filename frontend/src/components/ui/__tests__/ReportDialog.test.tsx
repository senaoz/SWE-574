import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReportDialog } from "../ReportDialog";

const mockCreateReport = vi.fn();
const mockGetPendingReport = vi.fn();

vi.mock("@/services/api", () => ({
  reportsApi: {
    createReport: (...args: any[]) => mockCreateReport(...args),
    getPendingReport: (...args: any[]) => mockGetPendingReport(...args),
  },
}));

function renderDialog(props: Partial<Parameters<typeof ReportDialog>[0]> = {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();

  render(
    <QueryClientProvider client={qc}>
      <ReportDialog
        open={true}
        onOpenChange={onOpenChange}
        reportType="service"
        reportedId="svc-1"
        reportedName="Piano Lessons"
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange };
}

describe("ReportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPendingReport.mockResolvedValue({ data: { pending: false } });
    mockCreateReport.mockResolvedValue({ data: { _id: "report-1" } });
  });

  it("checks for an existing pending report and renders the form", async () => {
    renderDialog();

    expect(screen.getByText("Checking existing reports...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Reporting:")).toBeInTheDocument();
      expect(screen.getByText("Piano Lessons")).toBeInTheDocument();
    });
    expect(mockGetPendingReport).toHaveBeenCalledWith({
      report_type: "service",
      reported_id: "svc-1",
    });
  });

  it("shows a pending-report message when the user already reported the target", async () => {
    mockGetPendingReport.mockResolvedValue({
      data: { pending: true, report_id: "report-1" },
    });

    renderDialog({ reportType: "user", reportedName: "Alice" });

    await waitFor(() => {
      expect(screen.getByText(/already have a pending report/i)).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Submit Report" })).not.toBeInTheDocument();
  });

  it("submits a report and shows the success state", async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit Report" })).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText("Describe the issue..."), "Looks like spam");
    await user.click(screen.getByRole("button", { name: "Submit Report" }));

    await waitFor(() => {
      expect(mockCreateReport).toHaveBeenCalledWith({
        report_type: "service",
        reported_id: "svc-1",
        reason: "inappropriate",
        description: "Looks like spam",
      });
      expect(
        screen.getByText(/Your report has been submitted/i),
      ).toBeInTheDocument();
    });
  });

  it("renders mutation errors and resets state on close", async () => {
    const user = userEvent.setup();
    const error = new Error("Report failed");
    mockCreateReport.mockRejectedValue(error);
    const { onOpenChange } = renderDialog();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit Report" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Submit Report" }));

    await waitFor(() => {
      expect(screen.getByText("Report failed")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
