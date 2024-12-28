import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import { create } from "zustand";
import { BaseApiError } from "./errors";
import { RequestOptions } from "./types";

// キャッシュの型
type CacheData<T> = {
  data: T;
  fetchedAt: number;
};

type CacheState = {
  [key: string]: CacheData<unknown> | undefined;
};

// キャッシュの有効期限 (例: 60秒)
const CACHE_TTL = 60 * 1000;

// キー生成関数
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

// Zustand store
type DataStore = {
  cache: CacheState;
  isLoading: boolean;
  error: BaseApiError | null;
  fetchData: <T>(
    fetcher: (options?: RequestOptions) => TE.TaskEither<BaseApiError, T>,
    key: string,
    options?: RequestOptions,
    config?: { ttl?: number }
  ) => TE.TaskEither<BaseApiError, T>;
  revalidate: (key: string) => TE.TaskEither<never, void>;
};

export const useDataStore = create<DataStore>((set, get) => ({
  cache: {},
  isLoading: false,
  error: null,
  fetchData: <T>(
    fetcher: (options?: RequestOptions) => TE.TaskEither<BaseApiError, T>,
    key: string,
    options?: RequestOptions,
    config?: { ttl?: number }
  ) =>
    pipe(
      TE.Do,
      TE.bind("cache", () => TE.of(get().cache)),
      TE.let("currentCache", ({ cache }) => cache[key]),
      TE.let("ttl", () => config?.ttl ?? CACHE_TTL),
      TE.let(
        "isCacheValid",
        ({ currentCache, ttl }) =>
          !!currentCache && Date.now() - currentCache.fetchedAt < ttl
      ),
      TE.chain(({ isCacheValid, currentCache }) =>
        isCacheValid
          ? TE.right(currentCache?.data as T) // キャッシュが有効な場合は、キャッシュからデータを返す
          : pipe(
              // キャッシュがないか古い場合は、データを取得する
              TE.of(undefined),
              TE.tap(() =>
                currentCache
                  ? TE.of(
                      set((state) => ({
                        cache: { ...state.cache, [key]: currentCache },
                      }))
                    )
                  : TE.of(set({ isLoading: true }))
              ),
              TE.chain(() => fetcher(options)),
              TE.map((data) => {
                const newCacheData: CacheData<T> = {
                  data,
                  fetchedAt: Date.now(),
                };
                set((state) => ({
                  cache: { ...state.cache, [key]: newCacheData },
                  isLoading: false,
                  error: null,
                }));
                return data; // データを返す
              })
            )
      ),
      TE.tapError((error) =>
        TE.fromIO(() => {
          set({ error, isLoading: false });
        })
      )
    ),
  revalidate: (key: string) =>
    pipe(
      TE.of(undefined),
      TE.chain(() =>
        TE.fromIO(() => {
          const { cache } = get();
          const currentCache = cache[key];
          if (currentCache) {
            set((state) => ({
              cache: { ...state.cache, [key]: undefined },
            }));
          }
        })
      )
    ),
}));

// fetchDataをラップする関数
export const fetchDataWrapper = <T>(
  fetcher: (options?: RequestOptions) => TE.TaskEither<BaseApiError, T>,
  url: string,
  options?: RequestOptions,
  config?: { ttl?: number }
): TE.TaskEither<BaseApiError, T> => {
  const key = generateCacheKey(url, options?.params);
  return useDataStore.getState().fetchData(fetcher, key, options, config);
};
