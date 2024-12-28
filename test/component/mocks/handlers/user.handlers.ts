import { http, HttpResponse } from "msw";

export const userHandlers = [
  http.get("https://api.example.com/users", () => {
    return HttpResponse.json([
      { id: 1, name: "Test User 1" },
      { id: 2, name: "Test User 2" },
    ]);
  }),

  http.get("https://api.example.com/users/:id", () => {
    return HttpResponse.json({ id: 1, name: "Test User 1" });
  }),

  http.post("https://api.example.com/users", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, body });
  }),
];
