import { BaseApiError, ErrorKeys } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/api/useApi";
import { renderHook, waitFor } from "@testing-library/react";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it, vi } from "vitest";

describe("useApi", () => {
  const mockData = { id: 1, name: "Test Data" };
  const mockError: BaseApiError = {
    _tag: "ApiError",
    key: ErrorKeys.NETWORK_ERROR,
    messages: ["Network Error"],
    status: 500,
  };

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useApi(() => TE.right(mockData)));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should initialize with initial data", () => {
    const initialData = { id: 2, name: "Initial" };
    const { result } = renderHook(() =>
      useApi(() => TE.right(mockData), initialData)
    );
    expect(result.current.data).toEqual(initialData);
  });

  it("should handle successful API call", async () => {
    const successApi = vi.fn(() => TE.right(mockData));
    const { result } = renderHook(() => useApi(successApi));

    result.current.execute();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("should handle API error", async () => {
    const errorApi = vi.fn(() => TE.left(mockError));
    const { result } = renderHook(() => useApi(errorApi));

    result.current.execute().catch(() => {});

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toEqual(mockError);
  });

  it("should handle API call with parameters", async () => {
    const paramApi = vi.fn(
      (id: number, name: string) => TE.right({ id, name }) // パラメータを使用するように修正
    );
    const { result } = renderHook(() => useApi(paramApi));

    result.current.execute(1, "Test Param");

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(paramApi).toHaveBeenCalledWith(1, "Test Param");
    expect(result.current.data).toEqual({ id: 1, name: "Test Param" });
  });

  it("should reset error state on new API call", async () => {
    let api = vi.fn(() => TE.left(mockError));

    const { result } = renderHook(() => useApi(api));

    // First call - generate error
    result.current.execute().catch(() => {});
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toEqual(mockError);

    // Second call - should reset error
    api = vi.fn(() => TE.right(mockData));
    const { result: result2 } = renderHook(() => useApi(api));
    result2.current.execute();
    await waitFor(() => expect(result2.current.isLoading).toBe(false));
    expect(result2.current.error).toBeNull();
  });
});
