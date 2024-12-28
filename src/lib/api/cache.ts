import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { create } from "zustand";
import { BaseApiError } from "./errors";
import { RequestOptions } from "./types";

type CacheData<T> = {
  data: T;
  fetchedAt: number;
};

type CacheState = {
  [key: string]: CacheData<unknown> | undefined;
};

const DEFAULT_CACHE_TTL = 60 * 1000;

export const generateCacheKey = (
  url: string,
  params?: Record<string, unknown>
): string => {
  if (!params) return url;
  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();
  return `${url}?${queryString}`;
};

type DataStore = {
  cache: CacheState;
  fetchData: <T>(
    fetcher: (options?: RequestOptions) => TE.TaskEither<BaseApiError, T>,
    key: string,
    options?: RequestOptions & { ttl?: number }
  ) => TE.TaskEither<BaseApiError, T>;
  invalidateCache: (key: string) => void;
  clearCache: () => void;
};

export const useDataStore = create<DataStore>((set, get) => ({
  cache: {},

  fetchData: <T>(
    fetcher: (options?: RequestOptions) => TE.TaskEither<BaseApiError, T>,
    key: string,
    options?: RequestOptions & { ttl?: number }
  ) => {
    const { cache } = get();
    const cachedData = cache[key] as CacheData<T> | undefined;
    const ttl = options?.ttl ?? DEFAULT_CACHE_TTL;

    const isCacheValid = cachedData && Date.now() - cachedData.fetchedAt < ttl;

    if (isCacheValid) {
      return TE.right(cachedData.data);
    }

    return pipe(
      fetcher(options),
      TE.map((data) => {
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: { data, fetchedAt: Date.now() },
          },
        }));
        return data;
      })
    );
  },

  invalidateCache: (key: string) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: undefined,
      },
    }));
  },

  clearCache: () => {
    set({ cache: {} });
  },
}));

export const fetchDataWrapper = <T>(
  fetcher: (options?: RequestOptions) => TE.TaskEither<BaseApiError, T>,
  url: string,
  options?: RequestOptions & { ttl?: number }
): TE.TaskEither<BaseApiError, T> => {
  const key = generateCacheKey(url, options?.params);
  return useDataStore.getState().fetchData(fetcher, key, options);
};
