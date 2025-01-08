import { pipe } from "fp-ts/function";
import * as TE from "fp-ts/TaskEither";
import ky, { HTTPError, type Options as KyOptions } from "ky";
import { z, ZodError } from "zod";
import { generateCacheKey, useDataStore } from "./cache";
import { ApiError, BaseApiError } from "./errors";
import { ErrorKeys, HttpMethod, RequestOptions } from "./types";

const jsonParseTE = <T>(
  response: Response,
  schema: z.ZodType<T>
): TE.TaskEither<BaseApiError, T> =>
  TE.tryCatch(
    async () => {
      const json = await response.json();
      return schema.parse(json);
    },
    (error) => {
      if (error instanceof ZodError) {
        return ApiError(
          ErrorKeys.VALIDATION_ERROR,
          error.errors.map((err) => err.message),
          response.status
        );
      }
      return ApiError(
        ErrorKeys.NETWORK_ERROR,
        ["Failed to parse response body as JSON"],
        response.status
      );
    }
  );

const handleError = (error: unknown): BaseApiError => {
  if (error instanceof HTTPError && error.response) {
    return ApiError(
      ErrorKeys.NETWORK_ERROR,
      ["HTTP request failed"],
      error.response.status
    );
  }
  return ApiError(
    ErrorKeys.INTERNAL_ERROR,
    [error instanceof Error ? error.message : "An unexpected error occurred"],
    500
  );
};

export const createApiClient = (
  baseUrl: string,
  defaultOptions: KyOptions = {}
) => {
  const api = ky.create({
    prefixUrl: baseUrl,
    timeout: 30000,
    retry: {
      limit: 2,
      methods: ["get", "put", "head", "delete", "options"],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    },
    hooks: {
      beforeRequest: [
        (request) => {
          request.headers.set("Content-Type", "application/json");
        },
      ],
    },
    ...defaultOptions,
  });

  const makeRequest = (
    method: HttpMethod,
    url: string,
    options?: RequestOptions
  ): TE.TaskEither<BaseApiError, Response> => {
    return TE.tryCatch(() => {
      switch (method) {
        case "get":
          return api.get(url, {
            ...options,
            searchParams: options?.params as Record<string, string>,
          });
        case "post":
          return api.post(url, { ...options, json: options?.json });
        case "put":
          return api.put(url, { ...options, json: options?.json });
        case "patch":
          return api.patch(url, { ...options, json: options?.json });
        case "delete":
          return api.delete(url, {
            ...options,
            searchParams: options?.params as Record<string, string>,
          });
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    }, handleError);
  };

  const request = <T>(
    method: HttpMethod,
    url: string,
    schema: z.ZodType<T>,
    options?: RequestOptions & {
      noCache?: boolean;
      ttl?: number;
    }
  ): TE.TaskEither<BaseApiError, T> => {
    const fetcher = () =>
      pipe(
        makeRequest(method, url, options),
        TE.chain((response) => jsonParseTE(response, schema))
      );

    // GETリクエストのみキャッシュを使用
    if (method === "get" && !options?.noCache) {
      const key = generateCacheKey(url, options?.params);
      return useDataStore.getState().fetchData(fetcher, key, options);
    }

    return fetcher();
  };

  return {
    request,
  };
};
