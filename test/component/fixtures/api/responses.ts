export const mockResponses = {
  success: {
    data: { id: "1", type: "test" },
    meta: { timestamp: "2024-01-01T00:00:00Z" },
  },
  error: {
    _tag: "ApiError",
    key: "NETWORK_ERROR",
    messages: ["Network error occurred"],
    status: 500,
  },
};
