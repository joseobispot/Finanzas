import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client-side hydration; avoids the theme-toggle flash without setState-in-effect. */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
