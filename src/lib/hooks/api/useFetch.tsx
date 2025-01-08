import { generateCacheKey, useDataStore } from "@/lib/api/cache";
import { RequestOptions } from "@/lib/api/types";
import { useCallback, useEffect, useRef } from "react";
import { z } from "zod";
import { apiClient, useApi } from "./useApi";

type UseFetchOptions = RequestOptions & {
  noCache?: boolean;
  revalidate?: boolean;
  ttl?: number;
  enabled?: boolean;
};

export const useFetch = <T,>(
  url: string,
  schema: z.ZodType<T>,
  options?: UseFetchOptions
) => {
  const { cache } = useDataStore();
  const key = generateCacheKey(url, options?.params);
  const cachedData = cache[key]?.data as T | undefined;
  const isInitialMount = useRef(true);

  const {
    data,
    isLoading,
    error,
    execute: fetchData,
  } = useApi(() => apiClient.request("get", url, schema, options), cachedData);

  useEffect(() => {
    if (options?.enabled === false) return;

    if (isInitialMount.current || options?.revalidate) {
      isInitialMount.current = false;
      fetchData();
    }
  }, [url, fetchData, options?.enabled, options?.revalidate]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  const invalidateCache = useCallback(async () => {
    useDataStore.getState().invalidateCache(key);
    await refetch();
  }, [key, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidateCache,
  };
};
