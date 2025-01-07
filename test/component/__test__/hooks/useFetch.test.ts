// import { useDataStore } from "@/lib/api/cache";
// import { BaseApiError, ErrorKeys } from "@/lib/api/types";
// import { useApi } from "@/lib/hooks/api/useApi";
// import { act, renderHook, waitFor } from "@testing-library/react";
// import { beforeEach, describe, expect, it, vi } from "vitest";
// import { z } from "zod";
// import { useFetch } from "./useFetch";

// // Mock the API client
// vi.mock("./useApi", () => ({
//   apiClient: {
//     request: vi.fn(),
//   },
//   useApi: vi.fn(),
// }));

// describe("useFetch", () => {
//   const testUrl = "/api/test";
//   const testSchema = z.object({
//     id: z.number(),
//     name: z.string(),
//   });

//   const mockData = { id: 1, name: "Test Data" };
//   const mockError: BaseApiError = {
//     _tag: "ApiError",
//     key: ErrorKeys.NETWORK_ERROR,
//     messages: ["Network Error"],
//     status: 500,
//   };

//   beforeEach(() => {
//     vi.clearAllMocks();
//     // Clear cache
//     useDataStore.getState().clearCache();
//   });

//   it("should initialize with default state", () => {
//     const { result } = renderHook(() => useFetch(testUrl, testSchema));

//     expect(result.current.data).toBeUndefined();
//     expect(result.current.isLoading).toBe(false);
//     expect(result.current.error).toBeNull();
//   });

//   it("should fetch data on mount when enabled", async () => {
//     const mockExecute = vi.fn(() => Promise.resolve(mockData));
//     vi.mocked(useApi).mockReturnValue({
//       data: mockData,
//       isLoading: false,
//       error: null,
//       execute: mockExecute,
//     });

//     renderHook(() => useFetch(testUrl, testSchema));

//     await waitFor(() => {
//       expect(mockExecute).toHaveBeenCalled();
//     });
//   });

//   it("should not fetch data when enabled is false", () => {
//     const mockExecute = vi.fn();
//     vi.mocked(useApi).mockReturnValue({
//       data: undefined,
//       isLoading: false,
//       error: null,
//       execute: mockExecute,
//     });

//     renderHook(() => useFetch(testUrl, testSchema, { enabled: false }));

//     expect(mockExecute).not.toHaveBeenCalled();
//   });

//   it("should use cached data when available", () => {
//     const cachedData = { id: 2, name: "Cached Data" };
//     useDataStore.getState().setCache("/api/test", cachedData);

//     const { result } = renderHook(() => useFetch(testUrl, testSchema));

//     expect(result.current.data).toEqual(cachedData);
//   });

//   it("should revalidate when revalidate option is true", async () => {
//     const cachedData = { id: 2, name: "Cached Data" };
//     useDataStore.getState().setCache("/api/test", cachedData);

//     const mockExecute = vi.fn(() => Promise.resolve(mockData));
//     vi.mocked(useApi).mockReturnValue({
//       data: mockData,
//       isLoading: false,
//       error: null,
//       execute: mockExecute,
//     });

//     renderHook(() => useFetch(testUrl, testSchema, { revalidate: true }));

//     await waitFor(() => {
//       expect(mockExecute).toHaveBeenCalled();
//     });
//   });

//   it("should refetch data when refetch is called", async () => {
//     const mockExecute = vi.fn(() => Promise.resolve(mockData));
//     vi.mocked(useApi).mockReturnValue({
//       data: mockData,
//       isLoading: false,
//       error: null,
//       execute: mockExecute,
//     });

//     const { result } = renderHook(() => useFetch(testUrl, testSchema));

//     await act(async () => {
//       result.current.refetch();
//     });

//     expect(mockExecute).toHaveBeenCalledTimes(2); // Initial fetch + refetch
//   });

//   it("should invalidate cache when invalidateCache is called", async () => {
//     const cachedData = { id: 2, name: "Cached Data" };
//     useDataStore.getState().setCache("/api/test", cachedData);

//     const mockExecute = vi.fn(() => Promise.resolve(mockData));
//     vi.mocked(useApi).mockReturnValue({
//       data: mockData,
//       isLoading: false,
//       error: null,
//       execute: mockExecute,
//     });

//     const { result } = renderHook(() => useFetch(testUrl, testSchema));

//     await act(async () => {
//       result.current.invalidateCache();
//     });

//     expect(useDataStore.getState().cache["/api/test"]).toBeUndefined();
//     expect(mockExecute).toHaveBeenCalled();
//   });

//   it("should handle error states", async () => {
//     vi.mocked(useApi).mockReturnValue({
//       data: undefined,
//       isLoading: false,
//       error: mockError,
//       execute: vi.fn(() => Promise.reject(mockError)),
//     });

//     const { result } = renderHook(() => useFetch(testUrl, testSchema));

//     await waitFor(() => {
//       expect(result.current.error).toEqual(mockError);
//     });
//   });
// });
