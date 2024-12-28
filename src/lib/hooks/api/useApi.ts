/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApiClient } from "@/lib/api/client";
import { BaseApiError } from "@/lib/api/types";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/function";
import { useCallback, useState } from "react";

export const apiClient = createApiClient(
  "https://jsonplaceholder.typicode.com"
);

export type ApiState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: BaseApiError | null;
};

export const useApi = <T, P extends any[]>(
  apiFunction: (...args: P) => TE.TaskEither<BaseApiError, T>,
  initialData?: T
) => {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: P) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const program = pipe(
        apiFunction(...args),
        TE.map((data) => {
          setState({ data, isLoading: false, error: null });
          return data;
        }),
        TE.mapLeft((error) => {
          setState((prev) => ({ ...prev, error, isLoading: false }));
          return error;
        })
      );

      await program();
    },
    [apiFunction]
  );

  return {
    ...state,
    execute,
  };
};
