import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "../LoginForm";

const mockNavigate = vi.fn();
const mockSetAuthToken = vi.fn();
const mockLogin = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({ setAuthToken: mockSetAuthToken }),
}));

vi.mock("@/services/api", () => ({
  authApi: { login: (...args: any[]) => mockLogin(...args) },
}));

function renderForm(setLoginDialogOpen = vi.fn()) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LoginForm setLoginDialogOpen={setLoginDialogOpen} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Submit the form by firing a submit event directly on the form element. */
function submitForm() {
  const btn = screen.getByRole("button", { name: /Login|Logging in/i });
  const form = btn.closest("form");
  if (form) fireEvent.submit(form);
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders email and password fields", () => {
    renderForm();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password"),
    ).toBeInTheDocument();
  });

  it("renders a login button", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("shows email required error on empty submit", async () => {
    renderForm();
    submitForm();
    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  it("shows password required error when password is empty", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "alice@example.com",
    );
    submitForm();
    await waitFor(() => {
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("shows invalid email error for bad format", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "notanemail",
    );
    await user.type(screen.getByPlaceholderText("Enter your password"), "secret");
    submitForm();
    await waitFor(() => {
      expect(screen.getByText("Enter valid email address")).toBeInTheDocument();
    });
  });

  it("calls authApi.login with correct payload on valid submit", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      data: { access_token: "tok", user: { _id: "u1", username: "alice" } },
    });
    renderForm();
    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "alice@example.com",
    );
    await user.type(screen.getByPlaceholderText("Enter your password"), "secret");
    submitForm();
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    expect(mockLogin.mock.calls[0][0]).toMatchObject({
      email: "alice@example.com",
      password: "secret",
    });
  });

  it("stores token and navigates to dashboard on success", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      data: { access_token: "my-token", user: { _id: "u1", username: "alice" } },
    });
    renderForm();
    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "alice@example.com",
    );
    await user.type(screen.getByPlaceholderText("Enter your password"), "secret");
    submitForm();
    await waitFor(() => {
      expect(localStorage.getItem("access_token")).toBe("my-token");
      expect(mockSetAuthToken).toHaveBeenCalledWith(true);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays server error message on failed login", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({
      response: { data: { detail: "Invalid credentials" } },
    });
    renderForm();
    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "alice@example.com",
    );
    await user.type(screen.getByPlaceholderText("Enter your password"), "wrong");
    submitForm();
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });
});
