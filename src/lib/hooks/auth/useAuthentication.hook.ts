import { Layer } from "effect";
import { useState } from "react";
import { Authentication } from "./authentication.interface";

export const useAuthentication = (config: AuthConfig) => {
  const [isLoading, setIsLoading] = useState(false);

  const authLayer = Layer.effect(() => Authentication);
};
