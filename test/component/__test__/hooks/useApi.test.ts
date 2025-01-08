import { BaseApiError, ErrorKeys } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/api/useApi";
import { act, renderHook, waitFor } from "@testing-library/react";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it, vi } from "vitest";

describe("useApi", () => {
  const mockData = { id: 1, name: "Test Data" };
  const mockError: BaseApiError = {
    _tag: "ApiError" as const,
    key: ErrorKeys.NETWORK_ERROR,
    messages: ["Network Error"],
    status: 500,
  };

  it("should handle successful API call", async () => {
    const successApi = vi.fn(() => TE.right(mockData));
    const { result } = renderHook(() => useApi(successApi));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  it("should handle API error", async () => {
    const errorApi = vi.fn(() => TE.left(mockError));
    const { result } = renderHook(() => useApi(errorApi));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toEqual(mockError);
      expect(errorApi).toHaveBeenCalled();
    });
  });

  it("should handle API call with parameters", async () => {
    const paramApi = vi.fn((id: number, name: string) =>
      TE.right({ id, name })
    );
    const { result } = renderHook(() => useApi(paramApi));

    await act(async () => {
      await result.current.execute(1, "Test Param");
    });

    await waitFor(() => {
      expect(paramApi).toHaveBeenCalledWith(1, "Test Param");
      expect(result.current.data).toEqual({ id: 1, name: "Test Param" });
    });
  });

  it("should reset error state on new API call", async () => {
    const errorApi = vi.fn(() => TE.left(mockError));
    const { result } = renderHook(() => useApi(errorApi));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(errorApi).toHaveBeenCalled();
    });

    const successApi = vi.fn(() => TE.right(mockData));
    const { result: result2 } = renderHook(() => useApi(successApi));

    await act(async () => {
      await result2.current.execute();
    });

    await waitFor(() => {
      expect(result2.current.error).toBeNull();
      expect(result2.current.data).toEqual(mockData);
    });
  });
});
