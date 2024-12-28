// test/component/mocks/handlers/user.handlers.ts
import { http, HttpResponse } from "msw";
import { TEST_ENV } from "../../config/env";

export const userHandlers = [
  http.get(`${TEST_ENV.BASE_URL}/users/1`, () => {
    return HttpResponse.json({
      id: 1,
      name: "Test User 1",
    });
  }),

  http.post(`${TEST_ENV.BASE_URL}/users`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 3,
      body,
    });
  }),

  http.get(`${TEST_ENV.BASE_URL}/users/error`, () => {
    return HttpResponse.error();
  }),
];
