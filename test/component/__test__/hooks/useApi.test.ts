import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiClient, useApi } from "./../../../../src/lib/hooks/api/useApi";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

describe("useApi", () => {
  it("should handle successful GET request", async () => {
    // API関数を定義
    const getUser = () => apiClient.request("get", "/users/1", UserSchema);

    const { result } = renderHook(() => useApi<User, []>(getUser));

    result.current.execute();

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: 1,
        name: "Test User 1",
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it("should handle POST request with data", async () => {
    type CreateUserInput = { name: string };
    const newUser = { name: "New User" };

    // POST用のAPI関数を定義
    const createUser = (data: CreateUserInput) =>
      apiClient.request("post", "/users", UserSchema, { json: data });

    const { result } = renderHook(() =>
      useApi<User, [CreateUserInput]>(createUser)
    );

    result.current.execute(newUser);

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: 3,
        name: "New User",
      });
    });
  });

  it("should handle error states", async () => {
    // エラーを返すAPI関数
    const getErrorUser = () =>
      apiClient.request("get", "/users/error", UserSchema);

    const { result } = renderHook(() => useApi<User, []>(getErrorUser));

    result.current.execute();

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle initial data", async () => {
    const initialUser: User = {
      id: 1,
      name: "Initial User",
    };

    const getUser = () => apiClient.request("get", "/users/1", UserSchema);

    const { result } = renderHook(() => useApi<User, []>(getUser, initialUser));

    expect(result.current.data).toEqual(initialUser);
  });
});
