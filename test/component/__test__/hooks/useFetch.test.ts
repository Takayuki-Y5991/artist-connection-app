import { useDataStore } from "@/lib/api/cache";
import { BaseApiError, ErrorKeys } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/api/useApi";
import { useFetch } from "@/lib/hooks/api/useFetch";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// モックの設定
vi.mock("@/lib/hooks/api/useApi", () => ({
  apiClient: {
    request: vi.fn(),
  },
  useApi: vi.fn().mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    execute: vi.fn(),
  }),
}));

const defaultMockApi = {
  data: undefined,
  isLoading: false,
  error: null,
  execute: vi.fn(),
};

describe("useFetch", () => {
  const testUrl = "/api/test";
  const testSchema = z.object({
    id: z.number(),
    name: z.string(),
  });

  const mockData = { id: 1, name: "Test Data" };
  const mockError: BaseApiError = {
    _tag: "ApiError" as const,
    key: ErrorKeys.NETWORK_ERROR,
    messages: ["Network Error"],
    status: 500,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useDataStore.getState().clearCache();
    vi.mocked(useApi).mockReturnValue(defaultMockApi);
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useFetch(testUrl, testSchema));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should fetch data on mount when enabled", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockData));
    const mockApi = {
      ...defaultMockApi,
      data: undefined, // 初期値はundefined
      execute: mockExecute,
    };
    vi.mocked(useApi).mockReturnValue(mockApi);

    renderHook(() => useFetch(testUrl, testSchema));

    await waitFor(
      () => {
        expect(mockExecute).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it("should not fetch data when enabled is false", () => {
    const mockExecute = vi.fn().mockResolvedValue(mockData);
    vi.mocked(useApi).mockReturnValue({
      ...defaultMockApi,
      data: undefined,
      execute: mockExecute,
    });

    renderHook(() => useFetch(testUrl, testSchema, { enabled: false }));

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("should use cached data when available", () => {
    const cachedData = { id: 2, name: "Cached Data" };
    useDataStore.setState({
      cache: {
        [testUrl]: { data: cachedData, fetchedAt: Date.now() },
      },
    });

    const mockExecute = vi.fn().mockResolvedValue(mockData);
    vi.mocked(useApi).mockReturnValue({
      ...defaultMockApi,
      data: cachedData,
      execute: mockExecute,
    });

    const { result } = renderHook(() => useFetch(testUrl, testSchema));

    expect(result.current.data).toEqual(cachedData);
  });

  it("should revalidate when revalidate option is true", async () => {
    const cachedData = { id: 2, name: "Cached Data" };
    useDataStore.setState({
      cache: {
        [testUrl]: { data: cachedData, fetchedAt: Date.now() },
      },
    });

    const mockExecute = vi.fn().mockResolvedValue(mockData);
    vi.mocked(useApi).mockReturnValue({
      ...defaultMockApi,
      data: mockData,
      execute: mockExecute,
    });

    renderHook(() => useFetch(testUrl, testSchema, { revalidate: true }));

    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  it("should refetch data when refetch is called", async () => {
    const mockExecute = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockData));
    const mockApi = {
      ...defaultMockApi,
      data: undefined,
      execute: mockExecute,
    };
    vi.mocked(useApi).mockReturnValue(mockApi);

    const { result } = renderHook(() => useFetch(testUrl, testSchema));

    // 初期フェッチの実行を待つ
    await waitFor(
      () => {
        expect(mockExecute).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // refetchを実行
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it("should invalidate cache when invalidateCache is called", async () => {
    const cachedData = { id: 2, name: "Cached Data" };
    useDataStore.setState({
      cache: {
        [testUrl]: { data: cachedData, fetchedAt: Date.now() },
      },
    });

    const mockExecute = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockData));
    const mockApi = {
      ...defaultMockApi,
      data: cachedData,
      execute: mockExecute,
    };
    vi.mocked(useApi).mockReturnValue(mockApi);

    const { result } = renderHook(() => useFetch(testUrl, testSchema));

    // 初期フェッチの実行を待つ
    await waitFor(
      () => {
        expect(mockExecute).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    // キャッシュを無効化
    await act(async () => {
      await result.current.invalidateCache();
    });

    expect(useDataStore.getState().cache[testUrl]).toBeUndefined();
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  it("should handle error states", async () => {
    const mockExecute = vi.fn().mockRejectedValue(mockError);
    vi.mocked(useApi).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      execute: mockExecute,
    });

    const { result } = renderHook(() => useFetch(testUrl, testSchema));

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });
  });
});
