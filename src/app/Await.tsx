import * as React from "react";

import { cache } from "~/core/cache";
import { invariant } from "~/core/invariant";

type Cache = ReturnType<typeof cache>;

type BaseProps = {
  function: Parameters<typeof cache>[0];
};

type WithChildrenProps = BaseProps & {
  fallback: React.SuspenseProps["fallback"];
  children: React.ReactNode;
  delayFallbackMs?: number;
};

type WithoutChildrenProps = BaseProps;

type Props = WithChildrenProps | WithoutChildrenProps;

export function Await(props: Props) {
  const [display_fallback, set_display_fallback] = React.useState(false);

  // const id = React.useId();
  const cacheRef = React.useRef<null | Cache>(null);

  if (!cacheRef.current) {
    // console.debug("setting cacheRef.current", { id });
    cacheRef.current = cache(props.function);
  }

  let delayFallbackMs: number;
  if ("delayFallbackMs" in props && typeof props.delayFallbackMs === "number") {
    delayFallbackMs = props.delayFallbackMs;
  } else {
    delayFallbackMs = 1000;
  }

  React.useEffect(() => {
    const cache = cacheRef.current;

    if (!cache) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    timeoutId = setTimeout(() => {
      // only display fallback if we are still pending
      if (cache.check() === "pending") {
        set_display_fallback(true);
      }
    }, delayFallbackMs);

    return function cleanup() {
      clearTimeout(timeoutId);
    };
  }, [delayFallbackMs]);

  invariant(cacheRef.current, "cache must exist");

  if ("fallback" in props) {
    return (
      <React.Suspense fallback={!display_fallback ? null : props.fallback}>
        <ReadCache cache={cacheRef.current}>{props.children}</ReadCache>
      </React.Suspense>
    );
  }

  return <ReadCache cache={cacheRef.current} />;
}

type ReadCacheProps = {
  cache: Cache;
  children?: React.ReactNode;
};

function ReadCache(props: ReadCacheProps) {
  props.cache.read();
  return props.children;
}
