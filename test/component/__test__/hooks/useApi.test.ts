// test/component/__test__/hooks/useApi.test.ts
import { apiClient, useApi } from "@/lib/hooks/api/useApi";
import { waitFor } from "@test/component/config/test-util";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

describe("useApi", () => {
  it("should handle successful GET request", async () => {
    const getUser = () => apiClient.request("get", "users/1", UserSchema);
    const { result } = renderHook(() => useApi<User, []>(getUser));

    await act(async () => {
      await result.current.execute();
    });

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

    const createUser = (data: CreateUserInput) =>
      apiClient.request("post", "users", UserSchema, { json: data });

    const { result } = renderHook(() =>
      useApi<User, [CreateUserInput]>(createUser)
    );

    await act(async () => {
      await result.current.execute(newUser);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: 3,
        name: "New User",
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it("should handle error states", async () => {
    const getErrorUser = () =>
      apiClient.request("get", "users/error", UserSchema);

    const { result } = renderHook(() => useApi<User, []>(getErrorUser));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.key).toBe("NETWORK_ERROR");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle initial data", async () => {
    const initialUser: User = {
      id: 1,
      name: "Initial User",
    };

    const getUser = () => apiClient.request("get", "users/1", UserSchema);
    const { result } = renderHook(() => useApi<User, []>(getUser, initialUser));

    expect(result.current.data).toEqual(initialUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
