// test/component/mocks/handlers/user.handlers.ts
import { ApiError, ErrorKeys } from "@/lib/api/errors";
import { TEST_ENV } from "@test/component/config/env";
import { http, HttpResponse } from "msw";

type CreateUserRequest = {
  name: string;
};

export const userHandlers = [
  // GETリクエストのモック
  http.get(`${TEST_ENV.BASE_URL}/users/1`, () => {
    return HttpResponse.json(
      {
        id: 1,
        name: "Test User 1",
      },
      { status: 200 }
    );
  }),

  // POSTリクエストのモック
  http.post(`${TEST_ENV.BASE_URL}/users`, async ({ request }) => {
    const data = (await request.json()) as CreateUserRequest;
    return HttpResponse.json(
      {
        id: 3,
        ...data,
      },
      { status: 201 }
    );
  }),

  // エラーケースのモック
  http.get(`${TEST_ENV.BASE_URL}/users/error`, () => {
    return HttpResponse.json(
      ApiError(ErrorKeys.INTERNAL_ERROR, ["Internal Server Error"], 500),
      {
        status: 500,
      }
    );
  }),
];
