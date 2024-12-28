import { type Options as KyOptions } from "ky";

// 共通の型を定義
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type RequestOptions = KyOptions & {
  params?: Record<string, unknown>;
  json?: unknown; // `unknown` を使用して、任意の型を受け入れるように変更
};

export type BaseApiError = {
  readonly _tag: "ApiError"; // 識別用のタグを追加
  key: ErrorKey;
  messages: string[];
  status: number;
  details?: ErrorDetail[];
};

export type ErrorDetail = {
  field: string;
  code: string;
  message: string;
};

export type ErrorKey = (typeof ErrorKeys)[keyof typeof ErrorKeys];

export const ErrorKeys = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;
