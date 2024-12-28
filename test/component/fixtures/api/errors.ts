import { ErrorKeys } from "@/lib/api/types";

export const apiErrors = {
  network: {
    _tag: "ApiError",
    key: ErrorKeys.NETWORK_ERROR,
    messages: ["Network error occurred"],
    status: 500,
  },
  validation: {
    _tag: "ApiError",
    key: ErrorKeys.VALIDATION_ERROR,
    messages: ["Validation failed"],
    status: 400,
  },
  unauthorized: {
    _tag: "ApiError",
    key: ErrorKeys.UNAUTHORIZED,
    messages: ["Unauthorized access"],
    status: 401,
  },
};
