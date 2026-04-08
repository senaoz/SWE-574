import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegisterForm } from "../RegisterForm";

const mockNavigate = vi.fn();
const mockSetAuthToken = vi.fn();
const mockRegister = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({ setAuthToken: mockSetAuthToken }),
}));

vi.mock("@/services/api", () => ({
  authApi: { register: (...args: any[]) => mockRegister(...args) },
}));

function renderForm() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Choose a username"), "alice123");
  await user.type(
    screen.getByPlaceholderText("Enter your email"),
    "alice@example.com",
  );
  await user.type(
    screen.getByPlaceholderText("Create a strong password"),
    "Password1!",
  );
  await user.type(
    screen.getByPlaceholderText("Confirm your password"),
    "Password1!",
  );
  await user.type(
    screen.getByPlaceholderText("Tell us about yourself (optional)"),
    "I am here",
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders all required fields", () => {
    renderForm();
    expect(
      screen.getByPlaceholderText("Choose a username"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Create a strong password"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Confirm your password"),
    ).toBeInTheDocument();
  });

  it("shows username required error on empty submit", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: "Create Account" }));
    await waitFor(() => {
      expect(screen.getByText("Username is required")).toBeInTheDocument();
    });
  });

  it("shows username too short error", async () => {
    const user = userEvent.setup();
    renderForm();
    // Fill all required fields so Radix Form allows submission, but use a short username
    await user.type(screen.getByPlaceholderText("Choose a username"), "ab");
    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "alice@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("Create a strong password"),
      "Password1!",
    );
    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "Password1!",
    );
    // Submit via fireEvent to bypass any native validation quirks
    const btn = screen.getByRole("button", { name: "Create Account" });
    fireEvent.submit(btn.closest("form")!);
    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 3 characters"),
      ).toBeInTheDocument();
    });
  });

  it("shows email required error", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(
      screen.getByPlaceholderText("Choose a username"),
      "alice123",
    );
    await user.click(screen.getByRole("button", { name: "Create Account" }));
    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  it("shows password mismatch error", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(
      screen.getByPlaceholderText("Choose a username"),
      "alice123",
    );
    await user.type(
      screen.getByPlaceholderText("Enter your email"),
      "alice@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("Create a strong password"),
      "Password1!",
    );
    await user.type(
      screen.getByPlaceholderText("Confirm your password"),
      "Different1!",
    );
    await user.click(screen.getByRole("button", { name: "Create Account" }));
    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("calls authApi.register with correct payload on valid submit", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({
      data: { access_token: "tok", user: { _id: "u1", username: "alice123" } },
    });
    renderForm();
    await fillValidForm(user);
    const btn = screen.getByRole("button", { name: "Create Account" });
    fireEvent.submit(btn.closest("form")!);
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
    expect(mockRegister.mock.calls[0][0]).toMatchObject({
      username: "alice123",
      email: "alice@example.com",
      password: "Password1!",
    });
  });

  it("stores token and navigates to dashboard on success", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({
      data: {
        access_token: "my-token",
        user: { _id: "u1", username: "alice123" },
      },
    });
    renderForm();
    await fillValidForm(user);
    const btn = screen.getByRole("button", { name: "Create Account" });
    fireEvent.submit(btn.closest("form")!);
    await waitFor(() => {
      expect(localStorage.getItem("access_token")).toBe("my-token");
      expect(mockSetAuthToken).toHaveBeenCalledWith(true);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows duplicate email error from server", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue({
      response: { data: { detail: "Email already registered" } },
    });
    renderForm();
    await fillValidForm(user);
    const btn = screen.getByRole("button", { name: "Create Account" });
    fireEvent.submit(btn.closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeInTheDocument();
    });
  });

  it("shows duplicate username error from server", async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue({
      response: { data: { detail: "Username already taken" } },
    });
    renderForm();
    await fillValidForm(user);
    const btn = screen.getByRole("button", { name: "Create Account" });
    fireEvent.submit(btn.closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Username already taken")).toBeInTheDocument();
    });
  });
});
