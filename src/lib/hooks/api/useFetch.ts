import { generateCacheKey, useDataStore } from "@/lib/api/cache";
import { RequestOptions } from "@/lib/api/types";
import { useCallback, useEffect } from "react";
import { z } from "zod";
import { apiClient, useApi } from "./useApi";

type UseFetchOptions = RequestOptions & {
  noCache?: boolean;
  revalidate?: boolean;
  ttl?: number;
  enabled?: boolean;
};

export const useFetch = <T>(
  url: string,
  schema: z.ZodType<T>,
  options?: UseFetchOptions
) => {
  const { cache } = useDataStore();
  const key = generateCacheKey(url, options?.params);
  const cachedData = cache[key]?.data as T | undefined;

  const {
    data,
    isLoading,
    error,
    execute: fetchData,
  } = useApi(() => apiClient.request("get", url, schema, options), cachedData);

  useEffect(() => {
    if (options?.enabled !== false && (!data || options?.revalidate)) {
      fetchData();
    }
  }, [url, data, fetchData, options?.enabled, options?.revalidate]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const invalidateCache = useCallback(() => {
    useDataStore.getState().invalidateCache(key);
    refetch();
  }, [key, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidateCache,
  };
};
