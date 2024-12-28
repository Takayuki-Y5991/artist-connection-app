import { BaseApiError, ErrorDetail, ErrorKey, ErrorKeys } from "./types";

export const ApiError = (
  key: ErrorKey,
  messages: string[],
  status: number,
  details?: ErrorDetail[]
): BaseApiError => ({
  _tag: "ApiError",
  key,
  messages,
  status,
  details,
});

export const fromResponse = (
  response: Response,
  messages: string[]
): BaseApiError =>
  ApiError(getErrorKeyFromStatus(response.status), messages, response.status);

const getErrorKeyFromStatus = (status: number): ErrorKey => {
  switch (status) {
    case 400:
      return ErrorKeys.VALIDATION_ERROR;
    case 401:
      return ErrorKeys.UNAUTHORIZED;
    case 403:
      return ErrorKeys.FORBIDDEN;
    case 404:
      return ErrorKeys.NOT_FOUND;
    case 409:
      return ErrorKeys.CONFLICT;
    case 503:
      return ErrorKeys.SERVICE_UNAVAILABLE;
    default:
      return ErrorKeys.INTERNAL_ERROR;
  }
};

export type { BaseApiError, ErrorDetail, ErrorKey };
