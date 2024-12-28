import { setupServer } from "msw/node";
import { userHandlers } from "./handlers/user.handlers";

export const server = setupServer(...userHandlers);
