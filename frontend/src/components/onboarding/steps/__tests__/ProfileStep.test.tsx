import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileStep } from "../ProfileStep";

const mockUploadProfilePicture = vi.fn();

vi.mock("@/services/api", () => ({
  uploadApi: {
    uploadProfilePicture: (...args: any[]) => mockUploadProfilePicture(...args),
  },
}));

vi.mock("@/constants/profilePicturePresets", () => ({
  PROFILE_PICTURE_PRESETS: [
    { id: "p1", url: "/presets/p1.png", name: "Avatar 1" },
    { id: "p2", url: "/presets/p2.png", name: "Avatar 2" },
  ],
}));

const defaultProps = {
  bio: "",
  profilePicture: "",
  socialLinks: {},
  onUpdate: vi.fn(),
};

describe("ProfileStep", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading", () => {
    render(<ProfileStep {...defaultProps} />);
    expect(screen.getByText(/make it yours/i)).toBeInTheDocument();
  });

  it("renders bio textarea", () => {
    render(<ProfileStep {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(/tell the community about yourself/i),
    ).toBeInTheDocument();
  });

  it("calls onUpdate with bio when bio textarea changes", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<ProfileStep {...defaultProps} onUpdate={onUpdate} />);
    await user.type(
      screen.getByPlaceholderText(/tell the community about yourself/i),
      "Hello",
    );
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ bio: expect.any(String) }));
  });

  it("renders avatar preset buttons", () => {
    render(<ProfileStep {...defaultProps} />);
    expect(screen.getByTitle("Avatar 1")).toBeInTheDocument();
    expect(screen.getByTitle("Avatar 2")).toBeInTheDocument();
  });

  it("calls onUpdate with profile_picture when preset is clicked", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<ProfileStep {...defaultProps} onUpdate={onUpdate} />);
    await user.click(screen.getByTitle("Avatar 1"));
    expect(onUpdate).toHaveBeenCalledWith({ profile_picture: "/presets/p1.png" });
  });

  it("shows 'Social links (optional)' toggle", () => {
    render(<ProfileStep {...defaultProps} />);
    expect(screen.getByText(/social links/i)).toBeInTheDocument();
  });

  it("expands social links section on toggle click", async () => {
    const user = userEvent.setup();
    render(<ProfileStep {...defaultProps} />);
    await user.click(screen.getByText(/social links/i));
    expect(screen.getByPlaceholderText(/linkedin.com/i)).toBeInTheDocument();
  });

  it("collapses social links section on second click", async () => {
    const user = userEvent.setup();
    render(<ProfileStep {...defaultProps} />);
    await user.click(screen.getByText(/social links/i));
    await user.click(screen.getByText(/social links/i));
    expect(screen.queryByPlaceholderText(/linkedin.com/i)).not.toBeInTheDocument();
  });

  it("calls onUpdate with social_links when LinkedIn input changes", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    render(<ProfileStep {...defaultProps} onUpdate={onUpdate} />);
    await user.click(screen.getByText(/social links/i));
    await user.type(
      screen.getByPlaceholderText(/linkedin.com/i),
      "https://linkedin.com/in/alice",
    );
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ social_links: expect.objectContaining({ linkedin: expect.any(String) }) }),
    );
  });

  it("shows 'Or upload your own photo' link", () => {
    render(<ProfileStep {...defaultProps} />);
    expect(screen.getByText(/or upload your own photo/i)).toBeInTheDocument();
  });

  it("uploads file and calls onUpdate on file selection", async () => {
    mockUploadProfilePicture.mockResolvedValue({ data: { url: "/uploads/pic.jpg" } });
    const onUpdate = vi.fn();
    render(<ProfileStep {...defaultProps} onUpdate={onUpdate} />);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await waitFor(() => {
      expect(mockUploadProfilePicture).toHaveBeenCalledWith(file);
    });
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({ profile_picture: "/uploads/pic.jpg" });
    });
  });
});
