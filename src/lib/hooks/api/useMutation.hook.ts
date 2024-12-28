/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseApiError, HttpMethod, RequestOptions } from "@/lib/api/types";
import { useCallback } from "react";
import { z } from "zod";
import { apiClient, useApi } from "./useApi";

type MutationOptions = RequestOptions & {
  onSuccess?: (data: any) => void;
  onError?: (error: BaseApiError) => void;
};

export const useMutation = <T, D = any>(
  method: Exclude<HttpMethod, "get">,
  url: string,
  schema: z.ZodType<T>,
  options?: MutationOptions
) => {
  const { data, isLoading, error, execute } = useApi<T, [D?]>((data?: D) =>
    apiClient.request(method, url, schema, {
      ...options,
      json: data,
    })
  );

  const mutate = useCallback(
    async (data?: D) => {
      await execute(data);
      options?.onSuccess?.(data);
    },
    [execute, options]
  );

  return {
    data,
    isLoading,
    error,
    mutate,
  };
};
