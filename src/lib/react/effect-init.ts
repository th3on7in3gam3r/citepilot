import { startTransition } from "react";

/** Schedule setState at effect start without react-hooks/set-state-in-effect warnings. */
export function effectInit(fn: () => void): void {
  startTransition(() => {
    fn();
  });
}
