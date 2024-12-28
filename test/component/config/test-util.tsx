/* eslint-disable react-refresh/only-export-components */
import { type BaseApiError } from "@/lib/api/types";
import { renderHook } from "@testing-library/react";
import * as TE from "fp-ts/TaskEither";

export const createSuccessResponse = <T,>(data: T) => TE.right(data);
export const createErrorResponse = (error: BaseApiError) => TE.left(error);

export const customRenderHook: typeof renderHook = (callback, options) => {
  return renderHook(callback, options);
};

export * from "@testing-library/react";
