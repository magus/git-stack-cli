import * as React from "react";

import { cache } from "../core/cache.js";
import { invariant } from "../core/invariant.js";

type Cache = ReturnType<typeof cache>;

type BaseProps = {
  function: Parameters<typeof cache>[0];
};

type WithChildrenProps = BaseProps & {
  fallback: React.SuspenseProps["fallback"];
  children: React.ReactNode;
  function: Parameters<typeof cache>[0];
};

type WithoutChildrenProps = BaseProps;

type Props = WithChildrenProps | WithoutChildrenProps;

export function Await(props: Props) {
  // const id = React.useId();
  const cacheRef = React.useRef<null | Cache>(null);

  if (!cacheRef.current) {
    // console.debug("setting cacheRef.current", { id });
    cacheRef.current = cache(props.function);
  }

  invariant(cacheRef.current, "cache must exist");

  if ("fallback" in props) {
    return (
      <React.Suspense fallback={props.fallback}>
        <ReadCache {...props} cache={cacheRef.current} />
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
