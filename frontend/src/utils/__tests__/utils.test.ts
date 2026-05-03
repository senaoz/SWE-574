import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cn,
  formatDuration,
  formatDurationShort,
  calculateDistance,
  formatRelativeTime,
  validateEmail,
  validatePassword,
} from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("formatDuration", () => {
  it("returns minutes for values less than 1 hour", () => {
    expect(formatDuration(0.5)).toBe("30 minutes");
  });

  it("returns singular 'minute' for 1/60", () => {
    expect(formatDuration(1 / 60)).toBe("1 minute");
  });

  it("returns '1 hour' for exactly 1", () => {
    expect(formatDuration(1)).toBe("1 hour");
  });

  it("returns plural hours for values greater than 1", () => {
    expect(formatDuration(2)).toBe("2 hours");
    expect(formatDuration(5)).toBe("5 hours");
  });
});

describe("formatDurationShort", () => {
  it("appends h suffix", () => {
    expect(formatDurationShort(2)).toBe("2h");
    expect(formatDurationShort(0.5)).toBe("0.5h");
  });
});

describe("calculateDistance", () => {
  it("returns 0 for identical coordinates", () => {
    expect(calculateDistance(41, 29, 41, 29)).toBe(0);
  });

  it("calculates known distance between Istanbul and Ankara (~350 km)", () => {
    const distance = calculateDistance(41.0082, 28.9784, 39.9334, 32.8597);
    expect(distance).toBeGreaterThan(340);
    expect(distance).toBeLessThan(360);
  });

  it("is symmetric", () => {
    const d1 = calculateDistance(41, 28, 39, 32);
    const d2 = calculateDistance(39, 32, 41, 28);
    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-28T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for less than a minute ago", () => {
    const date = new Date("2026-04-28T11:59:30Z").toISOString();
    expect(formatRelativeTime(date)).toBe("just now");
  });

  it("returns singular minute for exactly 1 minute ago", () => {
    const date = new Date("2026-04-28T11:59:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("1 minute ago");
  });

  it("returns plural minutes for 2-59 minutes ago", () => {
    const date = new Date("2026-04-28T11:45:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("15 minutes ago");
  });

  it("returns singular hour for exactly 1 hour ago", () => {
    const date = new Date("2026-04-28T11:00:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("1 hour ago");
  });

  it("returns plural hours for 2-23 hours ago", () => {
    const date = new Date("2026-04-28T09:00:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("3 hours ago");
  });

  it("returns singular day for exactly 1 day ago", () => {
    const date = new Date("2026-04-27T12:00:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("1 day ago");
  });

  it("returns plural days for 2-6 days ago", () => {
    const date = new Date("2026-04-25T12:00:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("3 days ago");
  });

  it("returns absolute date string for 7+ days ago", () => {
    const date = new Date("2026-04-01T10:00:00Z").toISOString();
    const result = formatRelativeTime(date);
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/2026/);
  });
});

describe("validateEmail", () => {
  it("accepts valid emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("a+b@sub.domain.io")).toBe(true);
  });

  it("rejects emails without @", () => {
    expect(validateEmail("userexample.com")).toBe(false);
  });

  it("rejects emails without domain", () => {
    expect(validateEmail("user@")).toBe(false);
  });

  it("rejects emails with spaces", () => {
    expect(validateEmail("user @example.com")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = validatePassword("Ab1");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/8 characters/);
  });

  it("rejects passwords without an uppercase letter", () => {
    const result = validatePassword("abcdefg1");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/uppercase/i);
  });

  it("rejects passwords without a lowercase letter", () => {
    const result = validatePassword("ABCDEFG1");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/lowercase/i);
  });

  it("rejects passwords without a digit", () => {
    const result = validatePassword("Abcdefgh");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/number/i);
  });

  it("accepts a valid strong password", () => {
    const result = validatePassword("Secure123");
    expect(result.valid).toBe(true);
    expect(result.message).toBe("Password is valid");
  });
});