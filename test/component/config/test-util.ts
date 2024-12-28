import { renderHook } from "@testing-library/react";

export * from "@testing-library/react";
export { renderHook };

import { waitFor as baseWaitFor } from "@testing-library/react";

type WaitForOptions = {
  timeout?: number;
  interval?: number;
};

export const waitFor = async (
  callback: () => void | Promise<void>,
  options: WaitForOptions = {}
) =>
  baseWaitFor(callback, {
    timeout: 5000,
    interval: 100,
    ...options,
  });
