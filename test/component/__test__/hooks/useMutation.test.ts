import { BaseApiError, ErrorKeys } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/api/useApi";
import { useMutation } from "@/lib/hooks/api/useMutation";
import { act, renderHook } from "@testing-library/react";
import * as TE from "fp-ts/TaskEither";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/lib/hooks/api/useApi", () => ({
  apiClient: {
    request: vi.fn(),
  },
  useApi: vi.fn(),
}));

describe("useMutation", () => {
  const testUrl = "/api/test";
  const testSchema = z.object({
    id: z.number(),
    name: z.string(),
  });

  type TestData = z.infer<typeof testSchema>;
  type MutationData = Partial<TestData>;

  const mockData: TestData = { id: 1, name: "Test Data" };
  const mockError: BaseApiError = {
    _tag: "ApiError" as const,
    key: ErrorKeys.NETWORK_ERROR,
    messages: ["Network Error"],
    status: 500,
  };

  const defaultMockApi = {
    data: undefined as TestData | undefined,
    isLoading: false,
    error: null as BaseApiError | null,
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useApi).mockReturnValue(defaultMockApi);
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() =>
      useMutation<TestData, MutationData>("post", testUrl, testSchema)
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("should handle successful mutation", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(() => Promise.resolve(TE.right(mockData)));

    vi.mocked(useApi).mockReturnValue({
      ...defaultMockApi,
      data: mockData,
      execute: mockExecute,
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useMutation<TestData, MutationData>("post", testUrl, testSchema, {
        onSuccess,
      })
    );

    await act(async () => {
      await result.current.mutate({ name: "New Test" });
    });

    expect(mockExecute).toHaveBeenCalledWith({ name: "New Test" });
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("should handle error in mutation", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(() => Promise.resolve(TE.left(mockError)));

    vi.mocked(useApi).mockReturnValue({
      ...defaultMockApi,
      error: mockError,
      execute: mockExecute,
    });

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useMutation<TestData, MutationData>("post", testUrl, testSchema, {
        onError,
      })
    );

    await act(async () => {
      await result.current.mutate({ name: "Test" });
    });

    expect(mockExecute).toHaveBeenCalled();
    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle loading state during mutation", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(TE.right(mockData)), 0)
          )
      );

    const mockApi = {
      ...defaultMockApi,
      isLoading: true,
      execute: mockExecute,
    };

    vi.mocked(useApi).mockReturnValue(mockApi);

    const { result } = renderHook(() =>
      useMutation<TestData, MutationData>("post", testUrl, testSchema)
    );

    act(() => {
      void result.current.mutate({ name: "Test" });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("should pass additional options to request", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(() => Promise.resolve(TE.right(mockData)));

    vi.mocked(useApi).mockReturnValue({
      ...defaultMockApi,
      execute: mockExecute,
    });

    const additionalOptions = {
      headers: { "X-Custom-Header": "value" },
    };

    const { result } = renderHook(() =>
      useMutation<TestData, MutationData>(
        "post",
        testUrl,
        testSchema,
        additionalOptions
      )
    );

    await act(async () => {
      await result.current.mutate({ name: "Test" });
    });

    expect(mockExecute).toHaveBeenCalled();
  });

  it("should support different HTTP methods", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(() => Promise.resolve(TE.right(mockData)));

    vi.mocked(useApi).mockReturnValue({
      ...defaultMockApi,
      execute: mockExecute,
    });

    const methods = ["post", "put", "patch", "delete"] as const;

    for (const method of methods) {
      const { result } = renderHook(() =>
        useMutation<TestData, MutationData>(method, testUrl, testSchema)
      );

      await act(async () => {
        await result.current.mutate({ name: "Test" });
      });

      expect(mockExecute).toHaveBeenCalled();
    }
  });
});
