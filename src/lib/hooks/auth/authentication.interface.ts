import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { AuthError } from "./authentication.model";

export interface Authentications {
  readonly login: (
    username: string,
    password: string
  ) => Effect.Effect<never, AuthError, void>;
  readonly initiateLogin: () => Effect.Effect<never, never, void>;
}

export const Authentication = Context.Tag<"Authentication">();
