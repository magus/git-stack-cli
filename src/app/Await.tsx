import * as React from "react";

import { cache } from "../core/cache.js";
import { invariant } from "../core/invariant.js";

type Cache = ReturnType<typeof cache>;

type Props = {
  fallback: React.SuspenseProps["fallback"];
  function: Parameters<typeof cache>[0];
  children?: React.ReactNode;
};

export function Await(props: Props) {
  // const id = React.useId();
  const cacheRef = React.useRef<null | Cache>(null);

  if (!cacheRef.current) {
    // console.debug("setting cacheRef.current", { id });
    cacheRef.current = cache(props.function);
  }

  invariant(cacheRef.current, "cache must exist");

  return (
    <React.Suspense fallback={props.fallback}>
      <ReadCache {...props} cache={cacheRef.current} />
    </React.Suspense>
  );
}

type ReadCacheProps = Props & {
  cache: Cache;
};

function ReadCache(props: ReadCacheProps) {
  props.cache.read();
  return props.children;
}
