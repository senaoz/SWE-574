import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSavedServiceIds } from "../useSavedServiceIds";

vi.mock("@/contexts/UserContext", () => ({
  useUser: () => ({
    currentUserId: "user-1",
  }),
}));

vi.mock("@/services/api", () => ({
  servicesApi: {
    getSavedServiceIds: vi.fn(),
    saveService: vi.fn(),
    unsaveService: vi.fn(),
  },
}));

import { servicesApi } from "@/services/api";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useSavedServiceIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks a service as saved immediately on save before the ids query catches up", async () => {
    const initialSavedIds = createDeferred<{ data: { service_ids: string[] } }>();

    vi.mocked(servicesApi.getSavedServiceIds)
      .mockImplementationOnce(() => initialSavedIds.promise as any)
      .mockResolvedValue({ data: { service_ids: ["service-1"] } } as any);
    vi.mocked(servicesApi.saveService).mockResolvedValue({
      data: { message: "saved" },
    } as any);

    const { result } = renderHook(() => useSavedServiceIds(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSaved("service-1")).toBe(false);

    await act(async () => {
      await result.current.saveService("service-1");
    });

    await waitFor(() => {
      expect(result.current.isSaved("service-1")).toBe(true);
    });

    await act(async () => {
      initialSavedIds.resolve({ data: { service_ids: [] } });
      await Promise.resolve();
    });

    expect(result.current.isSaved("service-1")).toBe(true);

    await waitFor(() => {
      expect(result.current.savedServiceIds).toContain("service-1");
    });
  });

  it("marks a service as unsaved immediately on unsave before the ids query refetch completes", async () => {
    vi.mocked(servicesApi.getSavedServiceIds)
      .mockResolvedValueOnce({ data: { service_ids: ["service-1"] } } as any)
      .mockResolvedValue({ data: { service_ids: [] } } as any);
    vi.mocked(servicesApi.unsaveService).mockResolvedValue({
      data: { message: "unsaved" },
    } as any);

    const { result } = renderHook(() => useSavedServiceIds(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSaved("service-1")).toBe(true);
    });

    await act(async () => {
      await result.current.unsaveService("service-1");
    });

    await waitFor(() => {
      expect(result.current.isSaved("service-1")).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.savedServiceIds).not.toContain("service-1");
    });
  });
});
