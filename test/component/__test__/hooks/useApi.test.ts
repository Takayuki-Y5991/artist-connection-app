/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiError, ErrorKeys } from "@/lib/api/types";
import { useApi } from "@/lib/hooks/api/useApi";
import { renderHook } from "@testing-library/react";
import * as TE from "fp-ts/TaskEither";
import { describe, expect, it, vi } from "vitest";

// カスタムwaitFor関数
const waitForNextUpdate = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe("useApi", () => {
  const mockData = { id: 1, name: "Test Data" };
  const mockError: BaseApiError = {
    _tag: "ApiError",
    key: ErrorKeys.NETWORK_ERROR,
    messages: ["Network Error"],
    status: 500,
  };

  // 制御可能なPromise生成関数
  const createControlledPromise = <T>() => {
    let resolve: (value: T) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
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
    const { promise, resolve } = createControlledPromise<typeof mockData>();
    const successApi = vi.fn(() =>
      TE.tryCatch(
        () => promise,
        () => mockError
      )
    );

    const { result } = renderHook(() => useApi(successApi));

    const executePromise = result.current.execute();
    await waitForNextUpdate();

    // ローディング状態の確認
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    // 成功レスポンスの送信
    resolve(mockData);
    await executePromise;
    await waitForNextUpdate();

    // 最終状態の確認
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle API error", async () => {
    const { promise, reject } = createControlledPromise<typeof mockData>();
    const errorApi = vi.fn(() =>
      TE.tryCatch(
        () => promise,
        () => mockError
      )
    );

    const { result } = renderHook(() => useApi(errorApi));

    const executePromise = result.current.execute().catch(() => {});
    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    reject(new Error("API Error"));
    await executePromise;
    await waitForNextUpdate();

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it("should handle API call with parameters", async () => {
    const { promise, resolve } = createControlledPromise<{
      id: number;
      name: string;
    }>();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const paramApi = vi.fn((id: number, name: string) =>
      TE.tryCatch(
        () => promise,
        () => mockError
      )
    );

    const { result } = renderHook(() => useApi(paramApi));

    const executePromise = result.current.execute(1, "Test Param");
    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(true);

    resolve({ id: 1, name: "Test Param" });
    await executePromise;
    await waitForNextUpdate();

    expect(paramApi).toHaveBeenCalledWith(1, "Test Param");
    expect(result.current.data).toEqual({ id: 1, name: "Test Param" });
  });

  it("should reset error state on new API call", async () => {
    const { promise, reject } = createControlledPromise<typeof mockData>();
    const errorApi = vi.fn(() =>
      TE.tryCatch(
        () => promise,
        () => mockError
      )
    );

    const { result } = renderHook(() => useApi(errorApi));

    // First call - generate error
    const firstPromise = result.current.execute().catch(() => {});
    await waitForNextUpdate();
    reject(new Error("API Error"));
    await firstPromise;
    await waitForNextUpdate();

    expect(result.current.error).toEqual(mockError);

    // Second call - should reset error
    const { promise: promise2, resolve: resolve2 } =
      createControlledPromise<typeof mockData>();
    errorApi.mockImplementationOnce(() =>
      TE.tryCatch(
        () => promise2,
        () => mockError
      )
    );

    const secondPromise = result.current.execute();
    await waitForNextUpdate();

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);

    resolve2(mockData);
    await secondPromise;
  });
});
